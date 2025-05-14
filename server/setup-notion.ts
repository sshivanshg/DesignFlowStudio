import { notion, NOTION_PAGE_ID, createDatabaseIfNotExists, findDatabaseByTitle } from "./notion";

// Environment variables validation
if (!process.env.NOTION_INTEGRATION_SECRET) {
    throw new Error("NOTION_INTEGRATION_SECRET is not defined. Please add it to your environment variables.");
}

// Function to setup databases for an interior design business
async function setupNotionDatabases() {
    console.log("Setting up Notion databases...");
    
    // 1. Clients Database
    await createDatabaseIfNotExists("Interior Design Clients", {
        Name: {
            title: {}
        },
        Email: {
            email: {}
        },
        Phone: {
            phone_number: {}
        },
        Company: {
            rich_text: {}
        },
        Status: {
            select: {
                options: [
                    { name: "Active", color: "green" },
                    { name: "Potential", color: "yellow" },
                    { name: "Inactive", color: "gray" },
                    { name: "Completed", color: "blue" }
                ]
            }
        },
        Notes: {
            rich_text: {}
        },
        LastContact: {
            date: {}
        }
    });
    
    // 2. Projects Database
    await createDatabaseIfNotExists("Interior Design Projects", {
        Name: {
            title: {}
        },
        Client: {
            relation: {
                database_id: (await findDatabaseByTitle("Interior Design Clients"))?.id || ""
            }
        },
        Status: {
            select: {
                options: [
                    { name: "Planning", color: "blue" },
                    { name: "In Progress", color: "yellow" },
                    { name: "On Hold", color: "orange" },
                    { name: "Completed", color: "green" }
                ]
            }
        },
        StartDate: {
            date: {}
        },
        EndDate: {
            date: {}
        },
        Budget: {
            number: {
                format: "dollar"
            }
        },
        Location: {
            rich_text: {}
        },
        Description: {
            rich_text: {}
        }
    });
    
    // 3. Moodboards Database
    await createDatabaseIfNotExists("Design Moodboards", {
        Name: {
            title: {}
        },
        Project: {
            relation: {
                database_id: (await findDatabaseByTitle("Interior Design Projects"))?.id || ""
            }
        },
        Style: {
            select: {
                options: [
                    { name: "Modern", color: "blue" },
                    { name: "Contemporary", color: "purple" },
                    { name: "Traditional", color: "brown" },
                    { name: "Minimalist", color: "gray" },
                    { name: "Industrial", color: "yellow" },
                    { name: "Bohemian", color: "orange" },
                    { name: "Scandinavian", color: "green" }
                ]
            }
        },
        ColorPalette: {
            rich_text: {}
        },
        Materials: {
            multi_select: {
                options: [
                    { name: "Wood", color: "brown" },
                    { name: "Metal", color: "gray" },
                    { name: "Glass", color: "blue" },
                    { name: "Fabric", color: "purple" },
                    { name: "Stone", color: "yellow" },
                    { name: "Concrete", color: "default" }
                ]
            }
        },
        ImageLinks: {
            rich_text: {}
        },
        Notes: {
            rich_text: {}
        }
    });
    
    // 4. Proposals Database
    await createDatabaseIfNotExists("Design Proposals", {
        Name: {
            title: {}
        },
        Client: {
            relation: {
                database_id: (await findDatabaseByTitle("Interior Design Clients"))?.id || ""
            }
        },
        Project: {
            relation: {
                database_id: (await findDatabaseByTitle("Interior Design Projects"))?.id || ""
            }
        },
        Status: {
            select: {
                options: [
                    { name: "Draft", color: "gray" },
                    { name: "Sent", color: "yellow" },
                    { name: "Approved", color: "green" },
                    { name: "Rejected", color: "red" },
                    { name: "Needs Revision", color: "orange" }
                ]
            }
        },
        SentDate: {
            date: {}
        },
        ResponseDate: {
            date: {}
        },
        TotalAmount: {
            number: {
                format: "dollar"
            }
        },
        ProposalURL: {
            url: {}
        },
        Notes: {
            rich_text: {}
        }
    });
    
    // 5. Tasks Database
    await createDatabaseIfNotExists("Design Tasks", {
        Name: {
            title: {}
        },
        Project: {
            relation: {
                database_id: (await findDatabaseByTitle("Interior Design Projects"))?.id || ""
            }
        },
        Status: {
            select: {
                options: [
                    { name: "To Do", color: "red" },
                    { name: "In Progress", color: "yellow" },
                    { name: "Done", color: "green" },
                    { name: "Blocked", color: "gray" }
                ]
            }
        },
        DueDate: {
            date: {}
        },
        AssignedTo: {
            rich_text: {}
        },
        Priority: {
            select: {
                options: [
                    { name: "High", color: "red" },
                    { name: "Medium", color: "yellow" },
                    { name: "Low", color: "blue" }
                ]
            }
        },
        Notes: {
            rich_text: {}
        }
    });

    console.log("Notion databases setup completed successfully!");
}

