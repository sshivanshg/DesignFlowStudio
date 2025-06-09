import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import notionRoutes from './notion.routes';
import clientRoutes from './client.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/notion', notionRoutes);
router.use('/clients', clientRoutes);

export default router; 