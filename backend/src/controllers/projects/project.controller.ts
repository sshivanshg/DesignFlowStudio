import { Request, Response } from 'express';
import { storage } from '../../services/storage';
import { insertProjectSchema } from '../../models/schema';
import { AppError } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../middleware/auth';

export class ProjectController {
  async createProject(req: AuthenticatedRequest, res: Response) {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...projectData,
        userId: req.user!.id
      });
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error("Project creation error:", error);
      return res.status(500).json({ message: "Error creating project" });
    }
  }

  async getProjects(req: AuthenticatedRequest, res: Response) {
    try {
      const projects = await storage.getProjectsByUserId(req.user!.id);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      return res.status(500).json({ message: "Error fetching projects" });
    }
  }

  async getProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const project = await storage.getProject(parseInt(id));
      
      if (!project) {
        throw new AppError(404, "Project not found");
      }

      // Check if user has access to this project
      if (project.userId !== req.user!.id && req.user!.role !== 'admin') {
        throw new AppError(403, "Access denied to this project");
      }

      res.json(project);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error("Error fetching project:", error);
      return res.status(500).json({ message: "Error fetching project" });
    }
  }

  async updateProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const projectData = insertProjectSchema.partial().parse(req.body);
      
      const project = await storage.getProject(parseInt(id));
      if (!project) {
        throw new AppError(404, "Project not found");
      }

      // Check if user has access to update this project
      if (project.userId !== req.user!.id && req.user!.role !== 'admin') {
        throw new AppError(403, "Access denied to update this project");
      }

      const updatedProject = await storage.updateProject(parseInt(id), projectData);
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error("Error updating project:", error);
      return res.status(500).json({ message: "Error updating project" });
    }
  }

  async deleteProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const project = await storage.getProject(parseInt(id));
      if (!project) {
        throw new AppError(404, "Project not found");
      }

      // Check if user has access to delete this project
      if (project.userId !== req.user!.id && req.user!.role !== 'admin') {
        throw new AppError(403, "Access denied to delete this project");
      }

      await storage.deleteProject(parseInt(id));
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error("Error deleting project:", error);
      return res.status(500).json({ message: "Error deleting project" });
    }
  }
} 