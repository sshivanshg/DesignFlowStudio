import { Router } from 'express';
import { MoodboardController } from '../controllers/moodboards/moodboard.controller';
import { authenticate } from '../middleware/auth';
import { hasRole } from '../middleware/auth';

const router = Router();
const moodboardController = new MoodboardController();

// All moodboard routes require authentication
router.use(authenticate);

// Moodboard CRUD routes
router.get('/', hasRole(['admin', 'designer']), moodboardController.getMoodboards.bind(moodboardController));
router.post('/', hasRole(['admin', 'designer']), moodboardController.createMoodboard.bind(moodboardController));
router.get('/:id', moodboardController.getMoodboard.bind(moodboardController));
router.put('/:id', hasRole(['admin', 'designer']), moodboardController.updateMoodboard.bind(moodboardController));
router.delete('/:id', hasRole(['admin', 'designer']), moodboardController.deleteMoodboard.bind(moodboardController));

// Moodboard templates
router.get('/templates', moodboardController.getMoodboardTemplates.bind(moodboardController));

// Client moodboard routes
router.get('/client/:clientId', moodboardController.getClientMoodboards.bind(moodboardController));

export default router; 