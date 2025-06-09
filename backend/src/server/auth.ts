import { Router } from 'express';
import { Request, Response } from 'express';
import { storage } from '../config/storage.config';
import { isAuthenticated, hasRole } from '../middleware/auth.middleware';

export function registerAuthRoutes() {
  const router = Router();

  // Authentication routes
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await storage.authenticateUser(email, password);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Error during login', error });
    }
  });

  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      const user = await storage.createUser({ email, password, name });
      
      req.session.userId = user.id;
      res.status(201).json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Error during registration', error });
    }
  });

  router.post('/logout', isAuthenticated, (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error during logout', error: err });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  router.get('/me', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserById(req.session.userId);
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user data', error });
    }
  });

  return router;
} 