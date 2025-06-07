// Fix missing columns in the database

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { leads, estimates } from './shared/schema.js';

async function fixDatabaseColumns() {
  try {
    console.log("Starting database column fix...");

    // Connect to the database
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL not found");
    }
    
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    console.log("Connected to database");
    
    // Check if follow_up_date exists in leads table
    try {
      console.log("Checking for follow_up_date column in leads table...");
      await client`SELECT follow_up_date FROM leads LIMIT 1`;
      console.log("follow_up_date column exists in leads table");
    } catch (error) {
      if (error.message.includes("column \"follow_up_date\" does not exist")) {
        console.log("Adding follow_up_date column to leads table...");
        await client`ALTER TABLE leads ADD COLUMN follow_up_date TIMESTAMP`;
        console.log("Added follow_up_date column to leads table");
      } else {
        console.error("Error checking follow_up_date column:", error);
      }
    }
    
    // Check if lead_id exists in estimates table
    try {
      console.log("Checking for lead_id column in estimates table...");
      await client`SELECT lead_id FROM estimates LIMIT 1`;
      console.log("lead_id column exists in estimates table");
    } catch (error) {
      if (error.message.includes("column \"lead_id\" does not exist")) {
        console.log("Adding lead_id column to estimates table...");
        await client`ALTER TABLE estimates ADD COLUMN lead_id INTEGER REFERENCES leads(id)`;
        console.log("Added lead_id column to estimates table");
      } else {
        console.error("Error checking lead_id column:", error);
      }
    }
    
    console.log("Database column fixes completed");
  } catch (error) {
    console.error("Error fixing database columns:", error);
  } finally {
    process.exit(0);
  }
}

// Run the function
fixDatabaseColumns();