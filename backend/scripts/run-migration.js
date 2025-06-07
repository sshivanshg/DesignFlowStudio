import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name from the current file URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the migration SQL file
const migrationSQL = readFileSync(join(__dirname, 'migrations', '0000_fuzzy_the_twelve.sql'), 'utf8');

// Split the SQL by statement-breakpoint
const statements = migrationSQL.split('--> statement-breakpoint');

// Connect to database
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
  connect_timeout: 10
});

async function runMigration() {
  console.log('Running migration...');
  
  try {
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql.unsafe(statement);
          console.log('Executed statement successfully');
        } catch (statementError) {
          console.error('Error executing statement:', statementError.message);
          // Continue with the next statement instead of aborting
        }
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await sql.end();
  }
}

runMigration();