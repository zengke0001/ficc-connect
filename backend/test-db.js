const { query, initDatabase } = require('./src/config/database');

async function testConnection() {
  try {
    // Initialize database first
    await initDatabase();
    
    // Use SQLite datetime syntax
    const result = await query("SELECT datetime('now') as now");
    console.log('✅ Database connection successful!');
    console.log('Current time:', result.rows[0].now);
    
    // Test a query to verify tables exist
    const teamsResult = await query('SELECT COUNT(*) as count FROM teams');
    console.log('Teams count:', teamsResult.rows[0].count);
    
    const usersResult = await query('SELECT COUNT(*) as count FROM users');
    console.log('Users count:', usersResult.rows[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
