import { notion, findDatabaseByTitle, addRecordToDatabase, queryDatabaseRecords, updateNotionRecord } from "../notion";
import { type Moodboard } from "../../shared/schema";
import { syncProjectToNotion } from "./notionProjects";

/**
 * Syncs a moodboard from our database to Notion
 */
export async function syncMoodboardToNotion(moodboard: Moodboard, storage: any) {
    try {
        const moodboardsDb = await findDatabaseByTitle("Design Moodboards");
        if (!moodboardsDb) {
            throw new Error("Moodboards database not found in Notion");
        }

        // If this moodboard has a project, ensure the project is synced to Notion first
        let projectNotionId = null;
        if (moodboard.project_id) {
            const project = await storage.getProject(moodboard.project_id);
            if (project) {
                const projectSync = await syncProjectToNotion(project, storage);
                if (projectSync.success) {
                    projectNotionId = projectSync.notionId;
                }
            }
        }

        // Check if moodboard already exists in Notion by name
        const existingMoodboards = await queryDatabaseRecords(moodboardsDb.id, {
            property: "Name",
            title: {
                equals: moodboard.name
            }
        });

        // Parse moodboard data
        let colorPalette = "N/A";
        let materials: string[] = [];
        let style = "Modern"; // Default style
        
        // Try to extract data from moodboard.dataJSON if available
        if (moodboard.dataJSON) {
            try {
                const data = typeof moodboard.dataJSON === 'string' 
                    ? JSON.parse(moodboard.dataJSON) 
                    : moodboard.dataJSON;
                
                if (data.colorPalette && Array.isArray(data.colorPalette)) {
                    colorPalette = data.colorPalette.join(", ");
                }
                
                if (data.materials && Array.isArray(data.materials)) {
                    materials = data.materials.filter(m => typeof m === 'string');
                }
                
                if (data.style && typeof data.style === 'string') {
                    style = data.style;
                }
            } catch (e) {
                console.error("Error parsing moodboard JSON:", e);
            }
        }

        const moodboardProperties: any = {
            Name: {
                title: [
                    {
                        text: {
                            content: moodboard.name
                        }
                    }
                ]
            },
            Style: {
                select: {
                    name: style
                }
            },
            ColorPalette: {
                rich_text: [
                    {
                        text: {
                            content: colorPalette
                        }
                    }
                ]
            },
            Notes: {
                rich_text: [
                    {
                        text: {
                            content: moodboard.description || "Synced from Interior Design Suite"
                        }
                    }
                ]
            }
        };

        // Add materials as multi-select
        if (materials.length > 0) {
            moodboardProperties.Materials = {
                multi_select: materials.map(material => ({
                    name: material
                }))
            };
        }

        // Add project relation if we have a project Notion ID
        if (projectNotionId) {
            moodboardProperties.Project = {
                relation: [
                    {
                        id: projectNotionId
                    }
                ]
            };
        }

        if (existingMoodboards.results.length > 0) {
            // Update existing moodboard
            const notionPageId = existingMoodboards.results[0].id;
            await updateNotionRecord(notionPageId, moodboardProperties);
            return { success: true, message: "Moodboard updated in Notion", notionId: notionPageId };
        } else {
            // Create new moodboard
            const response = await addRecordToDatabase(moodboardsDb.id, moodboardProperties);
            return { success: true, message: "Moodboard created in Notion", notionId: response.id };
        }
    } catch (error) {
        console.error("Error syncing moodboard to Notion:", error);
        return { success: false, message: "Failed to sync moodboard to Notion: " + error.message };
    }
}

/**
 * Gets all moodboards from Notion
 */
export async function getMoodboardsFromNotion() {
    try {
        const moodboardsDb = await findDatabaseByTitle("Design Moodboards");
        if (!moodboardsDb) {
            throw new Error("Moodboards database not found in Notion");
        }

        const response = await queryDatabaseRecords(moodboardsDb.id);
        
        return {
            success: true,
            moodboards: response.results.map(page => {
                const properties = page.properties;
                
                // Extract data from Notion's complex property structure
                const name = properties.Name?.title?.[0]?.text?.content || "Unnamed Moodboard";
                const style = properties.Style?.select?.name || "Modern";
                const colorPalette = properties.ColorPalette?.rich_text?.[0]?.text?.content || "";
                const notes = properties.Notes?.rich_text?.[0]?.text?.content || "";
                
                // Get materials as array
                const materials = properties.Materials?.multi_select?.map(item => item.name) || [];
                
                // Get project relation if exists
                const projectRelation = properties.Project?.relation?.[0]?.id || null;
                
                // Build a dataJSON object with the extracted data
                const dataJSON = {
                    style,
                    colorPalette: colorPalette.split(", ").map(color => color.trim()),
                    materials
                };
                
                return {
                    notionId: page.id,
                    name,
                    description: notes,
                    dataJSON,
                    projectNotionId: projectRelation
                };
            })
        };
    } catch (error) {
        console.error("Error getting moodboards from Notion:", error);
        return { success: false, message: "Failed to get moodboards from Notion: " + error.message };
    }
}