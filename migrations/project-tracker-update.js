// Simple script to update the projects table for project tracker functionality
import postgres from "postgres";

// Create database connection
const sql = postgres(process.env.DATABASE_URL);

async function updateProjectsTable() {
  console.log("Starting to update projects table for tracker functionality...");

  try {
    // Add rooms column
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS "rooms" jsonb DEFAULT '[]'::jsonb`;
    console.log("Added rooms column to projects table");

    // Add last_report_date column
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS "last_report_date" timestamp`;
    console.log("Added last_report_date column to projects table");

    // Add report_settings column
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS "report_settings" jsonb DEFAULT '{}'::jsonb`;
    console.log("Added report_settings column to projects table");

    // Ensure tasks column exists
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS "tasks" jsonb DEFAULT '[]'::jsonb`;
    console.log("Ensured tasks column exists in projects table");

    // Ensure logs column exists
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS "logs" jsonb DEFAULT '[]'::jsonb`;
    console.log("Ensured logs column exists in projects table");

    // Ensure photos column exists
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS "photos" jsonb DEFAULT '[]'::jsonb`;
    console.log("Ensured photos column exists in projects table");

    console.log("Projects table updated successfully!");
  } catch (error) {
    console.error("Error updating projects table:", error);
    return false;
  } finally {
    // Close the database connection
    await sql.end();
  }

  return true;
}

// Execute the update function
updateProjectsTable()
  .then(success => {
    if (success) {
      console.log("Migration completed successfully");
      process.exit(0);
    } else {
      console.error("Migration failed");
      process.exit(1);
    }
  })
  .catch(error => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });