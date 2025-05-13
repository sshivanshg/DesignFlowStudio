const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const { sql } = require("drizzle-orm");
require('dotenv').config();

const main = async () => {
  // Initialize the database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool);

  console.log("Starting migration to update the moodboards table...");

  // Add missing columns to the moodboards table
  try {
    // Add name column with a default value
    await db.execute(sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "name" text DEFAULT 'Untitled Moodboard'`);
    console.log("Added name column to moodboards table");

    // Add description column
    await db.execute(sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "description" text`);
    console.log("Added description column to moodboards table");

    // Add sections column with a default empty JSON object
    await db.execute(sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "sections" jsonb DEFAULT '{}'::jsonb`);
    console.log("Added sections column to moodboards table");

    // Add pdf_url column (pdfURL in the schema)
    await db.execute(sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "pdf_url" text`);
    console.log("Added pdf_url column to moodboards table");

    // Add is_template column with a default of false
    await db.execute(sql`ALTER TABLE moodboards ADD COLUMN IF NOT EXISTS "is_template" boolean DEFAULT false`);
    console.log("Added is_template column to moodboards table");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }

  await pool.end();
  process.exit(0);
};

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});