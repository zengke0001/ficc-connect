const { Client } = require('pg');

async function createDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres', // Try default password
    database: 'postgres'  // Connect to default db first
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Create database
    await client.query('CREATE DATABASE ficc_connect');
    console.log('Database "ficc_connect" created successfully');

    await client.end();
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('Database already exists');
    } else {
      console.error('Error creating database:', err.message);
      console.log('Please manually create the database:');
      console.log('1. Open pgAdmin or psql');
      console.log('2. Run: CREATE DATABASE ficc_connect;');
      process.exit(1);
    }
  }
}

createDatabase();
