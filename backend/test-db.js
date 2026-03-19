const { query } = require('./src/config/database');

async function testConnection() {
  try {
    const result = await query('SELECT NOW() as now');
    console.log('✅ Database connection successful!');
    console.log('Current time:', result.rows[0].now);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
