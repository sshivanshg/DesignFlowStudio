import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function addSupabaseUidColumn() {
  try {
    console.log('Starting migration: Add supabase_uid column to users table');
    
    const queryClient = postgres(process.env.DATABASE_URL, {
      max: 10,
      ssl: 'require',
      connect_timeout: 10,
    });
    
    // Execute the raw SQL to add the column
    await queryClient.unsafe(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS supabase_uid TEXT UNIQUE;
    `);

    console.log('Migration complete: supabase_uid column added to users table');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addSupabaseUidColumn();