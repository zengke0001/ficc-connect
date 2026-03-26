const fs = require('fs');
const path = require('path');
const { initDatabase, getDb, saveDatabase } = require('../src/config/database');
const logger = require('../src/utils/logger');

const runMigrations = async () => {
  try {
    logger.info('Starting database migrations...');
    
    // Initialize database
    await initDatabase();
    const db = getDb();
    
    if (!db) {
      throw new Error('Failed to initialize database');
    }
    
    // Get list of migration files (only .sql, exclude this runner)
    const migrationFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Create migrations tracking table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get already executed migrations
    const stmt = db.prepare('SELECT filename FROM migrations ORDER BY id');
    const executedRows = [];
    while (stmt.step()) {
      executedRows.push(stmt.getAsObject());
    }
    stmt.free();
    
    const executedFiles = new Set(executedRows.map(row => row.filename));
    
    // Run pending migrations
    for (const file of migrationFiles) {
      if (executedFiles.has(file)) {
        logger.info(`Skipping already executed migration: ${file}`);
        continue;
      }
      
      logger.info(`Executing migration: ${file}`);
      const filePath = path.join(__dirname, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the migration SQL
      db.run(sql);
      
      // Record the migration
      db.run('INSERT INTO migrations (filename) VALUES (?)', [file]);
      
      logger.info(`Migration completed: ${file}`);
    }
    
    // Save database
    saveDatabase();
    
    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', { error: error.message });
    process.exit(1);
  }
};

runMigrations();
