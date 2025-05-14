// Script to add missing columns to the database tables
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function addMissingColumns() {
  try {
    const sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require',
      max: 1, // Use only one connection
      idle_timeout: 20,
      connect_timeout: 10,
    });

    console.log("Checking database tables for missing columns...");

    // Check for lead_id column in proposals table
    const proposalsColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'proposals' AND column_name = 'lead_id'
    `;

    if (proposalsColumns.length === 0) {
      console.log("Adding lead_id column to proposals table...");
      await sql`
        ALTER TABLE proposals 
        ADD COLUMN lead_id INTEGER REFERENCES leads(id)
      `;
      console.log("✅ Added lead_id column to proposals table");
    } else {
      console.log("lead_id column already exists in proposals table");
    }

    // Check for lead_id column in estimates table
    const estimatesColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'estimates' AND column_name = 'lead_id'
    `;

    if (estimatesColumns.length === 0) {
      console.log("Adding lead_id column to estimates table...");
      await sql`
        ALTER TABLE estimates 
        ADD COLUMN lead_id INTEGER REFERENCES leads(id)
      `;
      console.log("✅ Added lead_id column to estimates table");
    } else {
      console.log("lead_id column already exists in estimates table");
    }

    // Check for follow_up_date column in leads table
    const leadsColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name = 'follow_up_date'
    `;

    if (leadsColumns.length === 0) {
      console.log("Adding follow_up_date column to leads table...");
      await sql`
        ALTER TABLE leads 
        ADD COLUMN follow_up_date TIMESTAMP
      `;
      console.log("✅ Added follow_up_date column to leads table");
    } else {
      console.log("follow_up_date column already exists in leads table");
    }

    // Check for supabase_uid column in users table
    const usersColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'supabase_uid'
    `;

    if (usersColumns.length === 0) {
      console.log("Adding supabase_uid column to users table...");
      await sql`
        ALTER TABLE users 
        ADD COLUMN supabase_uid TEXT UNIQUE
      `;
      console.log("✅ Added supabase_uid column to users table");
    } else {
      console.log("supabase_uid column already exists in users table");
    }

    console.log("Database schema update complete!");
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error("Error updating database schema:", error);
    process.exit(1);
  }
}

addMissingColumns();