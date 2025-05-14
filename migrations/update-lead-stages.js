import postgres from "postgres";

// Create postgres client directly
const dbClient = postgres(process.env.DATABASE_URL);

/**
 * Migration to update the lead stages to match the new schema
 * This will convert old lead stages to the new format
 */
async function updateLeadStages() {
  console.log("Starting lead stages migration...");

  try {
    // Verify the leads table exists
    const tableExists = await dbClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'leads'
      );
    `;

    if (!tableExists[0].exists) {
      console.log("Leads table doesn't exist yet, skipping migration");
      return;
    }

    // Get current stages
    const currentStages = await dbClient`
      SELECT DISTINCT stage FROM leads WHERE stage IS NOT NULL;
    `;
    
    console.log("Current stages in the database:", currentStages.map(row => row.stage));

    // Update any old stage values to match the new format
    await dbClient`
      UPDATE leads 
      SET stage = 'new' 
      WHERE stage IN ('new_lead', 'new');
    `;

    await dbClient`
      UPDATE leads 
      SET stage = 'in_discussion' 
      WHERE stage IN ('contacted', 'qualified', 'proposal');
    `;

    await dbClient`
      UPDATE leads 
      SET stage = 'won' 
      WHERE stage = 'won';
    `;

    await dbClient`
      UPDATE leads 
      SET stage = 'lost' 
      WHERE stage = 'lost';
    `;

    // Set any NULL or other values to 'new'
    await dbClient`
      UPDATE leads 
      SET stage = 'new' 
      WHERE stage IS NULL OR stage NOT IN ('new', 'in_discussion', 'won', 'lost');
    `;

    console.log("Lead stages migration completed successfully");
  } catch (error) {
    console.error("Error during lead stages migration:", error);
  }
}

updateLeadStages()
  .then(() => {
    console.log("Migration complete!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Migration failed:", error);
    process.exit(1);
  });