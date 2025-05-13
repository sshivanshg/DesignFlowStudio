// ES Modules syntax
import pg from 'pg';

async function fixDatabase() {
  console.log('Starting database fix script...');
  
  try {
    // Use postgres client directly for targeted fixes to avoid Drizzle compatibility issues
    const { Pool } = pg;
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    console.log('Connected to database');
    
    // 1. Fix leads table - add follow_up_date if missing
    try {
      console.log('Checking for follow_up_date column in leads table...');
      
      // First check if column exists
      pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'follow_up_date'
      `, (err, checkResult) => {
        if (err) {
          console.error('Error checking follow_up_date column:', err);
          return;
        }
        
        if (checkResult.rows.length === 0) {
          console.log('follow_up_date column missing, adding it now...');
          pool.query(`
            ALTER TABLE leads 
            ADD COLUMN follow_up_date TIMESTAMP
          `, (err) => {
            if (err) {
              console.error('Error adding follow_up_date column:', err);
            } else {
              console.log('Successfully added follow_up_date column to leads table');
            }
          });
        } else {
          console.log('follow_up_date column already exists in leads table');
        }
      });
    } catch (error) {
      console.error('Error fixing leads table:', error);
    }
    
    // 2. Check the update method in SQL that may be causing the "syntax error at or near where" error
    try {
      console.log('Testing update operation in users table...');
      
      // Using parameterized queries to update a test row
      const updateSql = `
        UPDATE users 
        SET role = $1
        WHERE id = $2
        RETURNING *
      `;
      pool.query(updateSql, ['admin', 1], (err, result) => {
        if (err) {
          console.error('Error testing update operation:', err);
        } else {
          console.log('Update test successful');
        }
        
        console.log('Database fix script completed');
        pool.end();
      });
    } catch (error) {
      console.error('Error testing update operation:', error);
      pool.end();
    }
  } catch (error) {
    console.error('Error in database fix script:', error);
    process.exit(1);
  }
}

fixDatabase().catch(console.error);