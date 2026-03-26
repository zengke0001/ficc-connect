const initSqlJs = require('sql.js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Load environment variables
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/ficc_connect.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

/**
 * Initialize SQLite database with sql.js
 */
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Try to load existing database
  try {
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      logger.info('Loaded existing database from', dbPath);
    } else {
      db = new SQL.Database();
      logger.info('Created new in-memory database');
    }
  } catch (error) {
    logger.error('Failed to load database, creating new one', error.message);
    db = new SQL.Database();
  }
  
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');
  
  return db;
}

/**
 * Save database to disk
 */
function saveDatabase() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
      logger.debug('Database saved to', dbPath);
    } catch (error) {
      logger.error('Failed to save database', error.message);
    }
  }
}

/**
 * Convert PostgreSQL-style $1, $2 parameterized queries to SQLite ? placeholders.
 * Also handles queries that already use SQLite-style ? placeholders.
 */
function convertQuery(text, params) {
  // Check if query uses PostgreSQL-style numbered parameters
  const hasNumberedParams = /\$\d+/.test(text);
  
  if (!hasNumberedParams) {
    // Query already uses ? placeholders (SQLite style) - return params as-is
    // Convert booleans to integers and ensure undefined becomes null for SQLite compatibility
    const sqliteParams = (params || []).map(p => {
      if (p === undefined) return null;
      if (typeof p === 'boolean') return p ? 1 : 0;
      return p;
    });
    return { sql: text, params: sqliteParams };
  }
  
  // Convert PostgreSQL-style $1, $2 to SQLite ? placeholders
  const paramMap = [];
  const converted = text.replace(/\$(\d+)/g, (match, num) => {
    paramMap.push(parseInt(num) - 1);
    return '?';
  });

  const reorderedParams = paramMap.map(i => {
    if (i >= (params || []).length) return null;
    const val = params ? params[i] : undefined;
    if (val === undefined) return null;
    if (typeof val === 'boolean') return val ? 1 : 0;
    return val;
  });

  return { sql: converted, params: reorderedParams };
}

/**
 * Provide a pg-compatible query interface
 */
const query = async (text, params = []) => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  const start = Date.now();
  try {
    const { sql, params: sqliteParams } = convertQuery(text, params);
    const trimmed = sql.trim().toUpperCase();

    let result;
    if (trimmed.startsWith('SELECT') || trimmed.includes('RETURNING')) {
      const stmt = db.prepare(sql);
      if (sqliteParams.length > 0) {
        stmt.bind(sqliteParams);
      }
      
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      
      result = { rows, rowCount: rows.length };
    } else {
      db.run(sql, sqliteParams);
      result = { rows: [], rowCount: db.getRowsModified() };
      
      // Save after write operations
      saveDatabase();
    }

    const duration = Date.now() - start;
    logger.debug('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Query error', { 
      text: text.substring(0, 100), 
      params: params,
      error: error.message || String(error),
      errorCode: error.code,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * For transaction support
 */
const getClient = async () => {
  // Track transaction state at the closure level (persists across queries in same transaction)
  let inTransaction = false;
  let saveOnCommit = false;

  return {
    query: async (text, params = []) => {
      if (!db) {
        throw new Error('Database not initialized');
      }
      
      const { sql, params: sqliteParams } = convertQuery(text, params);
      const trimmedUpper = sql.trim().toUpperCase();

      // Handle transaction control statements
      if (trimmedUpper === 'BEGIN' || trimmedUpper === 'BEGIN TRANSACTION') {
        if (!inTransaction) {
          db.run('BEGIN TRANSACTION');
          inTransaction = true;
          saveOnCommit = true;
        }
        return { rows: [], rowCount: 0 };
      }
      if (trimmedUpper === 'COMMIT') {
        if (inTransaction) {
          db.run('COMMIT');
          inTransaction = false;
          // Save database after commit
          saveDatabase();
          saveOnCommit = false;
        }
        return { rows: [], rowCount: 0 };
      }
      if (trimmedUpper === 'ROLLBACK') {
        if (inTransaction) {
          db.run('ROLLBACK');
          inTransaction = false;
          saveOnCommit = false;
        }
        return { rows: [], rowCount: 0 };
      }

      // For regular queries inside transaction, don't auto-save
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT') || trimmed.includes('RETURNING')) {
        const stmt = db.prepare(sql);
        if (sqliteParams.length > 0) {
          stmt.bind(sqliteParams);
        }
        
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        
        return { rows, rowCount: rows.length };
      } else {
        db.run(sql, sqliteParams);
        // Only auto-save if not in a transaction (individual writes)
        if (!inTransaction) {
          saveDatabase();
        }
        return { rows: [], rowCount: db.getRowsModified() };
      }
    },
    release: () => {
      // Ensure any uncommitted transaction is rolled back
      if (inTransaction) {
        try { 
          db.run('ROLLBACK');
          inTransaction = false;
        } catch (e) { /* ignore */ }
      }
    }
  };
};

module.exports = {
  query,
  getClient,
  initDatabase,
  saveDatabase,
  getDb: () => db
};
