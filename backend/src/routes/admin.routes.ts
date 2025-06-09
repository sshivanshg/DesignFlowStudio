import { Router } from 'express';
import { AdminController } from '../controllers/admin/admin.controller';
import { authenticate } from '../middleware/auth';
import { hasRole } from '../middleware/auth';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(hasRole(['admin']));

// Company settings
router.get('/company-settings', adminController.getCompanySettings.bind(adminController));
router.put('/company-settings', adminController.updateCompanySettings.bind(adminController));

// Template categories
router.get('/template-categories', adminController.getTemplateCategories.bind(adminController));
router.post('/template-categories', adminController.createTemplateCategory.bind(adminController));
router.put('/template-categories/:id', adminController.updateTemplateCategory.bind(adminController));
router.delete('/template-categories/:id', adminController.deleteTemplateCategory.bind(adminController));

// Templates
router.get('/templates', adminController.getTemplates.bind(adminController));
router.post('/templates', adminController.createTemplate.bind(adminController));
router.put('/templates/:id', adminController.updateTemplate.bind(adminController));
router.delete('/templates/:id', adminController.deleteTemplate.bind(adminController));

// Notion integration
router.post('/notion/initialize', adminController.initializeNotion.bind(adminController));

// WhatsApp integration
router.post('/whatsapp/retry-failed', adminController.retryFailedWhatsAppMessages.bind(adminController));

export default router; 