import { notion, findDatabaseByTitle, addRecordToDatabase, queryDatabaseRecords, updateNotionRecord } from "../notion";
import { type Client } from "../../shared/schema";

/**
 * Syncs a client from our database to Notion
 */
export async function syncClientToNotion(client: Client) {
    try {
        const clientsDb = await findDatabaseByTitle("Interior Design Clients");
        if (!clientsDb) {
            throw new Error("Clients database not found in Notion");
        }

        // Check if client already exists in Notion by querying with the email
        const existingClients = await queryDatabaseRecords(clientsDb.id, {
            property: "Email",
            email: {
                equals: client.email
            }
        });

        if (existingClients.results.length > 0) {
            // Update existing client
            const notionPageId = existingClients.results[0].id;
            await updateNotionRecord(notionPageId, {
                Name: {
                    title: [
                        {
                            text: {
                                content: client.name
                            }
                        }
                    ]
                },
                Email: {
                    email: client.email
                },
                Phone: {
                    phone_number: client.phone || ""
                },
                Company: {
                    rich_text: [
                        {
                            text: {
                                content: client.company || ""
                            }
                        }
                    ]
                },
                Status: {
                    select: {
                        name: client.status || "Active"
                    }
                },
                Notes: {
                    rich_text: [
                        {
                            text: {
                                content: "Synced from Interior Design Suite"
                            }
                        }
                    ]
                },
                LastContact: {
                    date: {
                        start: new Date().toISOString()
                    }
                }
            });
            return { success: true, message: "Client updated in Notion", notionId: notionPageId };
        } else {
            // Create new client in Notion
            const response = await addRecordToDatabase(clientsDb.id, {
                Name: {
                    title: [
                        {
                            text: {
                                content: client.name
                            }
                        }
                    ]
                },
                Email: {
                    email: client.email
                },
                Phone: {
                    phone_number: client.phone || ""
                },
                Company: {
                    rich_text: [
                        {
                            text: {
                                content: client.company || ""
                            }
                        }
                    ]
                },
                Status: {
                    select: {
                        name: client.status || "Active"
                    }
                },
                Notes: {
                    rich_text: [
                        {
                            text: {
                                content: "Synced from Interior Design Suite"
                            }
                        }
                    ]
                },
                LastContact: {
                    date: {
                        start: new Date().toISOString()
                    }
                }
            });
            return { success: true, message: "Client created in Notion", notionId: response.id };
        }
    } catch (error) {
        console.error("Error syncing client to Notion:", error);
        return { success: false, message: "Failed to sync client to Notion: " + error.message };
    }
}

/**
 * Gets all clients from Notion
 */
export async function getClientsFromNotion() {
    try {
        const clientsDb = await findDatabaseByTitle("Interior Design Clients");
        if (!clientsDb) {
            throw new Error("Clients database not found in Notion");
        }

        const response = await queryDatabaseRecords(clientsDb.id);
        
        return {
            success: true,
            clients: response.results.map(page => {
                const properties = page.properties;
                
                // Extract data from Notion's complex property structure
                const name = properties.Name?.title?.[0]?.text?.content || "Unnamed Client";
                const email = properties.Email?.email || "";
                const phone = properties.Phone?.phone_number || "";
                const company = properties.Company?.rich_text?.[0]?.text?.content || "";
                const status = properties.Status?.select?.name || "Active";
                const lastContact = properties.LastContact?.date?.start || null;
                
                return {
                    notionId: page.id,
                    name,
                    email,
                    phone,
                    company,
                    status,
                    lastContact: lastContact ? new Date(lastContact) : null,
                };
            })
        };
    } catch (error) {
        console.error("Error getting clients from Notion:", error);
        return { success: false, message: "Failed to get clients from Notion: " + error.message };
    }
}