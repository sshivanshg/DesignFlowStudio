import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertClientSchema, 
  insertProjectSchema,
  insertProposalSchema,
  insertMoodboardSchema,
  insertEstimateSchema,
  insertActivitySchema,
  insertLeadSchema,
  insertSubscriptionSchema,
  User,
  Lead
} from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { 
  generateDesignInsights, 
  analyzeClientFeedback, 
  generateMoodboardSuggestions,
  DesignInsightRequest 
} from "./ai";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "interior-design-saas-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 86400000 }, // 24 hours
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Configure passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      // If missing a required field, the insertUserSchema validation will catch it
      // but let's manually ensure name is set from fullName if not present
      let userData = req.body;
      if (!userData.name && userData.fullName) {
        userData.name = userData.fullName;
      }

      // Now parse with our schema
      userData = insertUserSchema.parse(userData);
      
      // Check if user with the same username or email already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Check if user with this supabaseUid already exists
      if (userData.supabaseUid) {
        const existingUserBySupabaseUid = await storage.getUserBySupabaseUid(userData.supabaseUid);
        if (existingUserBySupabaseUid) {
          return res.status(400).json({ message: "User with this Supabase ID already exists" });
        }
      }
      
      const user = await storage.createUser(userData);
      
      // Automatically log in the user after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        return res.status(201).json({ user });
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, (req, res) => {
    res.json({ user: req.user });
  });
  
  // New route for Supabase authentication
  app.post("/api/auth/supabase-auth", async (req, res) => {
    try {
      const { supabaseUid, email } = req.body;
      
      if (!supabaseUid || !email) {
        return res.status(400).json({ message: "Missing Supabase user data" });
      }
      
      console.log("Supabase auth request:", { supabaseUid, email });
      
      // Try to find user by Supabase UID
      let user = null;
      try {
        user = await storage.getUserBySupabaseUid(supabaseUid);
        console.log("Supabase user lookup by UID result:", user ? "Found" : "Not found");
      } catch (error) {
        console.error("Error looking up user by Supabase UID:", error);
      }
      
      // If not found, try by email (for users who existed before Supabase integration)
      if (!user) {
        try {
          user = await storage.getUserByEmail(email);
          console.log("Supabase user lookup by email result:", user ? "Found" : "Not found");
          
          // If user exists by email but doesn't have supabaseUid, update it
          if (user && !user.supabaseUid) {
            try {
              user = await storage.updateUser(user.id, { supabaseUid });
              console.log("Updated existing user with Supabase UID");
            } catch (error) {
              console.error("Error updating existing user with Supabase UID:", error);
            }
          }
        } catch (error) {
          console.error("Error looking up user by email:", error);
        }
      }
      
      // If user still not found, create a new one
      if (!user) {
        // Create a new user
        const displayName = email ? email.split('@')[0] : `User ${Date.now()}`;
        
        // Generate a random secure password (since auth is handled by Supabase)
        const randomPassword = Math.random().toString(36).slice(-8) + 
                              Math.random().toString(36).slice(-8);
        
        const displayNameValue = displayName || email?.split('@')[0] || `New User`;
        const usernameValue = email?.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || `user_${Date.now()}`;
        
        // Use the correct schema structure - it will be properly mapped in the storage.createUser method
        const userDataForInsert = {
          name: displayNameValue,
          username: usernameValue,
          password: randomPassword,
          email,
          fullName: displayNameValue, // Use camelCase for the schema - will be mapped to full_name in DB
          role: "designer" as const,
          supabaseUid,
          company: null,
          phone: null
        };
        
        console.log("Creating new Supabase user with data:", {
          ...userDataForInsert,
          password: "[REDACTED]" // Don't log the actual password
        });
        
        try {
          user = await storage.createUser(userDataForInsert);
          console.log("Successfully created new Supabase user with ID:", user.id);
        } catch (error) {
          console.error("Error creating Supabase user:", error);
          return res.status(500).json({
            message: "Failed to create user account", 
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          console.error("Error during login:", err);
          return res.status(500).json({ message: "Error logging in with Supabase" });
        }
        console.log("Successfully logged in Supabase user:", user.id);
        return res.json({ user });
      });
    } catch (error) {
      console.error("Supabase auth error:", error);
      res.status(500).json({ message: "Error authenticating with Supabase" });
    }
  });
  
  // Firebase authentication route
  app.post("/api/auth/firebase-auth", async (req, res) => {
    try {
      const { firebaseUid, phone, email, displayName, photoURL } = req.body;
      
      if (!firebaseUid) {
        return res.status(400).json({ message: "Missing Firebase UID" });
      }
      
      console.log("Firebase auth request:", { firebaseUid, email, displayName });
      
      // Check if user with this Firebase UID exists
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (user) {
        console.log("Found existing user by Firebase UID:", user.id);
        // Update existing user if needed
        const updates: any = {};
        
        if (phone && user.phone !== phone) {
          updates.phone = phone;
        }
        
        if (email && user.email !== email) {
          updates.email = email;
        }
        
        if (displayName && user.fullName !== displayName) {
          updates.fullName = displayName;
        }
        
        if (photoURL && user.avatar !== photoURL) {
          updates.avatar = photoURL;
        }
        
        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          console.log("Updating user with:", updates);
          user = await storage.updateUser(user.id, updates);
        }
      } else if (email) {
        // Try to find by email if we couldn't find by Firebase UID
        user = await storage.getUserByEmail(email);
        
        if (user) {
          console.log("Found existing user by email:", user.id);
          // Update the Firebase UID
          user = await storage.updateUser(user.id, { 
            firebaseUid,
            ...(displayName && { fullName: displayName }),
            ...(photoURL && { avatar: photoURL }),
            ...(phone && { phone })
          });
        } else {
          console.log("Creating new user for Firebase auth");
          // Create a new user
          const randomPassword = Math.random().toString(36).slice(-8);
          
          // Generate a username from email
          let usernameBase = email.split('@')[0];
          
          // Try to find an available username
          let availableUsername = usernameBase;
          let counter = 1;
          let existingUser = await storage.getUserByUsername(availableUsername);
          
          while (existingUser) {
            availableUsername = `${usernameBase}${counter}`;
            counter++;
            existingUser = await storage.getUserByUsername(availableUsername);
          }
          
          // Create the user with default role 'designer'
          const userData = {
            username: availableUsername,
            password: randomPassword, // This is just for compatibility, they'll use Firebase auth
            email: email,
            fullName: displayName || email.split('@')[0] || 'New User',
            name: displayName || email.split('@')[0] || 'New User', // Add name field to match schema
            role: 'designer' as const,
            phone: phone || null,
            avatar: photoURL || null,
            firebaseUid,
            company: null
          };
          
          console.log("Creating user with data:", userData);
          try {
            user = await storage.createUser(userData);
            console.log("Successfully created new user with ID:", user.id);
          } catch (error) {
            console.error("Error creating user:", error);
            return res.status(500).json({
              message: "Failed to create user account",
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
        }
      } else {
        // Handle case where we have no email
        console.log("Creating new user with phone or default info");
        // Create a new user
        const randomPassword = Math.random().toString(36).slice(-8);
        
        // Generate a username
        const usernameBase = phone ? 
          `user_${phone.replace(/\D/g, '')}` : 
          `user_${firebaseUid.substring(0, 8)}`;
        
        // Try to find an available username
        let availableUsername = usernameBase;
        let counter = 1;
        let existingUser = await storage.getUserByUsername(availableUsername);
        
        while (existingUser) {
          availableUsername = `${usernameBase}${counter}`;
          counter++;
          existingUser = await storage.getUserByUsername(availableUsername);
        }
        
        // Use a dummy email since we require it
        const dummyEmail = `${availableUsername}@example.com`;
        
        // Create the user with default role 'designer'
        const displayNameValue = displayName || phone || 'New User';
        
        const userData = {
          username: availableUsername,
          password: randomPassword,
          email: dummyEmail,
          fullName: displayNameValue,
          name: displayNameValue, // Add name field to match schema
          role: 'designer' as const,
          phone: phone || null,
          avatar: photoURL || null,
          firebaseUid,
          company: null
        };
        
        console.log("Creating user with data:", userData);
        try {
          user = await storage.createUser(userData);
          console.log("Successfully created new phone-based user with ID:", user.id);
        } catch (error) {
          console.error("Error creating phone-based user:", error);
          return res.status(500).json({
            message: "Failed to create user account",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Error during login:", err);
          return res.status(500).json({ message: "Error logging in with Firebase" });
        }
        console.log("Successfully logged in user:", user.id);
        return res.json({ user });
      });
      
    } catch (error) {
      console.error("Firebase auth error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error authenticating with Firebase" });
    }
  });

  // Client routes
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const clients = await storage.getClients(userId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const client = await storage.getClient(parseInt(req.params.id));
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client" });
    }
  });

  app.post("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const clientData = insertClientSchema.parse({ ...req.body, userId });
      const client = await storage.createClient(clientData);
      
      // Create activity for new client
      await storage.createActivity({
        user_id: userId,
        client_id: client.id,
        type: "client_created",
        description: `Added ${client.name} as a new client`,
        metadata: {}
      });
      
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating client" });
    }
  });

  app.patch("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const clientData = req.body;
      const updatedClient = await storage.updateClient(clientId, clientData);
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Create activity for updated client
      await storage.createActivity({
        user_id: (req.user as any).id,
        client_id: clientId,
        type: "client_updated",
        description: `Updated client information for ${updatedClient.name}`,
        metadata: {}
      });
      
      res.json(updatedClient);
    } catch (error) {
      res.status(500).json({ message: "Error updating client" });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const deleted = await storage.deleteClient(clientId);
      
      if (deleted) {
        // Create activity for deleted client
        await storage.createActivity({
          user_id: (req.user as any).id,
          type: "client_deleted",
          description: `Removed client ${client.name}`,
          metadata: {}
        });
        
        return res.json({ success: true });
      }
      
      res.status(500).json({ message: "Error deleting client" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting client" });
    }
  });

  // Lead routes
  app.get("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const leads = await storage.getLeads(userId);
      res.json(leads);
    } catch (error) {
      console.error("Error getting leads:", error);
      res.status(500).json({ message: "Error retrieving leads" });
    }
  });
  
  app.get("/api/leads/stage/:stage", isAuthenticated, async (req, res) => {
    try {
      const stage = req.params.stage;
      const leads = await storage.getLeadsByStage(stage);
      res.json(leads);
    } catch (error) {
      console.error("Error getting leads by stage:", error);
      res.status(500).json({ message: "Error retrieving leads by stage" });
    }
  });
  
  app.get("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error getting lead:", error);
      res.status(500).json({ message: "Error retrieving lead" });
    }
  });
  
  app.post("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const { name, phone, email, source, stage, tag, notes, followUpDate } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      const userId = (req.user as any).id;
      
      const newLead = await storage.createLead({
        name,
        phone: phone || null,
        email: email || null,
        source: source || null,
        stage: stage || "new",
        tag: tag || null,
        assignedTo: userId,
        notes: notes || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null
      });
      
      // Create activity for new lead
      await storage.createActivity({
        user_id: userId,
        type: "lead_created",
        description: `Added new lead: ${name}`,
        metadata: { source, stage }
      });
      
      res.status(201).json(newLead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Error creating lead" });
    }
  });
  
  app.patch("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      const { name, phone, email, source, stage, tag, notes, followUpDate, assignedTo } = req.body;
      const updatedData: Partial<Lead> = {};
      
      if (name !== undefined) updatedData.name = name;
      if (phone !== undefined) updatedData.phone = phone;
      if (email !== undefined) updatedData.email = email;
      if (source !== undefined) updatedData.source = source;
      if (stage !== undefined) updatedData.stage = stage;
      if (tag !== undefined) updatedData.tag = tag;
      if (notes !== undefined) updatedData.notes = notes;
      if (followUpDate !== undefined) updatedData.followUpDate = followUpDate ? new Date(followUpDate) : null;
      if (assignedTo !== undefined) updatedData.assignedTo = assignedTo;
      
      const updatedLead = await storage.updateLead(leadId, updatedData);
      
      // Create activity for updated lead
      if (stage && stage !== lead.stage) {
        await storage.createActivity({
          user_id: (req.user as any).id,
          type: "lead_stage_changed",
          description: `Changed lead "${lead.name}" stage from ${lead.stage} to ${stage}`,
          metadata: { previousStage: lead.stage, newStage: stage }
        });
      } else {
        await storage.createActivity({
          user_id: (req.user as any).id,
          type: "lead_updated",
          description: `Updated lead information for ${lead.name}`,
          metadata: {}
        });
      }
      
      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Error updating lead" });
    }
  });
  
  app.delete("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      const deleted = await storage.deleteLead(leadId);
      
      if (deleted) {
        // Create activity for deleted lead
        await storage.createActivity({
          user_id: (req.user as any).id,
          type: "lead_deleted",
          description: `Removed lead ${lead.name}`,
          metadata: {}
        });
        
        return res.json({ success: true });
      }
      
      res.status(500).json({ message: "Error deleting lead" });
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Error deleting lead" });
    }
  });
  
  // Project routes
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Error fetching projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project" });
    }
  });

  app.get("/api/clients/:clientId/projects", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const projects = await storage.getProjectsByClientId(clientId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client projects" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const projectData = insertProjectSchema.parse({ ...req.body, userId });
      const project = await storage.createProject(projectData);
      
      // Create activity for new project
      await storage.createActivity({
        user_id: userId,
        client_id: project.client_id,
        project_id: project.id,
        type: "project_created",
        description: `Created new project: ${project.name}`,
        metadata: {}
      });
      
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating project" });
    }
  });

  app.patch("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const projectData = req.body;
      const updatedProject = await storage.updateProject(projectId, projectData);
      
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Create activity for updated project
      await storage.createActivity({
        user_id: (req.user as any).id,
        client_id: updatedProject.client_id,
        project_id: projectId,
        type: "project_updated",
        description: `Updated project: ${updatedProject.name}`,
        metadata: {}
      });
      
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: "Error updating project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const deleted = await storage.deleteProject(projectId);
      
      if (deleted) {
        // Create activity for deleted project
        await storage.createActivity({
          user_id: (req.user as any).id,
          client_id: project.client_id,
          type: "project_deleted",
          description: `Deleted project: ${project.name}`,
          metadata: {}
        });
        
        return res.json({ success: true });
      }
      
      res.status(500).json({ message: "Error deleting project" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting project" });
    }
  });

  // Proposal routes
  app.get("/api/proposals", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const proposals = await storage.getProposals(userId);
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching proposals" });
    }
  });

  app.get("/api/proposals/:id", isAuthenticated, async (req, res) => {
    try {
      const proposal = await storage.getProposal(parseInt(req.params.id));
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      res.json(proposal);
    } catch (error) {
      res.status(500).json({ message: "Error fetching proposal" });
    }
  });

  app.get("/api/projects/:projectId/proposals", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const proposals = await storage.getProposalsByProjectId(projectId);
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project proposals" });
    }
  });

  app.post("/api/proposals", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const proposalData = insertProposalSchema.parse({ ...req.body, userId });
      const proposal = await storage.createProposal(proposalData);
      
      // Create activity for new proposal
      await storage.createActivity({
        user_id: userId,
        client_id: proposal.client_id,
        project_id: proposal.project_id,
        type: "proposal_created",
        description: `Created new proposal: ${proposal.title || 'Untitled'}`,
        metadata: {}
      });
      
      res.status(201).json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating proposal" });
    }
  });

  app.patch("/api/proposals/:id", isAuthenticated, async (req, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const proposalData = req.body;
      const updatedProposal = await storage.updateProposal(proposalId, proposalData);
      
      if (!updatedProposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      // Create activity for updated proposal
      await storage.createActivity({
        user_id: (req.user as any).id,
        client_id: updatedProposal.client_id,
        project_id: updatedProposal.project_id,
        type: "proposal_updated",
        description: `Updated proposal: ${updatedProposal.title || 'Untitled'}`,
        metadata: {}
      });
      
      res.json(updatedProposal);
    } catch (error) {
      res.status(500).json({ message: "Error updating proposal" });
    }
  });

  app.delete("/api/proposals/:id", isAuthenticated, async (req, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const proposal = await storage.getProposal(proposalId);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      const deleted = await storage.deleteProposal(proposalId);
      
      if (deleted) {
        // Create activity for deleted proposal
        await storage.createActivity({
          user_id: (req.user as any).id,
          client_id: proposal.client_id,
          project_id: proposal.project_id,
          type: "proposal_deleted",
          description: `Deleted proposal: ${proposal.title || 'Untitled'}`,
          metadata: {}
        });
        
        return res.json({ success: true });
      }
      
      res.status(500).json({ message: "Error deleting proposal" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting proposal" });
    }
  });

  // Moodboard routes
  app.get("/api/moodboards", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const moodboards = await storage.getMoodboards(userId);
      res.json(moodboards);
    } catch (error) {
      res.status(500).json({ message: "Error fetching moodboards" });
    }
  });

  app.get("/api/moodboards/:id", isAuthenticated, async (req, res) => {
    try {
      const moodboard = await storage.getMoodboard(parseInt(req.params.id));
      if (!moodboard) {
        return res.status(404).json({ message: "Moodboard not found" });
      }
      res.json(moodboard);
    } catch (error) {
      res.status(500).json({ message: "Error fetching moodboard" });
    }
  });

  app.get("/api/projects/:projectId/moodboards", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const moodboards = await storage.getMoodboardsByProjectId(projectId);
      res.json(moodboards);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project moodboards" });
    }
  });

  app.post("/api/moodboards", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const moodboardData = insertMoodboardSchema.parse({ ...req.body, userId });
      const moodboard = await storage.createMoodboard(moodboardData);
      
      // Get project to get client ID
      const project = await storage.getProject(moodboard.project_id);
      
      // Create activity for new moodboard
      if (project) {
        await storage.createActivity({
          user_id: userId,
          client_id: project.client_id,
          project_id: moodboard.project_id,
          type: "moodboard_created",
          description: `Created new moodboard: ${moodboard.name || 'Untitled'}`,
          metadata: {}
        });
      }
      
      res.status(201).json(moodboard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating moodboard" });
    }
  });

  app.patch("/api/moodboards/:id", isAuthenticated, async (req, res) => {
    try {
      const moodboardId = parseInt(req.params.id);
      const moodboardData = req.body;
      const updatedMoodboard = await storage.updateMoodboard(moodboardId, moodboardData);
      
      if (!updatedMoodboard) {
        return res.status(404).json({ message: "Moodboard not found" });
      }
      
      // Get project to get client ID
      const project = await storage.getProject(updatedMoodboard.project_id);
      
      // Create activity for updated moodboard
      if (project) {
        await storage.createActivity({
          user_id: (req.user as any).id,
          client_id: project.client_id,
          project_id: updatedMoodboard.project_id,
          type: "moodboard_updated",
          description: `Updated moodboard: ${updatedMoodboard.name || 'Untitled'}`,
          metadata: {}
        });
      }
      
      res.json(updatedMoodboard);
    } catch (error) {
      res.status(500).json({ message: "Error updating moodboard" });
    }
  });

  app.delete("/api/moodboards/:id", isAuthenticated, async (req, res) => {
    try {
      const moodboardId = parseInt(req.params.id);
      const moodboard = await storage.getMoodboard(moodboardId);
      
      if (!moodboard) {
        return res.status(404).json({ message: "Moodboard not found" });
      }
      
      const deleted = await storage.deleteMoodboard(moodboardId);
      
      if (deleted) {
        // Get project to get client ID
        const project = await storage.getProject(moodboard.project_id);
        
        // Create activity for deleted moodboard
        if (project) {
          await storage.createActivity({
            user_id: (req.user as any).id,
            client_id: project.client_id,
            project_id: moodboard.project_id,
            type: "moodboard_deleted",
            description: `Deleted moodboard: ${moodboard.name || 'Untitled'}`,
            metadata: {}
          });
        }
        
        return res.json({ success: true });
      }
      
      res.status(500).json({ message: "Error deleting moodboard" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting moodboard" });
    }
  });

  // Estimate routes
  app.get("/api/estimates", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const estimates = await storage.getEstimates(userId);
      res.json(estimates);
    } catch (error) {
      res.status(500).json({ message: "Error fetching estimates" });
    }
  });

  app.get("/api/estimates/:id", isAuthenticated, async (req, res) => {
    try {
      const estimate = await storage.getEstimate(parseInt(req.params.id));
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      res.json(estimate);
    } catch (error) {
      res.status(500).json({ message: "Error fetching estimate" });
    }
  });

  app.get("/api/projects/:projectId/estimates", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const estimates = await storage.getEstimatesByProjectId(projectId);
      res.json(estimates);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project estimates" });
    }
  });

  app.post("/api/estimates", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const estimateData = insertEstimateSchema.parse({ ...req.body, userId });
      const estimate = await storage.createEstimate(estimateData);
      
      // Create activity for new estimate
      await storage.createActivity({
        user_id: userId,
        client_id: estimate.client_id,
        project_id: estimate.project_id,
        type: "estimate_created",
        description: `Created new estimate`,
        metadata: {}
      });
      
      res.status(201).json(estimate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating estimate" });
    }
  });

  app.patch("/api/estimates/:id", isAuthenticated, async (req, res) => {
    try {
      const estimateId = parseInt(req.params.id);
      const estimateData = req.body;
      const updatedEstimate = await storage.updateEstimate(estimateId, estimateData);
      
      if (!updatedEstimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      // Create activity for updated estimate
      await storage.createActivity({
        user_id: (req.user as any).id,
        client_id: updatedEstimate.client_id,
        project_id: updatedEstimate.project_id,
        type: "estimate_updated",
        description: `Updated estimate`,
        metadata: {}
      });
      
      res.json(updatedEstimate);
    } catch (error) {
      res.status(500).json({ message: "Error updating estimate" });
    }
  });

  app.delete("/api/estimates/:id", isAuthenticated, async (req, res) => {
    try {
      const estimateId = parseInt(req.params.id);
      const estimate = await storage.getEstimate(estimateId);
      
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      const deleted = await storage.deleteEstimate(estimateId);
      
      if (deleted) {
        // Create activity for deleted estimate
        await storage.createActivity({
          user_id: (req.user as any).id,
          client_id: estimate.client_id,
          project_id: estimate.project_id,
          type: "estimate_deleted",
          description: `Deleted estimate`,
          metadata: {}
        });
        
        return res.json({ success: true });
      }
      
      res.status(500).json({ message: "Error deleting estimate" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting estimate" });
    }
  });

  // Task routes
  // Note: Tasks are now stored in the projects table as an array
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      // Get all projects and extract their tasks
      const projects = await storage.getProjects(userId);
      const allTasks = [];
      
      for (const project of projects) {
        if (project.tasks && Array.isArray(project.tasks)) {
          const projectTasks = project.tasks.map(task => ({
            ...task,
            projectId: project.id,
            projectName: project.name
          }));
          allTasks.push(...projectTasks);
        }
      }
      
      res.json(allTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Error fetching tasks" });
    }
  });

  app.get("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const task = await storage.getTask(parseInt(req.params.id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Error fetching task" });
    }
  });

  app.get("/api/projects/:projectId/tasks", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const tasks = await storage.getTasksByProjectId(projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const taskData = insertTaskSchema.parse({ ...req.body, userId });
      const task = await storage.createTask(taskData);
      
      // Get project to get client ID
      const project = await storage.getProject(task.projectId);
      
      // Create activity for new task
      if (project) {
        await storage.createActivity({
          user_id: userId,
          client_id: project.client_id,
          project_id: task.project_id,
          type: "task_created",
          description: `Created new task: ${task.title}`,
          metadata: {}
        });
      }
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating task" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const taskData = req.body;
      const updatedTask = await storage.updateTask(taskId, taskData);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Get project to get client ID
      const project = await storage.getProject(updatedTask.projectId);
      
      // Create activity for updated task
      if (project) {
        const activityType = updatedTask.completed ? "task_completed" : "task_updated";
        const activityDesc = updatedTask.completed 
          ? `Completed task: ${updatedTask.title}`
          : `Updated task: ${updatedTask.title}`;
        
        await storage.createActivity({
          user_id: (req.user as any).id,
          client_id: project.client_id,
          project_id: updatedTask.project_id,
          type: activityType,
          description: activityDesc,
          metadata: {}
        });
      }
      
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Error updating task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const deleted = await storage.deleteTask(taskId);
      
      if (deleted) {
        // Get project to get client ID
        const project = await storage.getProject(task.projectId);
        
        // Create activity for deleted task
        if (project) {
          await storage.createActivity({
            user_id: (req.user as any).id,
            client_id: project.client_id,
            project_id: task.project_id,
            type: "task_deleted",
            description: `Deleted task: ${task.title}`,
            metadata: {}
          });
        }
        
        return res.json({ success: true });
      }
      
      res.status(500).json({ message: "Error deleting task" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting task" });
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activities" });
    }
  });

  app.get("/api/clients/:clientId/activities", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const activities = await storage.getActivitiesByClientId(clientId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client activities" });
    }
  });

  app.get("/api/projects/:projectId/activities", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const activities = await storage.getActivitiesByProjectId(projectId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project activities" });
    }
  });

  app.post("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const user_id = (req.user as any).id;
      const activityData = insertActivitySchema.parse({ ...req.body, user_id });
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating activity" });
    }
  });

  // AI Design Assistant Routes
  
  // Generate design insights based on project details
  app.post("/api/ai/design-insights", isAuthenticated, async (req, res) => {
    try {
      const insightRequest: DesignInsightRequest = req.body;
      
      if (!insightRequest.projectDescription) {
        return res.status(400).json({ message: "Project description is required" });
      }
      
      const insights = await generateDesignInsights(insightRequest);
      
      // Create an activity to track this AI interaction
      await storage.createActivity({
        user_id: (req.user as any).id,
        client_id: req.body.client_id || null,
        project_id: req.body.project_id || null,
        type: "ai_design_insights",
        description: "Generated AI design insights",
        metadata: { query: insightRequest.projectDescription }
      });
      
      res.json(insights);
    } catch (error) {
      console.error("Error in AI design insights:", error);
      res.status(500).json({ message: "Error generating design insights", error: String(error) });
    }
  });
  
  // Analyze client feedback
  app.post("/api/ai/analyze-feedback", isAuthenticated, async (req, res) => {
    try {
      const { feedback, client_id, project_id } = req.body;
      
      if (!feedback) {
        return res.status(400).json({ message: "Feedback text is required" });
      }
      
      const analysis = await analyzeClientFeedback(feedback);
      
      // Create an activity to track this AI interaction
      await storage.createActivity({
        user_id: (req.user as any).id,
        client_id: client_id || null,
        project_id: project_id || null,
        type: "ai_feedback_analysis",
        description: "Analyzed client feedback with AI",
        metadata: { feedback: feedback.substring(0, 100) + (feedback.length > 100 ? '...' : '') }
      });
      
      res.json(analysis);
    } catch (error) {
      console.error("Error in AI feedback analysis:", error);
      res.status(500).json({ message: "Error analyzing feedback", error: String(error) });
    }
  });
  
  // Generate moodboard suggestions
  app.post("/api/ai/moodboard-suggestions", isAuthenticated, async (req, res) => {
    try {
      const { style, colors, roomType, client_id, project_id } = req.body;
      
      if (!style || !colors || !roomType) {
        return res.status(400).json({ message: "Style, colors, and room type are required" });
      }
      
      const suggestions = await generateMoodboardSuggestions(style, colors, roomType);
      
      // Create an activity to track this AI interaction
      await storage.createActivity({
        user_id: (req.user as any).id,
        client_id: client_id || null,
        project_id: project_id || null,
        type: "ai_moodboard_suggestions",
        description: "Generated AI moodboard suggestions",
        metadata: { style, roomType }
      });
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error in AI moodboard suggestions:", error);
      res.status(500).json({ message: "Error generating moodboard suggestions", error: String(error) });
    }
  });
  
  // Setup test data if in development mode
  if (process.env.NODE_ENV === 'development') {
    setupTestData().catch(console.error);
  }

  const httpServer = createServer(app);
  return httpServer;
}

