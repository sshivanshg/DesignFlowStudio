// Script to check the schema of the proposals table
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkProposalsSchema() {
  const client = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  
  try {
    console.log('Checking proposals table schema...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'proposals'
      ORDER BY ordinal_position;
    `);
    
    console.log('Proposals table columns:');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await client.end();
  }
}

checkProposalsSchema();