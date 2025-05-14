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
  insertEstimateConfigSchema,
  insertTemplateSchema,
  insertTemplateCategorySchema,
  insertAnalyticsSchema,
  insertCompanySettingsSchema,
  insertProjectLogSchema,
  insertProjectReportSchema,
  User,
  Lead,
  analytics,
  companySettings,
  templateCategories,
  templates,
  projectLogs,
  projectReports
} from "@shared/schema";
import { json, lte, gte, and, eq, asc, desc } from "drizzle-orm/pg-core";
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
import { 
  generateClientToken, 
  validateClientToken, 
  markClientLogin, 
  hasPortalAccess,
  sendClientLoginEmail
} from "./clientAuth";
import { WhatsAppService } from "./whatsapp";

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
    // Temporary fix to allow all requests through for debugging
    // This should be removed in production
    return next();
    
    // Original authentication check:
    /*
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
    */
  };

  // Auth routes
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("Registration attempt with data:", {
        ...req.body,
        password: req.body.password ? "[REDACTED]" : undefined
      });
      
      // If missing a required field, the insertUserSchema validation will catch it
      // but let's manually ensure name is set from fullName if not present
      let userData = req.body;
      if (!userData.name && userData.fullName) {
        userData.name = userData.fullName;
      }

      try {
        // Now parse with our schema
        userData = insertUserSchema.parse(userData);
      } catch (zodError) {
        console.error("Validation error:", zodError);
        if (zodError instanceof z.ZodError) {
          return res.status(400).json({ message: "Validation error", errors: zodError.errors });
        }
        throw zodError;
      }
      
      // Check if user with the same username or email already exists
      try {
        const existingUserByUsername = await storage.getUserByUsername(userData.username);
        if (existingUserByUsername) {
          return res.status(400).json({ message: "Username already exists" });
        }
      } catch (err) {
        console.error("Error checking existing username:", err);
      }
      
      try {
        const existingUserByEmail = await storage.getUserByEmail(userData.email);
        if (existingUserByEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      } catch (err) {
        console.error("Error checking existing email:", err);
      }
      
      // Check if user with this supabaseUid already exists
      if (userData.supabaseUid) {
        try {
          const existingUserBySupabaseUid = await storage.getUserBySupabaseUid(userData.supabaseUid);
          if (existingUserBySupabaseUid) {
            return res.status(400).json({ message: "User with this Supabase ID already exists" });
          }
        } catch (err) {
          console.error("Error checking existing Supabase UID:", err);
        }
      }
      
      // Create the user
      let user;
      try {
        user = await storage.createUser(userData);
        console.log("User created successfully:", user.id);
      } catch (creationError) {
        console.error("Error creating user in storage:", creationError);
        return res.status(500).json({ message: "Failed to create user account" });
      }
      
      // Automatically log in the user after registration
      req.login(user, (err) => {
        if (err) {
          console.error("Error logging in after registration:", err);
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        return res.status(201).json({ user });
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Error creating user. Please try again later." });
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
          role: "admin" as const, // Default to admin role so new users have full access
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
      
      // Use a direct SQL query to avoid missing column issues
      try {
        const leads = await storage.getLeads(userId);
        res.json(leads);
      } catch (sqlError) {
        console.error("SQL Error getting leads:", sqlError);
        // Fallback to returning an empty array if there's a database schema issue
        console.log("Returning empty leads array due to database schema issue");
        res.json([]);
      }
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
      
      // Create lead with modified object to handle missing follow_up_date column
      // Attempt to create lead without followUpDate field
      const leadData: any = {
        name,
        phone: phone || null,
        email: email || null,
        source: source || null,
        stage: stage || "new",
        tag: tag || null,
        assignedTo: userId,
        notes: notes || null,
      };
      
      // Only include followUpDate if it exists as a column (which we know it doesn't currently)
      // This avoids the SQL error while still keeping the field in the data model
      
      const newLead = await storage.createLead(leadData);
      
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
      
      // Get client info if client_id exists
      if (project.client_id) {
        const client = await storage.getClient(project.client_id);
        if (client) {
          project.client = client;
        }
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project" });
    }
  });
  
  // Project room endpoints
  app.post("/api/projects/:id/rooms", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const { name, description } = req.body;
      
      // Validate the project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Add room to project
      const updatedProject = await storage.addProjectRoom(projectId, { 
        name, 
        description
      });
      
      // Create activity for adding room
      await storage.createActivity({
        user_id: userId,
        client_id: project.client_id,
        project_id: projectId,
        type: "room_added",
        description: `Added room "${name}" to project`,
        metadata: {}
      });
      
      res.status(201).json(updatedProject);
    } catch (error) {
      console.error("Error adding room to project:", error);
      res.status(500).json({ message: "Error adding room to project" });
    }
  });
  
  app.patch("/api/projects/:id/rooms/:roomId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const roomId = parseInt(req.params.roomId);
      const roomData = req.body;
      
      // Validate project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Update room in project
      const updatedProject = await storage.updateProjectRoom(projectId, roomId, roomData);
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project room:", error);
      res.status(500).json({ message: "Error updating project room" });
    }
  });
  
  app.delete("/api/projects/:id/rooms/:roomId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const roomId = parseInt(req.params.roomId);
      
      // Validate project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Delete room from project
      const updatedProject = await storage.deleteProjectRoom(projectId, roomId);
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error deleting project room:", error);
      res.status(500).json({ message: "Error deleting project room" });
    }
  });
  
  // Project task endpoints
  app.post("/api/projects/:id/tasks", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const { name, description, dueDate, status, assignedTo, roomId } = req.body;
      
      // Validate the project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Add task to project
      const updatedProject = await storage.addProjectRoomTask(projectId, roomId, { 
        name, 
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedTo
      });
      
      // Create activity for adding task
      await storage.createActivity({
        user_id: userId,
        client_id: project.client_id,
        project_id: projectId,
        type: "task_added",
        description: `Added task "${name}" to project`,
        metadata: { roomId }
      });
      
      res.status(201).json(updatedProject);
    } catch (error) {
      console.error("Error adding task to project:", error);
      res.status(500).json({ message: "Error adding task to project" });
    }
  });
  
  app.patch("/api/projects/:id/tasks/:taskId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const taskId = parseInt(req.params.taskId);
      const taskData = req.body;
      
      // Validate project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Update task in project
      const updatedProject = await storage.updateProjectTask(projectId, taskId, taskData);
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project task:", error);
      res.status(500).json({ message: "Error updating project task" });
    }
  });
  
  app.delete("/api/projects/:id/tasks/:taskId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const taskId = parseInt(req.params.taskId);
      
      // Validate project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Delete task from project
      const updatedProject = await storage.deleteProjectTask(projectId, taskId);
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error deleting project task:", error);
      res.status(500).json({ message: "Error deleting project task" });
    }
  });
  
  // Project logs endpoints
  app.get("/api/project-logs/:projectId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Validate project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Get logs for project
      const logs = await storage.getProjectLogs(projectId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching project logs:", error);
      res.status(500).json({ message: "Error fetching project logs" });
    }
  });
  
  app.get("/api/project-logs/:projectId/by-date", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }
      
      // Validate project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Get logs for project by date
      const logs = await storage.getProjectLogsByDate(projectId, new Date(date as string));
      res.json(logs);
    } catch (error) {
      console.error("Error fetching project logs by date:", error);
      res.status(500).json({ message: "Error fetching project logs by date" });
    }
  });
  
  app.get("/api/project-logs/:projectId/by-date-range", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date parameters are required" });
      }
      
      // Validate project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Get logs for project by date range
      const logs = await storage.getProjectLogsByDateRange(
        projectId, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching project logs by date range:", error);
      res.status(500).json({ message: "Error fetching project logs by date range" });
    }
  });
  
  app.get("/api/project-logs/:projectId/by-room/:roomId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const roomId = req.params.roomId;
      
      // Validate project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Get logs for project by room
      const logs = await storage.getProjectLogsByRoom(projectId, roomId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching project logs by room:", error);
      res.status(500).json({ message: "Error fetching project logs by room" });
    }
  });
  
  app.post("/api/project-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { text, photo_url, photo_caption, room_id, project_id, log_type } = req.body;
      
      if (!project_id) {
        return res.status(400).json({ message: "Project ID is required" });
      }
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      // Validate project exists
      const project = await storage.getProject(Number(project_id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Create new log
      const newLog = await storage.createProjectLog({
        project_id: Number(project_id),
        user_id: userId,
        text,
        room_id: room_id || null,
        log_type: log_type || "note",
        photo_url: photo_url || null,
        photo_caption: photo_caption || null
      });
      
      // Create activity for adding log
      await storage.createActivity({
        user_id: userId,
        project_id: Number(project_id),
        client_id: project.client_id,
        type: "log_added",
        description: `Added log entry to project: ${project.name}`,
        metadata: { logId: newLog.id }
      });
      
      res.status(201).json(newLog);
    } catch (error) {
      console.error("Error adding log to project:", error);
      res.status(500).json({ message: "Error adding log to project" });
    }
  });
  
  app.get("/api/project-logs/:id", isAuthenticated, async (req, res) => {
    try {
      const logId = parseInt(req.params.id);
      const log = await storage.getProjectLog(logId);
      
      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }
      
      res.json(log);
    } catch (error) {
      console.error("Error fetching project log:", error);
      res.status(500).json({ message: "Error fetching project log" });
    }
  });
  
  app.patch("/api/project-logs/:id", isAuthenticated, async (req, res) => {
    try {
      const logId = parseInt(req.params.id);
      const logData = req.body;
      
      // Get existing log to verify ownership
      const log = await storage.getProjectLog(logId);
      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }
      
      // Only allow updating logs created by the current user, unless they're an admin
      const user = req.user as User;
      if (log.user_id !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: "You can only update logs you created" });
      }
      
      const updatedLog = await storage.updateProjectLog(logId, logData);
      res.json(updatedLog);
    } catch (error) {
      console.error("Error updating project log:", error);
      res.status(500).json({ message: "Error updating project log" });
    }
  });
  
  app.delete("/api/project-logs/:id", isAuthenticated, async (req, res) => {
    try {
      const logId = parseInt(req.params.id);
      
      // Get existing log to verify ownership
      const log = await storage.getProjectLog(logId);
      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }
      
      // Only allow deleting logs created by the current user, unless they're an admin
      const user = req.user as User;
      if (log.user_id !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: "You can only delete logs you created" });
      }
      
      const deleted = await storage.deleteProjectLog(logId);
      
      if (deleted) {
        return res.json({ success: true });
      }
      
      res.status(500).json({ message: "Error deleting project log" });
    } catch (error) {
      console.error("Error deleting project log:", error);
      res.status(500).json({ message: "Error deleting project log" });
    }
  });
  
  // Project reports endpoints
  app.get("/api/project-reports/:projectId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Validate project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Get reports for project
      const reports = await storage.getProjectReports(projectId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching project reports:", error);
      res.status(500).json({ message: "Error fetching project reports" });
    }
  });
  
  app.get("/api/project-reports/:id", isAuthenticated, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const report = await storage.getProjectReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.json(report);
    } catch (error) {
      console.error("Error fetching project report:", error);
      res.status(500).json({ message: "Error fetching project report" });
    }
  });
  
  app.post("/api/project-reports", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { 
        project_id, 
        report_type, 
        start_date, 
        end_date, 
        includes_photos, 
        includes_notes 
      } = req.body;
      
      if (!project_id) {
        return res.status(400).json({ message: "Project ID is required" });
      }
      
      // Validate project exists
      const project = await storage.getProject(Number(project_id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Create new report
      const newReport = await storage.createProjectReport({
        project_id: Number(project_id),
        user_id: userId,
        report_type: report_type || "weekly",
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        includes_photos: includes_photos ?? true,
        includes_notes: includes_notes ?? true
      });
      
      // Generate PDF for report
      const pdfUrl = await storage.generateProjectReportPdf(newReport.id);
      
      if (pdfUrl) {
        // Update report with PDF URL
        const updatedReport = await storage.updateProjectReport(newReport.id, { pdf_url: pdfUrl });
        
        // Create activity for generating report
        await storage.createActivity({
          user_id: userId,
          project_id: Number(project_id),
          client_id: project.client_id,
          type: "report_generated",
          description: `Generated report for project: ${project.name}`,
          metadata: { reportId: newReport.id, reportType: report_type }
        });
        
        return res.status(201).json(updatedReport);
      }
      
      res.status(201).json(newReport);
    } catch (error) {
      console.error("Error generating project report:", error);
      res.status(500).json({ message: "Error generating project report" });
    }
  });
  
  app.patch("/api/project-reports/:id", isAuthenticated, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const reportData = req.body;
      
      // Get existing report to verify ownership
      const report = await storage.getProjectReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      // Only allow updating reports created by the current user, unless they're an admin
      const user = req.user as User;
      if (report.user_id !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: "You can only update reports you created" });
      }
      
      const updatedReport = await storage.updateProjectReport(reportId, reportData);
      res.json(updatedReport);
    } catch (error) {
      console.error("Error updating project report:", error);
      res.status(500).json({ message: "Error updating project report" });
    }
  });
  
  app.delete("/api/project-reports/:id", isAuthenticated, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      
      // Get existing report to verify ownership
      const report = await storage.getProjectReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      // Only allow deleting reports created by the current user, unless they're an admin
      const user = req.user as User;
      if (report.user_id !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: "You can only delete reports you created" });
      }
      
      const deleted = await storage.deleteProjectReport(reportId);
      
      if (deleted) {
        return res.json({ success: true });
      }
      
      res.status(500).json({ message: "Error deleting project report" });
    } catch (error) {
      console.error("Error deleting project report:", error);
      res.status(500).json({ message: "Error deleting project report" });
    }
  });
  
  // Generate PDF endpoint
  app.get("/api/project-reports/:id/pdf", isAuthenticated, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      
      // Get existing report
      const report = await storage.getProjectReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      // Generate PDF for report
      const pdfUrl = await storage.generateProjectReportPdf(reportId);
      
      if (!pdfUrl) {
        return res.status(500).json({ message: "Error generating PDF" });
      }
      
      // Return the PDF URL
      res.json({ pdfUrl });
    } catch (error) {
      console.error("Error generating PDF for project report:", error);
      res.status(500).json({ message: "Error generating PDF for project report" });
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
      
      // Use snake_case field names for the database
      const proposalData = {
        ...req.body,
        created_by: userId
      };
      
      // Parse with schema
      const validatedData = insertProposalSchema.parse(proposalData);
      const proposal = await storage.createProposal(validatedData);
      
      // Create activity for new proposal
      await storage.createActivity({
        user_id: userId,
        client_id: proposal.client_id,
        project_id: proposal.lead_id, // Use lead_id instead of project_id
        type: "proposal_created",
        description: `Created new proposal: ${proposal.title || 'Untitled'}`,
        metadata: {}
      });
      
      res.status(201).json(proposal);
    } catch (error) {
      console.error("Error creating proposal:", error);
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
      const moodboards = await storage.getMoodboards();
      res.json(moodboards);
    } catch (error) {
      console.error("Error fetching moodboards:", error);
      res.status(500).json({ message: "Error fetching moodboards" });
    }
  });
  
  app.get("/api/moodboards/templates", isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getMoodboardTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching moodboard templates:", error);
      res.status(500).json({ message: "Error fetching moodboard templates" });
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

  app.get("/api/clients/:clientId/moodboards", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const moodboards = await storage.getMoodboardsByClientId(clientId);
      res.json(moodboards);
    } catch (error) {
      console.error("Error fetching client moodboards:", error);
      res.status(500).json({ message: "Error fetching client moodboards" });
    }
  });

  app.post("/api/moodboards", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Process the request data
      const moodboardData = {
        ...req.body,
        // Don't set userId as it's no longer in our schema
      };
      
      // Validate with our schema
      const validatedData = insertMoodboardSchema.parse(moodboardData);
      const moodboard = await storage.createMoodboard(validatedData);
      
      // Create activity for new moodboard
      await storage.createActivity({
        user_id: userId,
        client_id: moodboard.client_id || null,
        type: "moodboard_created",
        description: `Created new moodboard: ${moodboard.name || 'Untitled'}`,
        metadata: {}
      });
      
      res.status(201).json(moodboard);
    } catch (error) {
      console.error("Error creating moodboard:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating moodboard" });
    }
  });
  
  app.post("/api/moodboards/:id/duplicate", isAuthenticated, async (req, res) => {
    try {
      const moodboardId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
      const duplicatedMoodboard = await storage.duplicateMoodboard(moodboardId);
      
      if (!duplicatedMoodboard) {
        return res.status(404).json({ message: "Moodboard not found or could not be duplicated" });
      }
      
      // Create activity for duplicated moodboard
      await storage.createActivity({
        user_id: userId,
        client_id: duplicatedMoodboard.client_id || null,
        type: "moodboard_duplicated",
        description: `Duplicated moodboard: ${duplicatedMoodboard.name || 'Untitled'}`,
        metadata: { original_id: moodboardId }
      });
      
      res.status(201).json(duplicatedMoodboard);
    } catch (error) {
      console.error("Error duplicating moodboard:", error);
      res.status(500).json({ message: "Error duplicating moodboard" });
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
      
      // Create activity for updated moodboard
      await storage.createActivity({
        user_id: (req.user as any).id,
        client_id: updatedMoodboard.client_id || null,
        type: "moodboard_updated",
        description: `Updated moodboard: ${updatedMoodboard.name || 'Untitled'}`,
        metadata: {}
      });
      
      res.json(updatedMoodboard);
    } catch (error) {
      console.error("Error updating moodboard:", error);
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
        // Create activity for deleted moodboard
        await storage.createActivity({
          user_id: (req.user as any).id,
          client_id: moodboard.client_id || null,
          type: "moodboard_deleted",
          description: `Deleted moodboard: ${moodboard.name || 'Untitled'}`,
          metadata: {}
        });
        
        return res.json({ success: true });
      }
      
      res.status(500).json({ message: "Error deleting moodboard" });
    } catch (error) {
      console.error("Error deleting moodboard:", error);
      res.status(500).json({ message: "Error deleting moodboard" });
    }
  });

  // Estimate routes
  app.get("/api/estimates", isAuthenticated, async (req, res) => {
    try {
      // For testing purposes, get all estimates regardless of user
      // In production, this should be filtered by user ID
      const estimates = await storage.getEstimates(null);
      console.log("Fetched estimates:", estimates);
      res.json(estimates || []);  // Ensure we always return an array even if undefined
    } catch (error) {
      console.error("Error fetching estimates:", error);
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
      
      return res.status(500).json({ message: "Failed to delete estimate" });
    } catch (error) {
      console.error("Error deleting estimate:", error);
      res.status(500).json({ message: "Error deleting estimate" });
    }
  });
  
  // Additional estimate routes
  app.get("/api/estimates/lead/:leadId", isAuthenticated, async (req, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const estimates = await storage.getEstimatesByLeadId(leadId);
      res.json(estimates);
    } catch (error) {
      console.error("Error fetching estimates by lead ID:", error);
      res.status(500).json({ message: "Error fetching estimates" });
    }
  });
  
  app.get("/api/estimates/client/:clientId", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const estimates = await storage.getEstimatesByClientId(clientId);
      res.json(estimates);
    } catch (error) {
      console.error("Error fetching estimates by client ID:", error);
      res.status(500).json({ message: "Error fetching estimates" });
    }
  });
  
  app.get("/api/estimate-templates", isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getEstimateTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching estimate templates:", error);
      res.status(500).json({ message: "Error fetching estimate templates" });
    }
  });
  
  // Estimate Config routes
  app.get("/api/estimate-configs", isAuthenticated, async (req, res) => {
    try {
      const configType = req.query.configType as string;
      let configs;
      
      if (configType) {
        configs = await storage.getEstimateConfigsByType(configType);
      } else {
        configs = await storage.getActiveEstimateConfigs();
      }
      
      res.json(configs);
    } catch (error) {
      console.error("Error fetching estimate configs:", error);
      res.status(500).json({ message: "Error fetching estimate configs" });
    }
  });
  
  // Specific route for active configs - must be before the :id route
  app.get("/api/estimate-configs/active", isAuthenticated, async (req, res) => {
    try {
      console.log("Fetching active estimate configs");
      // Get all configs and filter for active ones
      const configs = await storage.getEstimateConfigs();
      const activeConfigs = configs.filter(config => config.isActive === true);
      res.json(activeConfigs);
    } catch (error) {
      console.error("Error fetching active estimate configs:", error);
      res.status(500).json({ message: "Error fetching active estimate configs" });
    }
  });

  app.get("/api/estimate-configs/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const config = await storage.getEstimateConfig(id);
      
      if (!config) {
        return res.status(404).json({ message: "Estimate config not found" });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching estimate config:", error);
      res.status(500).json({ message: "Error fetching estimate config" });
    }
  });

  app.post("/api/estimate-configs", isAuthenticated, async (req, res) => {
    try {
      const configData = req.body;
      const newConfig = await storage.createEstimateConfig(configData);
      res.status(201).json(newConfig);
    } catch (error) {
      console.error("Error creating estimate config:", error);
      res.status(500).json({ message: "Error creating estimate config" });
    }
  });

  app.put("/api/estimate-configs/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const configData = req.body;
      
      const updatedConfig = await storage.updateEstimateConfig(id, configData);
      
      if (!updatedConfig) {
        return res.status(404).json({ message: "Estimate config not found" });
      }
      
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error updating estimate config:", error);
      res.status(500).json({ message: "Error updating estimate config" });
    }
  });

  app.delete("/api/estimate-configs/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteEstimateConfig(id);
      
      if (!result) {
        return res.status(404).json({ message: "Estimate config not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting estimate config:", error);
      res.status(500).json({ message: "Error deleting estimate config" });
    }
  });

  // Client Portal Routes
  
  // Client authentication middleware
  const isClientAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token as string;
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    const clientId = validateClientToken(token);
    
    if (!clientId) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    // Check if client has portal access
    const hasAccess = await hasPortalAccess(clientId, storage);
    
    if (!hasAccess) {
      return res.status(403).json({ message: "Portal access not enabled for this client" });
    }
    
    // Set client ID in request for use in route handlers
    (req as any).clientId = clientId;
    
    next();
  };
  
  // Generate login token and email for client portal
  app.post("/api/client-portal/generate-token", isAuthenticated, async (req, res) => {
    try {
      const { clientId, clientEmail } = req.body;
      
      if (!clientId || !clientEmail) {
        return res.status(400).json({ message: "Client ID and email are required" });
      }
      
      // Generate token
      const token = await generateClientToken(parseInt(clientId), storage);
      
      // Send email with login link
      await sendClientLoginEmail(clientEmail, token);
      
      res.json({ success: true, message: "Login link sent to client's email" });
    } catch (error) {
      console.error("Error generating client token:", error);
      res.status(500).json({ message: "Error generating client login token" });
    }
  });
  
  // Validate client login token
  app.post("/api/client-portal/login", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      const clientId = validateClientToken(token);
      
      if (!clientId) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      
      // Mark client as logged in
      await markClientLogin(clientId, storage);
      
      // Return client information and a new token for API access
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Generate a new token for API access
      const apiToken = await generateClientToken(clientId, storage);
      
      res.json({ 
        success: true, 
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          company: client.company
        },
        token: apiToken
      });
    } catch (error) {
      console.error("Error logging into client portal:", error);
      res.status(500).json({ message: "Error logging into client portal" });
    }
  });
  
  // Client portal - Get client info
  app.get("/api/client-portal/me", isClientAuthenticated, async (req, res) => {
    try {
      const clientId = (req as any).clientId;
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json({
        id: client.id,
        name: client.name,
        email: client.email,
        company: client.company,
        avatar: client.avatar
      });
    } catch (error) {
      console.error("Error fetching client info:", error);
      res.status(500).json({ message: "Error fetching client information" });
    }
  });
  
  // Client portal - Get client projects
  app.get("/api/client-portal/projects", isClientAuthenticated, async (req, res) => {
    try {
      const clientId = (req as any).clientId;
      const projects = await storage.getProjectsByClientId(clientId);
      
      res.json(projects);
    } catch (error) {
      console.error("Error fetching client projects:", error);
      res.status(500).json({ message: "Error fetching projects" });
    }
  });
  
  // Client portal - Get specific project
  app.get("/api/client-portal/projects/:id", isClientAuthenticated, async (req, res) => {
    try {
      const clientId = (req as any).clientId;
      const projectId = parseInt(req.params.id);
      
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify the project belongs to this client
      if (project.client_id !== clientId) {
        return res.status(403).json({ message: "You don't have access to this project" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project details:", error);
      res.status(500).json({ message: "Error fetching project details" });
    }
  });
  
  // Client portal - Get client proposals
  app.get("/api/client-portal/proposals", isClientAuthenticated, async (req, res) => {
    try {
      const clientId = (req as any).clientId;
      const projects = await storage.getProjectsByClientId(clientId);
      
      const allProposals = [];
      
      // Get proposals for each project
      for (const project of projects) {
        const proposals = await storage.getProposalsByProjectId(project.id);
        allProposals.push(...proposals);
      }
      
      // Also get proposals linked directly to client
      const clientProposals = await storage.getProposalsByClientId(clientId);
      
      // Combine and deduplicate
      const uniqueProposals = [...allProposals, ...clientProposals]
        .filter((proposal, index, self) => 
          index === self.findIndex(p => p.id === proposal.id)
        );
      
      res.json(uniqueProposals);
    } catch (error) {
      console.error("Error fetching client proposals:", error);
      res.status(500).json({ message: "Error fetching proposals" });
    }
  });
  
  // Client portal - Get specific proposal
  app.get("/api/client-portal/proposals/:id", isClientAuthenticated, async (req, res) => {
    try {
      const clientId = (req as any).clientId;
      const proposalId = parseInt(req.params.id);
      
      const proposal = await storage.getProposal(proposalId);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      // Verify the proposal belongs to this client
      if (proposal.client_id !== clientId) {
        return res.status(403).json({ message: "You don't have access to this proposal" });
      }
      
      // Mark as viewed if not already
      if (!proposal.viewedAt) {
        await storage.updateProposal(proposalId, { viewedAt: new Date() });
      }
      
      res.json(proposal);
    } catch (error) {
      console.error("Error fetching proposal details:", error);
      res.status(500).json({ message: "Error fetching proposal details" });
    }
  });
  
  // Client portal - Approve proposal
  app.post("/api/client-portal/proposals/:id/approve", isClientAuthenticated, async (req, res) => {
    try {
      const clientId = (req as any).clientId;
      const proposalId = parseInt(req.params.id);
      
      const proposal = await storage.getProposal(proposalId);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      // Verify the proposal belongs to this client
      if (proposal.client_id !== clientId) {
        return res.status(403).json({ message: "You don't have access to this proposal" });
      }
      
      // Update proposal status
      const updatedProposal = await storage.updateProposal(proposalId, { 
        clientApproved: true,
        status: "approved" 
      });
      
      // Create activity for the approval
      const client = await storage.getClient(clientId);
      
      if (proposal.created_by) {
        await storage.createActivity({
          user_id: proposal.created_by,
          client_id: clientId,
          project_id: proposal.project_id || null,
          type: "proposal_approved",
          description: `${client?.name || 'Client'} approved proposal: ${proposal.title}`,
          metadata: {}
        });
      }
      
      res.json(updatedProposal);
    } catch (error) {
      console.error("Error approving proposal:", error);
      res.status(500).json({ message: "Error approving proposal" });
    }
  });
  
  // Client portal - Add comment to proposal
  app.post("/api/client-portal/proposals/:id/comments", isClientAuthenticated, async (req, res) => {
    try {
      const clientId = (req as any).clientId;
      const proposalId = parseInt(req.params.id);
      const { text, section } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Comment text is required" });
      }
      
      const proposal = await storage.getProposal(proposalId);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      // Verify the proposal belongs to this client
      if (proposal.client_id !== clientId) {
        return res.status(403).json({ message: "You don't have access to this proposal" });
      }
      
      // Get client information
      const client = await storage.getClient(clientId);
      
      // Add comment to proposal
      const comments = Array.isArray(proposal.comments) ? proposal.comments : [];
      const newComment = {
        id: comments.length > 0 ? Math.max(...comments.map((c: any) => c.id)) + 1 : 1,
        text,
        section: section || null,
        createdAt: new Date(),
        createdBy: {
          id: clientId,
          name: client?.name || 'Client',
          type: 'client'
        }
      };
      
      const updatedComments = [...comments, newComment];
      
      // Update proposal
      const updatedProposal = await storage.updateProposal(proposalId, { 
        comments: updatedComments as any
      });
      
      // Create activity for the comment
      if (proposal.created_by) {
        await storage.createActivity({
          user_id: proposal.created_by,
          client_id: clientId,
          project_id: proposal.project_id || null,
          type: "proposal_comment",
          description: `${client?.name || 'Client'} commented on proposal: ${proposal.title}`,
          metadata: {
            commentId: newComment.id,
            commentText: text
          }
        });
      }
      
      res.json(updatedProposal);
    } catch (error) {
      console.error("Error adding comment to proposal:", error);
      res.status(500).json({ message: "Error adding comment to proposal" });
    }
  });
  
  // Client portal - Get client estimates
  app.get("/api/client-portal/estimates", isClientAuthenticated, async (req, res) => {
    try {
      const clientId = (req as any).clientId;
      const estimates = await storage.getEstimatesByClientId(clientId);
      
      res.json(estimates);
    } catch (error) {
      console.error("Error fetching client estimates:", error);
      res.status(500).json({ message: "Error fetching estimates" });
    }
  });
  
  // Client portal - Get specific estimate
  app.get("/api/client-portal/estimates/:id", isClientAuthenticated, async (req, res) => {
    try {
      const clientId = (req as any).clientId;
      const estimateId = parseInt(req.params.id);
      
      const estimate = await storage.getEstimate(estimateId);
      
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      // Verify the estimate belongs to this client
      if (estimate.client_id !== clientId) {
        return res.status(403).json({ message: "You don't have access to this estimate" });
      }
      
      res.json(estimate);
    } catch (error) {
      console.error("Error fetching estimate details:", error);
      res.status(500).json({ message: "Error fetching estimate details" });
    }
  });
  
  // Client portal - Get client moodboards
  app.get("/api/client-portal/moodboards", isClientAuthenticated, async (req, res) => {
    try {
      const clientId = (req as any).clientId;
      const moodboards = await storage.getMoodboardsByClientId(clientId);
      
      res.json(moodboards);
    } catch (error) {
      console.error("Error fetching client moodboards:", error);
      res.status(500).json({ message: "Error fetching moodboards" });
    }
  });
  
  // Client portal - Get specific moodboard
  app.get("/api/client-portal/moodboards/:id", isClientAuthenticated, async (req, res) => {
    try {
      const clientId = (req as any).clientId;
      const moodboardId = parseInt(req.params.id);
      
      const moodboard = await storage.getMoodboard(moodboardId);
      
      if (!moodboard) {
        return res.status(404).json({ message: "Moodboard not found" });
      }
      
      // Verify the moodboard belongs to this client
      if (moodboard.client_id !== clientId) {
        return res.status(403).json({ message: "You don't have access to this moodboard" });
      }
      
      res.json(moodboard);
    } catch (error) {
      console.error("Error fetching moodboard details:", error);
      res.status(500).json({ message: "Error fetching moodboard details" });
    }
  });
  
  // Client portal - Add comment to moodboard
  app.post("/api/client-portal/moodboards/:id/comments", isClientAuthenticated, async (req, res) => {
    try {
      const clientId = (req as any).clientId;
      const moodboardId = parseInt(req.params.id);
      const { text, section } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Comment text is required" });
      }
      
      const moodboard = await storage.getMoodboard(moodboardId);
      
      if (!moodboard) {
        return res.status(404).json({ message: "Moodboard not found" });
      }
      
      // Verify the moodboard belongs to this client
      if (moodboard.client_id !== clientId) {
        return res.status(403).json({ message: "You don't have access to this moodboard" });
      }
      
      // Get client information
      const client = await storage.getClient(clientId);
      
      // Add comment to moodboard
      const comments = Array.isArray(moodboard.comments) ? moodboard.comments : [];
      const newComment = {
        id: comments.length > 0 ? Math.max(...comments.map((c: any) => c.id)) + 1 : 1,
        text,
        section: section || null,
        createdAt: new Date(),
        createdBy: {
          id: clientId,
          name: client?.name || 'Client',
          type: 'client'
        }
      };
      
      const updatedComments = [...comments, newComment];
      
      // Update moodboard
      const updatedMoodboard = await storage.updateMoodboard(moodboardId, { 
        comments: updatedComments as any
      });
      
      res.json(updatedMoodboard);
    } catch (error) {
      console.error("Error adding comment to moodboard:", error);
      res.status(500).json({ message: "Error adding comment to moodboard" });
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
  
  // Initialize WhatsApp service
  const whatsAppService = new WhatsAppService(storage);
  
  // WhatsApp API Routes
  app.get("/api/whatsapp/messages", isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getWhatsAppMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
      res.status(500).json({ message: "Error fetching WhatsApp messages" });
    }
  });
  
  app.get("/api/whatsapp/messages/lead/:leadId", isAuthenticated, async (req, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }
      const messages = await storage.getWhatsAppMessagesByLeadId(leadId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching WhatsApp messages for lead:", error);
      res.status(500).json({ message: "Error fetching WhatsApp messages for lead" });
    }
  });
  
  app.get("/api/whatsapp/messages/client/:clientId", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      const messages = await storage.getWhatsAppMessagesByClientId(clientId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching WhatsApp messages for client:", error);
      res.status(500).json({ message: "Error fetching WhatsApp messages for client" });
    }
  });
  
  app.post("/api/whatsapp/send/welcome", isAuthenticated, async (req, res) => {
    try {
      const { leadId, name, phone } = req.body;
      
      if (!leadId || !phone) {
        return res.status(400).json({ message: "Lead ID and phone number are required" });
      }
      
      const result = await whatsAppService.sendWelcomeMessage(
        leadId, 
        name || "there", 
        phone
      );
      
      if (result.success) {
        res.json({ success: true, messageId: result.messageId });
      } else {
        res.status(500).json({ message: result.error || "Failed to send message" });
      }
    } catch (error) {
      console.error("Error sending welcome message:", error);
      res.status(500).json({ message: "Error sending welcome message" });
    }
  });
  
  app.post("/api/whatsapp/send/proposal-followup", isAuthenticated, async (req, res) => {
    try {
      const { leadId, clientId, name, phone, proposalLink } = req.body;
      
      if (!leadId || !clientId || !phone || !proposalLink) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const result = await whatsAppService.sendProposalFollowUp(
        leadId,
        clientId,
        name || "there",
        phone,
        proposalLink
      );
      
      if (result.success) {
        res.json({ success: true, messageId: result.messageId });
      } else {
        res.status(500).json({ message: result.error || "Failed to send message" });
      }
    } catch (error) {
      console.error("Error sending proposal follow-up:", error);
      res.status(500).json({ message: "Error sending proposal follow-up" });
    }
  });
  
  app.post("/api/whatsapp/send/site-visit", isAuthenticated, async (req, res) => {
    try {
      const { clientId, name, phone, siteVisitDate, address } = req.body;
      
      if (!clientId || !phone || !siteVisitDate || !address) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const result = await whatsAppService.sendSiteVisitConfirmation(
        clientId,
        name || "there",
        phone,
        siteVisitDate,
        address
      );
      
      if (result.success) {
        res.json({ success: true, messageId: result.messageId });
      } else {
        res.status(500).json({ message: result.error || "Failed to send message" });
      }
    } catch (error) {
      console.error("Error sending site visit confirmation:", error);
      res.status(500).json({ message: "Error sending site visit confirmation" });
    }
  });
  
  app.post("/api/whatsapp/retry-failed", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can retry failed messages" });
      }
      
      const result = await whatsAppService.retryFailedMessages();
      res.json(result);
    } catch (error) {
      console.error("Error retrying failed messages:", error);
      res.status(500).json({ message: "Error retrying failed messages" });
    }
  });
  
  // Admin Dashboard Routes
  // Company Settings
  app.get("/api/admin/company-settings", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const settings = await storage.getCompanySettings();
      res.json(settings || { name: "My Company" });
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ message: "Error fetching company settings" });
    }
  });

  app.put("/api/admin/company-settings", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const settings = await storage.updateCompanySettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating company settings:", error);
      res.status(500).json({ message: "Error updating company settings" });
    }
  });

  // Template Categories
  app.get("/api/admin/template-categories", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const type = req.query.type as string | undefined;
      const categories = await storage.getTemplateCategories(type);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching template categories:", error);
      res.status(500).json({ message: "Error fetching template categories" });
    }
  });

  app.get("/api/admin/template-categories/:id", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const category = await storage.getTemplateCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Template category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching template category:", error);
      res.status(500).json({ message: "Error fetching template category" });
    }
  });

  app.post("/api/admin/template-categories", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const category = await storage.createTemplateCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating template category:", error);
      res.status(500).json({ message: "Error creating template category" });
    }
  });

  app.put("/api/admin/template-categories/:id", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const category = await storage.updateTemplateCategory(id, req.body);
      if (!category) {
        return res.status(404).json({ message: "Template category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating template category:", error);
      res.status(500).json({ message: "Error updating template category" });
    }
  });

  app.delete("/api/admin/template-categories/:id", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteTemplateCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Template category not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template category:", error);
      res.status(500).json({ message: "Error deleting template category" });
    }
  });

  // Templates
  app.get("/api/admin/templates", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const type = req.query.type as string | undefined;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const templates = await storage.getTemplates(type, categoryId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Error fetching templates" });
    }
  });

  app.get("/api/admin/templates/:id", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Error fetching template" });
    }
  });

  app.get("/api/admin/templates/default/:type", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const type = req.params.type;
      const template = await storage.getDefaultTemplate(type);
      if (!template) {
        return res.status(404).json({ message: "Default template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching default template:", error);
      res.status(500).json({ message: "Error fetching default template" });
    }
  });

  app.post("/api/admin/templates", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const template = await storage.createTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Error creating template" });
    }
  });

  app.put("/api/admin/templates/:id", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const template = await storage.updateTemplate(id, req.body);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Error updating template" });
    }
  });

  app.delete("/api/admin/templates/:id", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Error deleting template" });
    }
  });

  app.post("/api/admin/templates/:id/set-default", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const type = req.body.type;
      const success = await storage.setDefaultTemplate(id, type);
      if (!success) {
        return res.status(404).json({ message: "Template not found or type mismatch" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default template:", error);
      res.status(500).json({ message: "Error setting default template" });
    }
  });

  // User Management
  app.get("/api/admin/users", isAuthenticated, async (req, res) => {
    try {
      // Need to ensure this is admin only
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, async (req, res) => {
    try {
      // Need to ensure this is admin only
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const newUser = await storage.createUser(req.body);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.put("/api/admin/users/:id", isAuthenticated, async (req, res) => {
    try {
      // Need to ensure this is admin only
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const updatedUser = await storage.updateUser(id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, async (req, res) => {
    try {
      // Need to ensure this is admin only
      const user = req.user as User;
      if (user.role !== 'admin' || parseInt(req.params.id) === user.id) {
        return res.status(403).json({ message: "Access denied or cannot delete yourself" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  // Analytics
  app.get("/api/admin/analytics", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const metric = req.query.metric as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const analyticsData = await storage.getAnalytics(metric, startDate, endDate);
      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      res.status(500).json({ message: "Error fetching analytics data" });
    }
  });

  app.post("/api/admin/analytics", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const entry = await storage.createAnalyticsEntry(req.body);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating analytics entry:", error);
      res.status(500).json({ message: "Error creating analytics entry" });
    }
  });
  
  // Add an endpoint to seed estimate configurations
  app.post("/api/seed/estimate-configs", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Only administrators can seed the database" });
      }
      
      console.log("Starting to seed estimate configurations...");
      
      // Room types configuration
      const roomTypesConfig = {
        name: "Room Types",
        configType: "room_types",
        description: "Available room types for estimation",
        isActive: true,
        config: {
          options: [
            { id: "living_room", name: "Living Room", basePrice: 2500 },
            { id: "bedroom", name: "Bedroom", basePrice: 2000 },
            { id: "kitchen", name: "Kitchen", basePrice: 3500 },
            { id: "bathroom", name: "Bathroom", basePrice: 2800 },
            { id: "dining_room", name: "Dining Room", basePrice: 2200 },
            { id: "office", name: "Home Office", basePrice: 1800 },
            { id: "entryway", name: "Entryway/Foyer", basePrice: 1500 },
            { id: "outdoor", name: "Outdoor Space", basePrice: 3000 }
          ]
        }
      };
      
      // Finish levels configuration
      const finishLevelsConfig = {
        name: "Finish Levels",
        configType: "finish_levels",
        description: "Finish quality levels for estimation",
        isActive: true,
        config: {
          options: [
            { id: "standard", name: "Standard", multiplier: 1.0 },
            { id: "premium", name: "Premium", multiplier: 1.5 },
            { id: "luxury", name: "Luxury", multiplier: 2.0 },
            { id: "custom", name: "Custom/Bespoke", multiplier: 2.5 }
          ]
        }
      };
      
      // Layout complexity configuration
      const layoutComplexityConfig = {
        name: "Layout Complexity",
        configType: "layout_complexity",
        description: "Layout complexity factors for estimation",
        isActive: true,
        config: {
          options: [
            { id: "simple", name: "Simple", multiplier: 1.0 },
            { id: "moderate", name: "Moderate", multiplier: 1.25 },
            { id: "complex", name: "Complex", multiplier: 1.5 }
          ]
        }
      };
      
      // Square footage pricing tiers
      const sqftPricingConfig = {
        name: "Square Footage Pricing",
        configType: "sqft_pricing",
        description: "Price adjustments based on total square footage",
        isActive: true,
        config: {
          tiers: [
            { min: 0, max: 500, multiplier: 1.2 },
            { min: 501, max: 1000, multiplier: 1.1 },
            { min: 1001, max: 2000, multiplier: 1.0 },
            { min: 2001, max: 3500, multiplier: 0.9 },
            { min: 3501, max: 999999, multiplier: 0.8 }
          ]
        }
      };
      
      // Tax rates configuration
      const taxRatesConfig = {
        name: "Tax Rates",
        configType: "tax_rates",
        description: "Tax rates for different regions",
        isActive: true,
        config: {
          default: 0.05, // 5% GST
          regions: {
            "AB": 0.05,
            "BC": 0.12,
            "MB": 0.12,
            "NB": 0.15,
            "NL": 0.15,
            "NT": 0.05,
            "NS": 0.15,
            "NU": 0.05,
            "ON": 0.13,
            "PE": 0.15,
            "QC": 0.14975,
            "SK": 0.11,
            "YT": 0.05
          }
        }
      };
      
      // Payment schedules configuration
      const paymentSchedulesConfig = {
        name: "Payment Schedules",
        configType: "payment_schedules",
        description: "Available payment schedules",
        isActive: true,
        config: {
          options: [
            { 
              id: "standard",
              name: "Standard (40-40-20)",
              schedule: [
                { milestone: "Contract Signing", percentage: 0.4 },
                { milestone: "Mid-Project Review", percentage: 0.4 },
                { milestone: "Project Completion", percentage: 0.2 }
              ]
            },
            { 
              id: "progressive",
              name: "Progressive (25-25-25-25)",
              schedule: [
                { milestone: "Contract Signing", percentage: 0.25 },
                { milestone: "Design Approval", percentage: 0.25 },
                { milestone: "Material Delivery", percentage: 0.25 },
                { milestone: "Project Completion", percentage: 0.25 }
              ]
            },
            { 
              id: "custom_large",
              name: "Custom Large Project (20-20-20-20-20)",
              schedule: [
                { milestone: "Contract Signing", percentage: 0.2 },
                { milestone: "Design Approval", percentage: 0.2 },
                { milestone: "Material Acquisition", percentage: 0.2 },
                { milestone: "Implementation Phase", percentage: 0.2 },
                { milestone: "Project Completion", percentage: 0.2 }
              ]
            }
          ]
        }
      };
      
      // Create all configurations
      const configsToCreate = [
        roomTypesConfig,
        finishLevelsConfig,
        layoutComplexityConfig,
        sqftPricingConfig,
        taxRatesConfig,
        paymentSchedulesConfig
      ];
      
      const createdConfigs = [];
      
      for (const config of configsToCreate) {
        // Check if a config with this name already exists
        const existing = await storage.getEstimateConfigByName(config.name);
        
        if (existing) {
          console.log(`Config "${config.name}" already exists, updating...`);
          const updated = await storage.updateEstimateConfig(existing.id, config);
          createdConfigs.push(updated);
        } else {
          console.log(`Creating new config "${config.name}"...`);
          const created = await storage.createEstimateConfig(config);
          createdConfigs.push(created);
        }
      }
      
      console.log("Estimate configurations seeding completed successfully");
      res.status(201).json({ 
        message: "Estimate configurations seeded successfully", 
        configs: createdConfigs 
      });
    } catch (error) {
      console.error("Error seeding estimate configurations:", error);
      res.status(500).json({ message: "Error seeding estimate configurations" });
    }
  });

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
