import { Express, Router } from 'express';
import { Storage } from '@google-cloud/storage';
import { Request, Response, NextFunction } from 'express';

export function registerDashboardRoutes(
  app: Express,
  storage: Storage,
  isAuthenticated: (req: Request, res: Response, next: NextFunction) => void
) {
  const router = Router();

  // Dashboard routes
  router.get('/stats', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching dashboard stats', error });
    }
  });

  router.get('/recent-activities', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const activities = await storage.getRecentActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching recent activities', error });
    }
  });

  router.get('/upcoming-tasks', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getUpcomingTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching upcoming tasks', error });
    }
  });

  return router;
} 