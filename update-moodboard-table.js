// Simple script to update the moodboards table
import postgres from "postgres";

// Create database connection
const sql = postgres(process.env.DATABASE_URL);

async function updateMoodboardsTable() {
  console.log("Starting to update moodboards table...");

  try {
    // Add name column with a default value
    await sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "name" text DEFAULT 'Untitled Moodboard'`;
    console.log("Added name column to moodboards table");

    // Add description column
    await sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "description" text`;
    console.log("Added description column to moodboards table");

    // Add sections column with a default empty JSON object
    await sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "sections" jsonb DEFAULT '{}'::jsonb`;
    console.log("Added sections column to moodboards table");

    // Add pdf_url column (pdfURL in the schema)
    await sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "pdf_url" text`;
    console.log("Added pdf_url column to moodboards table");

    // Add is_template column with a default of false
    await sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "is_template" boolean DEFAULT false`;
    console.log("Added is_template column to moodboards table");

    console.log("Moodboards table updated successfully!");
  } catch (error) {
    console.error("Error updating moodboards table:", error);
    return false;
  } finally {
    // Close the database connection
    await sql.end();
  }

  return true;
}

// Execute the update function
updateMoodboardsTable()
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