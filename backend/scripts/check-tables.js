import postgres from 'postgres';

// Connect to database
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
  connect_timeout: 10
});

async function checkTables() {
  console.log('Checking database tables...');
  
  try {
    // Query to get all table names
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('Found tables:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Check if the users table exists
    const usersExists = tables.some(table => table.table_name === 'users');
    if (usersExists) {
      // Count users
      const userCount = await sql`SELECT COUNT(*) FROM users`;
      console.log(`User count: ${userCount[0].count}`);
    } else {
      console.log('Users table does not exist!');
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await sql.end();
  }
}

checkTables();