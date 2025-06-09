import { Router } from 'express';
import { isAuthenticated, hasRole } from '../middleware/auth.middleware';

const router = Router();

// Notion integration routes
router.post('/sync', isAuthenticated, hasRole(['admin']), async (req, res) => {
  try {
    // TODO: Implement Notion sync logic
    res.json({ message: 'Notion sync initiated' });
  } catch (error) {
    res.status(500).json({ message: 'Error syncing with Notion', error });
  }
});

router.get('/status', isAuthenticated, hasRole(['admin']), async (req, res) => {
  try {
    // TODO: Implement Notion sync status check
    res.json({ status: 'connected' });
  } catch (error) {
    res.status(500).json({ message: 'Error checking Notion status', error });
  }
});

export default router; 