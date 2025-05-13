const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Read the migration SQL file
const migrationSQL = fs.readFileSync(path.join(__dirname, 'migrations', '0000_fuzzy_the_twelve.sql'), 'utf8');

// Split the SQL by statement-breakpoint
const statements = migrationSQL.split('--> statement-breakpoint');

// Connect to database
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1
});

async function runMigration() {
  console.log('Running migration...');
  
  try {
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement);
        console.log('Executed statement successfully');
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