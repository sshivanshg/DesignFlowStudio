import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function fixDatabase() {
  console.log('Starting database fix script...');

  try {
    const { Pool } = pg;
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    console.log('Connected to database');

    // Add shared_link column to proposals table
    try {
      console.log('Adding shared_link column to proposals table...');
      await pool.query(`
        ALTER TABLE proposals 
        ADD COLUMN IF NOT EXISTS shared_link text;
      `);
      console.log('Successfully added shared_link column');
    } catch (error) {
      console.error('Error adding shared_link column:', error);
    }

    // End the pool
    await pool.end();
    console.log('Database fix completed');
    process.exit(0);
  } catch (error) {
    console.error('Error in database fix script:', error);
    process.exit(1);
  }
}

fixDatabase().catch(console.error);