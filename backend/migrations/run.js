const fs = require('fs');
const path = require('path');
const { query } = require('../src/config/database');
const logger = require('../src/utils/logger');

const runMigrations = async () => {
  try {
    logger.info('Starting database migrations...');
    
    // Create migrations tracking table
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of migration files
    const migrationFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Get already executed migrations
    const executedResult = await query('SELECT filename FROM migrations');
    const executedFiles = new Set(executedResult.rows.map(row => row.filename));
    
    // Run pending migrations
    for (const file of migrationFiles) {
      if (executedFiles.has(file)) {
        logger.info(`Skipping already executed migration: ${file}`);
        continue;
      }
      
      logger.info(`Executing migration: ${file}`);
      const filePath = path.join(__dirname, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      await query(sql);
      await query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
      
      logger.info(`Migration completed: ${file}`);
    }
    
    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', { error: error.message });
    process.exit(1);
  }
};

runMigrations();
