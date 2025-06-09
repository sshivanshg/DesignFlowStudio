import { Router } from 'express';
import { ClientController } from '../controllers/clients/client.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
const clientController = new ClientController();

// All client routes require authentication
router.use(requireAuth);

// Client CRUD routes
router.get('/', requireRole(['admin', 'designer', 'sales']), clientController.getClients.bind(clientController));
router.post('/', requireRole(['admin', 'designer', 'sales']), clientController.createClient.bind(clientController));
router.get('/:id', clientController.getClient.bind(clientController));
router.put('/:id', requireRole(['admin', 'designer']), clientController.updateClient.bind(clientController));
router.delete('/:id', requireRole(['admin']), clientController.deleteClient.bind(clientController));

// Client project routes
router.get('/:id/projects', clientController.getClientProjects.bind(clientController));

export default router; 