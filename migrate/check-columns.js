// Script to check columns in proposals table
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkColumns() {
  try {
    const sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require',
    });

    console.log("Checking columns in proposals table...");

    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'proposals'
      ORDER BY ordinal_position
    `;

    if (columns.length === 0) {
      console.log("The proposals table doesn't exist in the database.");
    } else {
      console.log("Found columns in proposals table:");
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
    }

    await sql.end();
    console.log("Check completed");
  } catch (error) {
    console.error("Error checking columns:", error);
  }
}

checkColumns();
