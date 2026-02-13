import Database from 'better-sqlite3';
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

// Create or open database
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema if database is new
const initializeDatabase = () => {
  try {
    // Check if schema_version table exists
    const result = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'"
    ).all();

    if (result.length === 0) {
      // Database is new, run schema
      const schemaPath = path.join(__dirname, '../db/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      // Execute schema - better-sqlite3 doesn't have exec, so we need to split and run statements
      const statements = schema.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          db.prepare(statement).run();
        }
      }

      console.log('✓ Database schema initialized');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    throw error;
  }
};

export { db, DB_PATH, initializeDatabase };
