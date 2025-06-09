import { Router } from 'express';
import { ProjectController } from '../controllers/projects/project.controller';
import { requireAuth } from '../middleware/auth';
import { hasProjectAccess, canModifyProject } from '../middleware/project';

const router = Router();
const projectController = new ProjectController();

// All project routes require authentication
router.use(requireAuth);

// Project CRUD routes
router.post('/', projectController.createProject.bind(projectController));
router.get('/', projectController.getProjects.bind(projectController));

// Routes that require project access
router.get('/:id', hasProjectAccess, projectController.getProject.bind(projectController));
router.put('/:id', canModifyProject, projectController.updateProject.bind(projectController));
router.delete('/:id', canModifyProject, projectController.deleteProject.bind(projectController));

export default router; 