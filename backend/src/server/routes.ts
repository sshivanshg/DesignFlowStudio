import express, { Express, Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { registerDashboardRoutes } from './dashboard';
import { registerAuthRoutes } from './auth';
import { registerClientAuthRoutes } from './clientAuth';
import { WhatsAppService } from './whatsapp';
import clientPortalRoutes from '../routes/client-portal.routes';
import { sessionConfig } from '../config/session.config';
import { storage } from '../config/storage.config';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth.middleware';

// Extend Express Session interface
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    clientId?: string;
  }
}

// Constants
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key';
const SessionStore = MemoryStore(session);

// Middleware
const hasRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

const isClientAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.clientId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Main Route Registration
export async function registerRoutes(app: Express): Promise<Server> {
  try {
    // Session Configuration
    app.use(session(sessionConfig));

    // Basic Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Health Check
    app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok' });
    });

    // API Routes
    app.use('/api/auth', registerAuthRoutes());
    app.use('/api/client-auth', registerClientAuthRoutes());
    app.use('/api/client-portal', clientPortalRoutes);
    app.use('/api/dashboard', registerDashboardRoutes(app, storage, isAuthenticated));

    // Error Handling
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error(err.stack);
      res.status(500).json({ message: 'Something went wrong!' });
    });

    // Start Server
    const port = process.env.PORT || 5001; // Use consistent port
    return new Promise((resolve, reject) => {
      const httpServer = app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
        resolve(httpServer);
      }).on('error', (err) => {
        console.error('Failed to start server:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('Error registering routes:', error);
    throw error;
  }
}

// Test Data Setup (if needed)
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
