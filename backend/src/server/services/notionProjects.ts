import { notion, findDatabaseByTitle, addRecordToDatabase, queryDatabaseRecords, updateNotionRecord } from "../notion";
import { type Project } from "../../shared/schema";
import { syncClientToNotion } from "./notionClients";

/**
 * Syncs a project from our database to Notion
 */
export async function syncProjectToNotion(project: Project, storage: any) {
    try {
        // Verify that the projects database exists
        const projectsDb = await findDatabaseByTitle("Interior Design Projects");
        if (!projectsDb) {
            throw new Error("Projects database not found in Notion");
        }

        // If this project has a client, make sure the client is synced to Notion first
        let clientNotionId = null;
        if (project.client_id) {
            const client = await storage.getClient(project.client_id);
            if (client) {
                const clientSync = await syncClientToNotion(client);
                if (clientSync.success) {
                    clientNotionId = clientSync.notionId;
                }
            }
        }

        // Check if project already exists in Notion by name
        const existingProjects = await queryDatabaseRecords(projectsDb.id, {
            property: "Name",
            title: {
                equals: project.name
            }
        });

        const projectProperties: any = {
            Name: {
                title: [
                    {
                        text: {
                            content: project.name
                        }
                    }
                ]
            },
            Status: {
                select: {
                    name: project.status || "Planning"
                }
            },
            Description: {
                rich_text: [
                    {
                        text: {
                            content: project.description || ""
                        }
                    }
                ]
            },
            Location: {
                rich_text: [
                    {
                        text: {
                            content: project.location || ""
                        }
                    }
                ]
            }
        };

        // Add client relation if we have a client Notion ID
        if (clientNotionId) {
            projectProperties.Client = {
                relation: [
                    {
                        id: clientNotionId
                    }
                ]
            };
        }

        if (existingProjects.results.length > 0) {
            // Update existing project
            const notionPageId = existingProjects.results[0].id;
            await updateNotionRecord(notionPageId, projectProperties);
            return { success: true, message: "Project updated in Notion", notionId: notionPageId };
        } else {
            // Create new project
            const response = await addRecordToDatabase(projectsDb.id, projectProperties);
            return { success: true, message: "Project created in Notion", notionId: response.id };
        }
    } catch (error) {
        console.error("Error syncing project to Notion:", error);
        return { success: false, message: "Failed to sync project to Notion: " + error.message };
    }
}

/**
 * Gets all projects from Notion
 */
export async function getProjectsFromNotion() {
    try {
        const projectsDb = await findDatabaseByTitle("Interior Design Projects");
        if (!projectsDb) {
            throw new Error("Projects database not found in Notion");
        }

        const response = await queryDatabaseRecords(projectsDb.id);
        
        return {
            success: true,
            projects: response.results.map(page => {
                const properties = page.properties;
                
                // Extract data from Notion's complex property structure
                const name = properties.Name?.title?.[0]?.text?.content || "Unnamed Project";
                const status = properties.Status?.select?.name || "Planning";
                const description = properties.Description?.rich_text?.[0]?.text?.content || "";
                const location = properties.Location?.rich_text?.[0]?.text?.content || "";
                const budget = properties.Budget?.number || null;
                const startDate = properties.StartDate?.date?.start || null;
                const endDate = properties.EndDate?.date?.start || null;
                
                // Get client relation if exists
                const clientRelation = properties.Client?.relation?.[0]?.id || null;
                
                return {
                    notionId: page.id,
                    name,
                    status,
                    description,
                    location,
                    budget,
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    clientNotionId: clientRelation
                };
            })
        };
    } catch (error) {
        console.error("Error getting projects from Notion:", error);
        return { success: false, message: "Failed to get projects from Notion: " + error.message };
    }
}