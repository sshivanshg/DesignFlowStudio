// This file will update the moodboards table to match our schema

import { sql } from "drizzle-orm";
import { db } from "./server/db.js";

async function updateMoodboardsTable() {
  console.log("Starting migration to update moodboards table...");

  try {
    // Add name column
    console.log("Adding name column...");
    await db.execute(sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "name" text DEFAULT 'Untitled Moodboard'`);

    // Add description column
    console.log("Adding description column...");
    await db.execute(sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "description" text`);

    // Add sections column with default empty JSON
    console.log("Adding sections column...");
    await db.execute(sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "sections" jsonb DEFAULT '{}'::jsonb`);

    // Add pdf_url column
    console.log("Adding pdf_url column...");
    await db.execute(sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "pdf_url" text`);

    // Add is_template column with default false
    console.log("Adding is_template column...");
    await db.execute(sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "is_template" boolean DEFAULT false`);

    console.log("Moodboards table update completed successfully!");
  } catch (error) {
    console.error("Error updating moodboards table:", error);
    return false;
  }

  return true;
}

// Execute the update function
updateMoodboardsTable()
  .then(success => {
    if (success) {
      console.log("Database migration completed successfully");
      process.exit(0);
    } else {
      console.error("Database migration failed");
      process.exit(1);
    }
  })
  .catch(error => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });