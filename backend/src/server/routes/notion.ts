import { Express, Request, Response } from "express";
import { initializeNotion } from "../setup-notion";
import { syncClientToNotion, getClientsFromNotion } from "../services/notionClients";
import { syncProjectToNotion, getProjectsFromNotion } from "../services/notionProjects";
import { syncMoodboardToNotion, getMoodboardsFromNotion } from "../services/notionMoodboards";
import { IStorage } from "../storage";

/**
 * Register Notion-related routes
 */
export function registerNotionRoutes(app: Express, storage: IStorage, isAuthenticated: any, hasRole: any) {
    // Route to initialize Notion databases and sample data
    app.post("/api/admin/notion/initialize", isAuthenticated, hasRole(['admin']), async (req: Request, res: Response) => {
        try {
            const result = await initializeNotion();
            res.json(result);
        } catch (error) {
            console.error("Error initializing Notion:", error);
            res.status(500).json({ success: false, message: "Error initializing Notion: " + error.message });
        }
    });

    // Routes for clients
    app.get("/api/notion/clients", isAuthenticated, hasRole(['admin', 'designer']), async (req: Request, res: Response) => {
        try {
            const result = await getClientsFromNotion();
            res.json(result);
        } catch (error) {
            console.error("Error getting clients from Notion:", error);
            res.status(500).json({ success: false, message: "Error getting clients from Notion: " + error.message });
        }
    });

    app.post("/api/notion/clients/:id/sync", isAuthenticated, hasRole(['admin', 'designer']), async (req: Request, res: Response) => {
        try {
            const clientId = parseInt(req.params.id);
            const client = await storage.getClient(clientId);
            
            if (!client) {
                return res.status(404).json({ success: false, message: "Client not found" });
            }
            
            const result = await syncClientToNotion(client);
            res.json(result);
        } catch (error) {
            console.error("Error syncing client to Notion:", error);
            res.status(500).json({ success: false, message: "Error syncing client to Notion: " + error.message });
        }
    });

    // Routes for projects
    app.get("/api/notion/projects", isAuthenticated, hasRole(['admin', 'designer']), async (req: Request, res: Response) => {
        try {
            const result = await getProjectsFromNotion();
            res.json(result);
        } catch (error) {
            console.error("Error getting projects from Notion:", error);
            res.status(500).json({ success: false, message: "Error getting projects from Notion: " + error.message });
        }
    });

    app.post("/api/notion/projects/:id/sync", isAuthenticated, hasRole(['admin', 'designer']), async (req: Request, res: Response) => {
        try {
            const projectId = parseInt(req.params.id);
            const project = await storage.getProject(projectId);
            
            if (!project) {
                return res.status(404).json({ success: false, message: "Project not found" });
            }
            
            const result = await syncProjectToNotion(project, storage);
            res.json(result);
        } catch (error) {
            console.error("Error syncing project to Notion:", error);
            res.status(500).json({ success: false, message: "Error syncing project to Notion: " + error.message });
        }
    });

    // Routes for moodboards
    app.get("/api/notion/moodboards", isAuthenticated, hasRole(['admin', 'designer']), async (req: Request, res: Response) => {
        try {
            const result = await getMoodboardsFromNotion();
            res.json(result);
        } catch (error) {
            console.error("Error getting moodboards from Notion:", error);
            res.status(500).json({ success: false, message: "Error getting moodboards from Notion: " + error.message });
        }
    });

    app.post("/api/notion/moodboards/:id/sync", isAuthenticated, hasRole(['admin', 'designer']), async (req: Request, res: Response) => {
        try {
            const moodboardId = parseInt(req.params.id);
            const moodboard = await storage.getMoodboard(moodboardId);
            
            if (!moodboard) {
                return res.status(404).json({ success: false, message: "Moodboard not found" });
            }
            
            const result = await syncMoodboardToNotion(moodboard, storage);
            res.json(result);
        } catch (error) {
            console.error("Error syncing moodboard to Notion:", error);
            res.status(500).json({ success: false, message: "Error syncing moodboard to Notion: " + error.message });
        }
    });

    // Bulk sync routes
    app.post("/api/notion/sync/all-clients", isAuthenticated, hasRole(['admin']), async (req: Request, res: Response) => {
        try {
            const userId = (req.user as any)?.id || 0;
            const clients = await storage.getClients(userId);
            
            const results = [];
            for (const client of clients) {
                const result = await syncClientToNotion(client);
                results.push({
                    clientId: client.id,
                    name: client.name,
                    success: result.success,
                    message: result.message
                });
            }
            
            res.json({
                success: true,
                message: `Synced ${results.length} clients to Notion`,
                results
            });
        } catch (error) {
            console.error("Error syncing all clients to Notion:", error);
            res.status(500).json({ success: false, message: "Error syncing all clients to Notion: " + error.message });
        }
    });

    app.post("/api/notion/sync/all-projects", isAuthenticated, hasRole(['admin']), async (req: Request, res: Response) => {
        try {
            const userId = (req.user as any)?.id || 0;
            const projects = await storage.getProjects(userId);
            
            const results = [];
            for (const project of projects) {
                const result = await syncProjectToNotion(project, storage);
                results.push({
                    projectId: project.id,
                    name: project.name,
                    success: result.success,
                    message: result.message
                });
            }
            
            res.json({
                success: true,
                message: `Synced ${results.length} projects to Notion`,
                results
            });
        } catch (error) {
            console.error("Error syncing all projects to Notion:", error);
            res.status(500).json({ success: false, message: "Error syncing all projects to Notion: " + error.message });
        }
    });
}