// Function to setup test data for development
async function setupTestData() {
  try {
    // Check if we already have test data
    const user = await storage.getUserByUsername("demo");
    
    if (user) {
      // Add some test clients
      const client1 = await storage.createClient({
        user_id: user.id,
        name: "Priya Sharma",
        email: "priya@example.com",
        phone: "+91 9876543210",
        company: "PriyaHome",
        address: "Mumbai, Maharashtra",
        status: "active"
      });
      
      const client2 = await storage.createClient({
        user_id: user.id,
        name: "Rahul Mehta",
        email: "rahul@example.com",
        phone: "+91 9876543211",
        company: "MehtaEnterprises",
        address: "Bangalore, Karnataka",
        status: "active"
      });
      
      const client3 = await storage.createClient({
        user_id: user.id,
        name: "Vikram Singh",
        email: "vikram@example.com",
        phone: "+91 9876543212",
        company: "Spice Avenue",
        address: "Delhi, NCR",
        status: "active"
      });
      
      // Add some test projects
      const project1 = await storage.createProject({
        user_id: user.id,
        client_id: client1.id,
        name: "Modern Apartment Renovation",
        description: "Complete renovation of a 3BHK apartment with modern design elements",
        location: "Mumbai, Maharashtra",
        status: "active",
        budget: 1500000,
        progress: 65
      });
      
      const project2 = await storage.createProject({
        user_id: user.id,
        client_id: client2.id,
        name: "Luxury Villa Design",
        description: "Custom design for a new luxury villa with premium materials",
        location: "Bangalore, Karnataka",
        status: "in_progress",
        budget: 5000000,
        progress: 40
      });
      
      const project3 = await storage.createProject({
        user_id: user.id,
        client_id: client3.id,
        name: "Restaurant Redesign",
        description: "Redesign of an existing restaurant with contemporary theme",
        location: "Delhi, NCR",
        status: "planning",
        budget: 2000000,
        progress: 15
      });
      
      // Add some test proposals
      await storage.createProposal({
        userId: user.id,
        clientId: client1.id,
        projectId: project1.id,
        title: "Modern Living Room Design",
        content: "Proposal for redesigning the living room with modern furniture and lighting",
        status: "pending_review",
        amount: 250000
      });
      
      await storage.createProposal({
        userId: user.id,
        clientId: client2.id,
        projectId: project2.id,
        title: "Office Space Redesign",
        content: "Comprehensive proposal for office space with productivity-focused design",
        status: "approved",
        amount: 750000
      });
      
      await storage.createProposal({
        userId: user.id,
        clientId: client3.id,
        projectId: project3.id,
        title: "Restaurant Interior Concept",
        content: "Concept design for restaurant interiors with focus on dining experience",
        status: "revision_needed",
        amount: 500000
      });
      
      // Add some test tasks
      await storage.createTask({
        userId: user.id,
        projectId: project1.id,
        title: "Client meeting with Priya Sharma",
        description: "Discuss project progress and material selections",
        dueDate: new Date(Date.now() + 3600000 * 4), // 4 hours from now
        status: "pending",
        priority: "high"
      });
      
      await storage.createTask({
        userId: user.id,
        projectId: project1.id,
        title: "Finalize modern apartment moodboard",
        description: "Complete the final selections for the moodboard presentation",
        dueDate: new Date(Date.now() + 86400000), // 1 day from now
        status: "pending",
        priority: "medium"
      });
      
      await storage.createTask({
        userId: user.id,
        projectId: project2.id,
        title: "Submit villa design proposals",
        description: "Prepare and send the design proposals for client review",
        dueDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
        status: "pending",
        priority: "medium"
      });
      
      // Add some test activities
      await storage.createActivity({
        userId: user.id,
        clientId: client1.id,
        projectId: project1.id,
        type: "proposal_approved",
        description: "Priya Sharma approved the proposal for Modern Apartment Renovation",
        metadata: {}
      });
      
      await storage.createActivity({
        userId: user.id,
        clientId: client2.id,
        projectId: project2.id,
        type: "comment_added",
        description: "Rahul Mehta left a comment on Luxury Villa Design",
        metadata: {
          comment: "Can we explore more lighting options for the master bedroom?"
        }
      });
      
      console.log("Test data setup completed");
    }
  } catch (error) {
    console.error("Error setting up test data:", error);
  }
}
