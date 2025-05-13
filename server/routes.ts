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
  insertTaskSchema,
  insertActivitySchema 
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
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user with the same username or email already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
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
        userId,
        clientId: client.id,
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
        userId: (req.user as any).id,
        clientId,
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
          userId: (req.user as any).id,
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
        userId,
        clientId: project.clientId,
        projectId: project.id,
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
        userId: (req.user as any).id,
        clientId: updatedProject.clientId,
        projectId,
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
          userId: (req.user as any).id,
          clientId: project.clientId,
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
        userId,
        clientId: proposal.clientId,
        projectId: proposal.projectId,
        type: "proposal_created",
        description: `Created new proposal: ${proposal.title}`,
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
        userId: (req.user as any).id,
        clientId: updatedProposal.clientId,
        projectId: updatedProposal.projectId,
        type: "proposal_updated",
        description: `Updated proposal: ${updatedProposal.title}`,
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
          userId: (req.user as any).id,
          clientId: proposal.clientId,
          projectId: proposal.projectId,
          type: "proposal_deleted",
          description: `Deleted proposal: ${proposal.title}`,
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
      const project = await storage.getProject(moodboard.projectId);
      
      // Create activity for new moodboard
      if (project) {
        await storage.createActivity({
          userId,
          clientId: project.clientId,
          projectId: moodboard.projectId,
          type: "moodboard_created",
          description: `Created new moodboard: ${moodboard.name}`,
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
      const project = await storage.getProject(updatedMoodboard.projectId);
      
      // Create activity for updated moodboard
      if (project) {
        await storage.createActivity({
          userId: (req.user as any).id,
          clientId: project.clientId,
          projectId: updatedMoodboard.projectId,
          type: "moodboard_updated",
          description: `Updated moodboard: ${updatedMoodboard.name}`,
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
        const project = await storage.getProject(moodboard.projectId);
        
        // Create activity for deleted moodboard
        if (project) {
          await storage.createActivity({
            userId: (req.user as any).id,
            clientId: project.clientId,
            projectId: moodboard.projectId,
            type: "moodboard_deleted",
            description: `Deleted moodboard: ${moodboard.name}`,
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
        userId,
        clientId: estimate.clientId,
        projectId: estimate.projectId,
        type: "estimate_created",
        description: `Created new estimate: ${estimate.title}`,
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
        userId: (req.user as any).id,
        clientId: updatedEstimate.clientId,
        projectId: updatedEstimate.projectId,
        type: "estimate_updated",
        description: `Updated estimate: ${updatedEstimate.title}`,
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
          userId: (req.user as any).id,
          clientId: estimate.clientId,
          projectId: estimate.projectId,
          type: "estimate_deleted",
          description: `Deleted estimate: ${estimate.title}`,
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
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
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
          userId,
          clientId: project.clientId,
          projectId: task.projectId,
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
          userId: (req.user as any).id,
          clientId: project.clientId,
          projectId: updatedTask.projectId,
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
            userId: (req.user as any).id,
            clientId: project.clientId,
            projectId: task.projectId,
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
      const userId = (req.user as any).id;
      const activityData = insertActivitySchema.parse({ ...req.body, userId });
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
        userId: (req.user as any).id,
        clientId: req.body.clientId || null,
        projectId: req.body.projectId || null,
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
      const { feedback, clientId, projectId } = req.body;
      
      if (!feedback) {
        return res.status(400).json({ message: "Feedback text is required" });
      }
      
      const analysis = await analyzeClientFeedback(feedback);
      
      // Create an activity to track this AI interaction
      await storage.createActivity({
        userId: (req.user as any).id,
        clientId: clientId || null,
        projectId: projectId || null,
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
      const { style, colors, roomType, clientId, projectId } = req.body;
      
      if (!style || !colors || !roomType) {
        return res.status(400).json({ message: "Style, colors, and room type are required" });
      }
      
      const suggestions = await generateMoodboardSuggestions(style, colors, roomType);
      
      // Create an activity to track this AI interaction
      await storage.createActivity({
        userId: (req.user as any).id,
        clientId: clientId || null,
        projectId: projectId || null,
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
        userId: user.id,
        name: "Priya Sharma",
        email: "priya@example.com",
        phone: "+91 9876543210",
        company: "PriyaHome",
        address: "Mumbai, Maharashtra",
        status: "active"
      });
      
      const client2 = await storage.createClient({
        userId: user.id,
        name: "Rahul Mehta",
        email: "rahul@example.com",
        phone: "+91 9876543211",
        company: "MehtaEnterprises",
        address: "Bangalore, Karnataka",
        status: "active"
      });
      
      const client3 = await storage.createClient({
        userId: user.id,
        name: "Vikram Singh",
        email: "vikram@example.com",
        phone: "+91 9876543212",
        company: "Spice Avenue",
        address: "Delhi, NCR",
        status: "active"
      });
      
      // Add some test projects
      const project1 = await storage.createProject({
        userId: user.id,
        clientId: client1.id,
        name: "Modern Apartment Renovation",
        description: "Complete renovation of a 3BHK apartment with modern design elements",
        location: "Mumbai, Maharashtra",
        status: "active",
        budget: 1500000,
        progress: 65
      });
      
      const project2 = await storage.createProject({
        userId: user.id,
        clientId: client2.id,
        name: "Luxury Villa Design",
        description: "Custom design for a new luxury villa with premium materials",
        location: "Bangalore, Karnataka",
        status: "in_progress",
        budget: 5000000,
        progress: 40
      });
      
      const project3 = await storage.createProject({
        userId: user.id,
        clientId: client3.id,
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
