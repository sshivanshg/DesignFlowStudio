import { Express, Request, Response } from "express";
import { IStorage } from "../storage";

/**
 * Register dashboard-related routes
 */
export function registerDashboardRoutes(app: Express, storage: IStorage, isAuthenticated: any) {
  // Get dashboard statistics
  app.get("/api/dashboard/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get user ID from request
      const userId = (req.user as any)?.id || 0;
      
      // Get counts from the database
      const [
        clients, 
        projects, 
        proposals, 
        moodboards, 
        activities
      ] = await Promise.all([
        storage.getClients(userId),
        storage.getProjects(userId),
        storage.getProposals(userId),
        storage.getMoodboards(),
        storage.getActivities(userId, 20)
      ]);

      // Calculate active projects
      const activeProjects = projects.filter(project => 
        project.status === 'active' || project.status === 'in progress'
      ).length;
      
      // Calculate pending proposals
      const pendingProposals = proposals.filter(proposal => 
        proposal.status === 'pending' || proposal.status === 'draft'
      ).length;
      
      // For demonstration purposes, calculate a sample revenue 
      // In a real app, this would come from actual financial data
      const monthlyRevenue = 125000; // Example fixed value
      
      // Format revenue as INR
      const formattedRevenue = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(monthlyRevenue);
      
      // Calculate client interactions in the last 7 days
      const lastWeekDate = new Date();
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      
      const recentInteractions = activities.filter(activity => {
        const activityDate = new Date(activity.createdAt || new Date());
        return activityDate >= lastWeekDate;
      }).length;
      
      res.json({
        totalClients: clients.length,
        activeProjects,
        pendingProposals,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        revenue: formattedRevenue,
        interactions: recentInteractions
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });

  // Get recent projects for dashboard
  app.get("/api/dashboard/recent-projects", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get user ID from request
      const userId = (req.user as any)?.id || 0;
      
      // Get the most recent projects
      const projects = await storage.getProjects(userId);
      
      // Sort by created date (newest first) and take the first 5
      const recentProjects = projects
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);
      
      // For each project, get the associated client
      const projectsWithClients = await Promise.all(
        recentProjects.map(async project => {
          let client = null;
          if (project.client_id) {
            client = await storage.getClient(project.client_id);
          }
          
          return {
            ...project,
            clientName: client ? client.name : 'No Client'
          };
        })
      );
      
      res.json(projectsWithClients);
    } catch (error) {
      console.error("Error fetching recent projects:", error);
      res.status(500).json({ message: "Error fetching recent projects" });
    }
  });

  // Get recent proposals for dashboard
  app.get("/api/dashboard/recent-proposals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get user ID from request
      const userId = (req.user as any)?.id || 0;
      
      // Get the most recent proposals
      const proposals = await storage.getProposals(userId);
      
      // Sort by created date (newest first) and take the first 5
      const recentProposals = proposals
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);
      
      // For each proposal, get the associated client
      const proposalsWithClients = await Promise.all(
        recentProposals.map(async proposal => {
          let client = null;
          if (proposal.client_id) {
            client = await storage.getClient(proposal.client_id);
          }
          
          return {
            ...proposal,
            clientName: client ? client.name : 'No Client'
          };
        })
      );
      
      res.json(proposalsWithClients);
    } catch (error) {
      console.error("Error fetching recent proposals:", error);
      res.status(500).json({ message: "Error fetching recent proposals" });
    }
  });

  // Get upcoming tasks for dashboard
  app.get("/api/dashboard/upcoming-tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get user ID from request
      const userId = (req.user as any)?.id || 0;
      
      // In a real implementation, this would fetch tasks from a tasks table
      // For now, we'll extract tasks from project.tasks arrays
      const projects = await storage.getProjects(userId);
      
      // Collect all tasks from all projects
      const allTasks = projects.flatMap(project => {
        const tasks = project.tasks || [];
        // Add project info to each task
        return Array.isArray(tasks) ? tasks.map((task: any) => ({
          ...task,
          projectId: project.id,
          projectName: project.name
        })) : [];
      });
      
      // Filter for upcoming tasks (due in the next 7 days)
      const currentDate = new Date();
      const oneWeekLater = new Date();
      oneWeekLater.setDate(oneWeekLater.getDate() + 7);
      
      const upcomingTasks = allTasks.filter((task: any) => {
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        return dueDate >= currentDate && dueDate <= oneWeekLater;
      });
      
      // Sort by due date (closest first)
      const sortedTasks = upcomingTasks.sort((a: any, b: any) => {
        const dateA = new Date(a.dueDate || 0);
        const dateB = new Date(b.dueDate || 0);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Take the first 5
      res.json(sortedTasks.slice(0, 5));
    } catch (error) {
      console.error("Error fetching upcoming tasks:", error);
      res.status(500).json({ message: "Error fetching upcoming tasks" });
    }
  });

  // Get recent client activities for dashboard
  app.get("/api/dashboard/recent-activities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get user ID from request
      const userId = (req.user as any)?.id || 0;
      
      // Get recent activities
      const activities = await storage.getActivities(userId, 10);
      
      // Augment with client and project data
      const enrichedActivities = await Promise.all(
        activities.map(async activity => {
          let client = null;
          let project = null;
          
          if (activity.client_id) {
            client = await storage.getClient(activity.client_id);
          }
          
          if (activity.project_id) {
            project = await storage.getProject(activity.project_id);
          }
          
          return {
            ...activity,
            clientName: client ? client.name : null,
            projectName: project ? project.name : null
          };
        })
      );
      
      res.json(enrichedActivities);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({ message: "Error fetching recent activities" });
    }
  });
}