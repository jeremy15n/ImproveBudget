import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/budget.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;
let SQL = null;

// Initialize sql.js
const initSQL = async () => {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
};

// Load or create database from file
const loadDatabase = async () => {
  const SQL = await initSQL();
  let sqlDb;

  if (fs.existsSync(DB_PATH)) {
    try {
      const buffer = fs.readFileSync(DB_PATH);
      sqlDb = new SQL.Database(new Uint8Array(buffer));
      console.log('✓ Database loaded from disk');
    } catch (error) {
      console.warn('Failed to load database from disk, creating new:', error.message);
      sqlDb = new SQL.Database();
    }
  } else {
    sqlDb = new SQL.Database();
    console.log('✓ New database created');
  }

  return sqlDb;
};

// Save database to disk
const saveToDisk = (sqlDb) => {
  try {
    if (sqlDb) {
      const data = sqlDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    }
  } catch (error) {
    console.error('Warning: Failed to save database to disk:', error.message);
  }
};

// Wrapper class to mimic better-sqlite3 API
class DatabaseWrapper {
  constructor(sqlDb) {
    this.sqlDb = sqlDb;
  }

  prepare(sql) {
    const self = this;
    const stmt = self.sqlDb.prepare(sql);

    return {
      run(...params) {
        try {
          stmt.bind(params);
          stmt.step();
          const lastId = self.sqlDb.exec('SELECT last_insert_rowid() as id');
          stmt.free();

          // Save after write operations
          if (sql.trim().toUpperCase().startsWith('INSERT') ||
              sql.trim().toUpperCase().startsWith('UPDATE') ||
              sql.trim().toUpperCase().startsWith('DELETE')) {
            saveToDisk(self.sqlDb);
          }

          return {
            changes: 1,
            lastInsertRowid: lastId[0]?.values[0]?.[0] || 0
          };
        } catch (error) {
          stmt.free();
          throw error;
        }
      },

      all(...params) {
        try {
          stmt.bind(params);
          const result = [];
          while (stmt.step()) {
            result.push(stmt.getAsObject());
          }
          stmt.free();
          return result;
        } catch (error) {
          stmt.free();
          throw error;
        }
      },

      get(...params) {
        try {
          stmt.bind(params);
          const row = stmt.step() ? stmt.getAsObject() : undefined;
          stmt.free();
          return row;
        } catch (error) {
          stmt.free();
          return undefined;
        }
      }
    };
  }

  pragma(pragma) {
    try {
      this.sqlDb.run(`PRAGMA ${pragma}`);
    } catch (error) {
      console.warn(`Pragma ${pragma} not fully supported in sql.js`);
    }
  }

  transaction(fn) {
    const self = this;
    return () => {
      try {
        self.sqlDb.run('BEGIN TRANSACTION');
        fn();
        self.sqlDb.run('COMMIT');
        saveToDisk(self.sqlDb);
      } catch (error) {
        try {
          self.sqlDb.run('ROLLBACK');
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
        throw error;
      }
    };
  }

  exec(sql) {
    try {
      return this.sqlDb.exec(sql);
    } catch (error) {
      console.error('Exec error:', error);
      return [];
    }
  }
}

// Initialize database once
const initializeDatabase = async () => {
  try {
    // Load database
    const sqlDb = await loadDatabase();
    db = new DatabaseWrapper(sqlDb);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Check if schema_version table exists
    const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'");

    if (!result || result.length === 0 || (result[0] && result[0].values.length === 0)) {
      // Database is new, run schema
      const schemaPath = path.join(__dirname, '../db/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      // Execute schema statements
      const statements = schema.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            db.sqlDb.run(statement);
          } catch (error) {
            console.warn(`Skipping statement:${statement.slice(0, 50)}...`);
          }
        }
      }

      saveToDisk(db.sqlDb);
      console.log('✓ Database schema initialized');
    } else {
      console.log('✓ Database ready');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    throw error;
  }
};

// Export database once initialized
export { db, DB_PATH, initializeDatabase };
