require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/utils/logger');
const { pool } = require('./src/config/database');
const fs = require('fs');

// Ensure log directory exists
if (!fs.existsSync('logs')) fs.mkdirSync('logs');

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    logger.info('Database connection established');

    app.listen(PORT, () => {
      logger.info(`FICC Connect backend running on port ${PORT}`, {
        env: process.env.NODE_ENV,
        port: PORT
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});
