import { Router } from 'express';
import { ClientPortalController } from '../controllers/client-portal/client-portal.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();
const clientPortalController = new ClientPortalController();

// All client portal routes require client authentication
router.use(requireAuth);

// Client portal project routes
router.get('/projects', clientPortalController.getProjects.bind(clientPortalController));
router.get('/projects/:id', clientPortalController.getProject.bind(clientPortalController));

// Client portal proposal routes
router.get('/proposals', clientPortalController.getProposals.bind(clientPortalController));
router.get('/proposals/:id', clientPortalController.getProposal.bind(clientPortalController));
router.post('/proposals/:id/approve', clientPortalController.approveProposal.bind(clientPortalController));
router.post('/proposals/:id/comments', clientPortalController.addComment.bind(clientPortalController));

// Client portal estimate routes
router.get('/estimates', clientPortalController.getEstimates.bind(clientPortalController));
router.get('/estimates/:id', clientPortalController.getEstimate.bind(clientPortalController));

// Client portal moodboard routes
router.get('/moodboards', clientPortalController.getMoodboards.bind(clientPortalController));
router.get('/moodboards/:id', clientPortalController.getMoodboard.bind(clientPortalController));

export default router; 