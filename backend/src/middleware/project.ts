import { Request, Response, NextFunction } from 'express';
import { storage } from '../services/storage';
import { AppError } from './errorHandler';
import { AuthenticatedRequest } from './auth';

// Middleware to check if user has access to a project
export const hasProjectAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    // Admin has access to all projects
    if (req.user?.role === 'admin') {
      return next();
    }

    // Check if user is assigned to the project
    // This assumes you have a way to check project assignments
    // You might need to modify this based on your project assignment logic
    const hasAccess = await storage.checkProjectAccess(projectId, req.user!.id);

    if (!hasAccess) {
      throw new AppError(403, 'You do not have access to this project');
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Project access check error:', error);
    res.status(500).json({ message: 'Error checking project access' });
  }
};

// Middleware to check if user can modify a project
export const canModifyProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    // Admin can modify all projects
    if (req.user?.role === 'admin') {
      return next();
    }

    // Only designers can modify projects
    if (req.user?.role !== 'designer') {
      throw new AppError(403, 'Only designers can modify projects');
    }

    // Check if designer is assigned to the project
    const hasAccess = await storage.checkProjectAccess(projectId, req.user.id);

    if (!hasAccess) {
      throw new AppError(403, 'You do not have access to modify this project');
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Project modification check error:', error);
    res.status(500).json({ message: 'Error checking project modification permissions' });
  }
}; 