// Function to create sample data
async function createSampleData() {
    try {
        console.log("Adding sample data...");

        // Find the databases
        const clientsDb = await findDatabaseByTitle("Interior Design Clients");
        const projectsDb = await findDatabaseByTitle("Interior Design Projects");
        const moodboardsDb = await findDatabaseByTitle("Design Moodboards");
        const tasksDb = await findDatabaseByTitle("Design Tasks");

        if (!clientsDb || !projectsDb || !moodboardsDb || !tasksDb) {
            throw new Error("Could not find one or more required databases.");
        }

        // Add a sample client
        const sampleClient = await notion.pages.create({
            parent: {
                database_id: clientsDb.id
            },
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: "Sample Client"
                            }
                        }
                    ]
                },
                Email: {
                    email: "sample.client@example.com"
                },
                Phone: {
                    phone_number: "+1 (555) 123-4567"
                },
                Status: {
                    select: {
                        name: "Active"
                    }
                },
                Notes: {
                    rich_text: [
                        {
                            text: {
                                content: "This is a sample client for demonstration purposes."
                            }
                        }
                    ]
                },
                LastContact: {
                    date: {
                        start: new Date().toISOString()
                    }
                }
            }
        });

        console.log("Created sample client");
        
        // Add a sample project
        const sampleProject = await notion.pages.create({
            parent: {
                database_id: projectsDb.id
            },
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: "Sample Home Renovation"
                            }
                        }
                    ]
                },
                Client: {
                    relation: [
                        {
                            id: sampleClient.id
                        }
                    ]
                },
                Status: {
                    select: {
                        name: "Planning"
                    }
                },
                StartDate: {
                    date: {
                        start: new Date().toISOString()
                    }
                },
                Budget: {
                    number: 25000
                },
                Description: {
                    rich_text: [
                        {
                            text: {
                                content: "Living room and kitchen renovation with modern styling."
                            }
                        }
                    ]
                },
                Location: {
                    rich_text: [
                        {
                            text: {
                                content: "123 Main Street, Anytown"
                            }
                        }
                    ]
                }
            }
        });

        console.log("Created sample project");

        // Add a sample moodboard
        await notion.pages.create({
            parent: {
                database_id: moodboardsDb.id
            },
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: "Modern Living Room Concept"
                            }
                        }
                    ]
                },
                Project: {
                    relation: [
                        {
                            id: sampleProject.id
                        }
                    ]
                },
                Style: {
                    select: {
                        name: "Modern"
                    }
                },
                ColorPalette: {
                    rich_text: [
                        {
                            text: {
                                content: "Gray, White, Teal accent"
                            }
                        }
                    ]
                },
                Materials: {
                    multi_select: [
                        { name: "Wood" },
                        { name: "Metal" },
                        { name: "Glass" }
                    ]
                },
                Notes: {
                    rich_text: [
                        {
                            text: {
                                content: "Clean lines, minimalist approach with natural wood accents."
                            }
                        }
                    ]
                }
            }
        });

        console.log("Created sample moodboard");

        // Add sample tasks
        const tasks = [
            {
                name: "Initial Client Consultation",
                status: "Done",
                dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                priority: "High"
            },
            {
                name: "Measure Space",
                status: "In Progress",
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                priority: "High"
            },
            {
                name: "Source Furniture Options",
                status: "To Do",
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                priority: "Medium"
            },
            {
                name: "Create 3D Renders",
                status: "To Do",
                dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
                priority: "Medium"
            }
        ];

        for (const task of tasks) {
            await notion.pages.create({
                parent: {
                    database_id: tasksDb.id
                },
                properties: {
                    Name: {
                        title: [
                            {
                                text: {
                                    content: task.name
                                }
                            }
                        ]
                    },
                    Project: {
                        relation: [
                            {
                                id: sampleProject.id
                            }
                        ]
                    },
                    Status: {
                        select: {
                            name: task.status
                        }
                    },
                    DueDate: {
                        date: {
                            start: task.dueDate
                        }
                    },
                    Priority: {
                        select: {
                            name: task.priority
                        }
                    }
                }
            });
        }

        console.log("Created sample tasks");
        console.log("Sample data creation complete.");
    } catch (error) {
        console.error("Error creating sample data:", error);
    }
}

// Export a function to run the setup
export async function initializeNotion() {
    try {
        await setupNotionDatabases();
        await createSampleData();
        return { success: true, message: "Notion integration setup complete!" };
    } catch (error) {
        console.error("Notion setup failed:", error);
        return { success: false, message: "Notion setup failed: " + error.message };
    }
}

// If this file is run directly
if (require.main === module) {
    initializeNotion().then(() => {
        console.log("Setup complete!");
        process.exit(0);
    }).catch(error => {
        console.error("Setup failed:", error);
        process.exit(1);
    });
}