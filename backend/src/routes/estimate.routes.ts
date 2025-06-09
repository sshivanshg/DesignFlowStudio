import { Router } from 'express';
import { EstimateController } from '../controllers/estimates/estimate.controller';
import { authenticate } from '../middleware/auth';
import { hasRole } from '../middleware/auth';

const router = Router();
const estimateController = new EstimateController();

// All estimate routes require authentication
router.use(authenticate);

// Estimate CRUD routes
router.get('/', hasRole(['admin', 'designer']), estimateController.getEstimates.bind(estimateController));
router.post('/', hasRole(['admin', 'designer']), estimateController.createEstimate.bind(estimateController));
router.get('/:id', estimateController.getEstimate.bind(estimateController));
router.put('/:id', hasRole(['admin', 'designer']), estimateController.updateEstimate.bind(estimateController));
router.delete('/:id', hasRole(['admin', 'designer']), estimateController.deleteEstimate.bind(estimateController));

// Project estimate routes
router.get('/project/:projectId', estimateController.getProjectEstimates.bind(estimateController));

// Estimate templates
router.get('/templates', estimateController.getEstimateTemplates.bind(estimateController));

// AI-powered estimate generation
router.post('/ai-generate', hasRole(['admin', 'designer']), estimateController.generateAIEstimate.bind(estimateController));

// Estimate configuration routes
router.get('/configs', hasRole(['admin']), estimateController.getEstimateConfigs.bind(estimateController));
router.get('/configs/active', hasRole(['admin', 'designer']), estimateController.getActiveEstimateConfigs.bind(estimateController));
router.get('/configs/:id', hasRole(['admin', 'designer']), estimateController.getEstimateConfig.bind(estimateController));

export default router; 