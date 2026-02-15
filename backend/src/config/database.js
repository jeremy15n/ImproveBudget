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
    this.inTransaction = false;
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

          // Save after write operations (but not during a transaction)
          if (!self.inTransaction &&
              (sql.trim().toUpperCase().startsWith('INSERT') ||
               sql.trim().toUpperCase().startsWith('UPDATE') ||
               sql.trim().toUpperCase().startsWith('DELETE'))) {
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
      this.sqlDb.exec(`PRAGMA ${pragma}`);
    } catch (error) {
      console.warn(`Pragma ${pragma} not fully supported in sql.js`);
    }
  }

  transaction(fn) {
    const self = this;
    return () => {
      try {
        self.inTransaction = true;
        self.sqlDb.exec('BEGIN TRANSACTION');
        fn();
        self.sqlDb.exec('COMMIT');
        self.inTransaction = false;
        saveToDisk(self.sqlDb);
      } catch (error) {
        self.inTransaction = false;
        try {
          self.sqlDb.exec('ROLLBACK');
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
            db.sqlDb.exec(statement);
          } catch (error) {
            console.error(`Error executing statement: ${error.message}`);
            console.error(`Statement: ${statement.slice(0, 100)}...`);
            // Don't throw - some statements like CREATE INDEX IF NOT EXISTS may fail safely
          }
        }
      }

      saveToDisk(db.sqlDb);
      console.log('✓ Database schema initialized');
    } else {
      console.log('✓ Database ready');
    }

    // Ensure categories table exists and is seeded (migration for existing DBs)
    ensureCategoriesTable(db);

    // Remove UNIQUE constraint from import_hash (migration for existing DBs)
    removeImportHashUniqueConstraint(db);

    // Add deleted_at columns for soft-delete (migration for existing DBs)
    addSoftDeleteColumns(db);

    // Make institution column nullable (migration for existing DBs)
    makeInstitutionNullable(db);

  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    throw error;
  }
};

// Default categories with colors
const DEFAULT_CATEGORIES = [
  // Expenses
  { name: 'mortgage', label: 'Mortgage', color: '#6366f1' },
  { name: 'gas', label: 'Gas', color: '#8b5cf6' },
  { name: 'car_payment', label: 'Car Payment', color: '#a855f7' },
  { name: 'phone_payment', label: 'Phone Payment', color: '#d946ef' },
  { name: 'phone_bill', label: 'Phone Bill', color: '#ec4899' },
  { name: 'car_insurance', label: 'Car Insurance', color: '#f43f5e' },
  { name: 'home_maintenance', label: 'Home Maintenance', color: '#ef4444' },
  { name: 'car_maintenance', label: 'Car Maintenance', color: '#dc2626' },
  { name: 'clothes', label: 'Clothes', color: '#f97316' },
  { name: 'haircut', label: 'Haircut', color: '#f59e0b' },
  { name: 'eating_out', label: 'Eating Out', color: '#eab308' },
  { name: 'groceries', label: 'Groceries', color: '#84cc16' },
  { name: 'subscriptions', label: 'Subscriptions', color: '#14b8a6' },
  { name: 'pay_back_taxes', label: 'Pay Back Taxes', color: '#06b6d4' },
  { name: 'entertainment', label: 'Entertainment', color: '#0ea5e9' },
  { name: 'wants', label: 'Wants', color: '#3b82f6' },
  { name: 'medical', label: 'Medical', color: '#10b981' },
  { name: 'emergency', label: 'Emergency', color: '#ef4444' },
  { name: 'hygiene', label: 'Hygiene', color: '#d946ef' },
  { name: 'life_insurance', label: 'Life Insurance', color: '#14b8a6' },
  { name: 'water_bill', label: 'Water Bill', color: '#0ea5e9' },
  { name: 'electric_bill', label: 'Electric Bill', color: '#f59e0b' },
  { name: 'internet_bill', label: 'Internet Bill', color: '#8b5cf6' },
  { name: 'trash_bill', label: 'Trash Bill', color: '#64748b' },
  { name: 'miscellaneous_expenses', label: 'Miscellaneous Expenses', color: '#94a3b8' },
  { name: 'amex_gold_fee', label: 'AMEX Gold Fee', color: '#f59e0b' },
  { name: 'car_registration', label: 'Car Registration', color: '#6366f1' },
  // Income
  { name: 'w2_job', label: 'W-2 Job', color: '#22c55e' },
  { name: 'va_benefits', label: 'VA Benefits', color: '#16a34a' },
  { name: 'tax_refund', label: 'Tax Refund', color: '#059669' },
  { name: 'side_job', label: 'Side Job', color: '#047857' },
  { name: 'other_income', label: 'Other', color: '#10b981' },
  { name: 'mgib', label: 'MGIB', color: '#34d399' },
  // Savings
  { name: 'hysa', label: 'HYSA', color: '#6366f1' },
  { name: 'individual_account', label: 'Individual Account', color: '#818cf8' },
  { name: 'traditional_ira', label: 'Traditional IRA', color: '#a78bfa' },
  { name: 'roth_ira', label: 'Roth IRA', color: '#c084fc' },
  { name: 'hsa', label: 'HSA', color: '#e879f9' },
  { name: 'mortgage_principal_payment', label: 'Mortgage Principal Payment', color: '#8b5cf6' },
  // System
  { name: 'uncategorized', label: 'Uncategorized', color: '#cbd5e1' },
];

function ensureCategoriesTable(db) {
  try {
    // Create table if it doesn't exist
    db.sqlDb.exec(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      color TEXT DEFAULT '#cbd5e1',
      is_default INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
    db.sqlDb.exec('CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)');
    db.sqlDb.exec('CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order)');

    // Clear old defaults and reseed with current defaults
    db.sqlDb.exec('DELETE FROM categories WHERE is_default = 1');
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const c = DEFAULT_CATEGORIES[i];
      try {
        db.sqlDb.exec(`INSERT INTO categories (name, label, color, is_default, sort_order) VALUES ('${c.name}', '${c.label}', '${c.color}', 1, ${i})`);
      } catch (e) {
        // Skip if name already exists (user may have customized it)
      }
    }
    saveToDisk(db.sqlDb);
    console.log('✓ Categories synced');
  } catch (error) {
    console.error('Error ensuring categories table:', error.message);
  }
}

function removeImportHashUniqueConstraint(db) {
  try {
    // Get table info to check if UNIQUE constraint exists
    const tableInfo = db.sqlDb.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions'");
    if (!tableInfo || !tableInfo[0] || !tableInfo[0].values || !tableInfo[0].values[0]) {
      return;
    }

    const createTableSQL = tableInfo[0].values[0][0];
    if (!createTableSQL.includes('import_hash TEXT UNIQUE')) {
      console.log('✓ import_hash UNIQUE constraint already removed');
      return;
    }

    console.log('Migrating transactions table to remove import_hash UNIQUE constraint...');

    // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
    // 1. Rename old table
    db.sqlDb.exec('ALTER TABLE transactions RENAME TO transactions_old');

    // 2. Create new table without UNIQUE constraint
    db.sqlDb.exec(`CREATE TABLE transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      merchant_raw TEXT,
      merchant_clean TEXT,
      amount REAL NOT NULL,
      category TEXT DEFAULT 'uncategorized',
      subcategory TEXT,
      account_id INTEGER,
      account_name TEXT,
      type TEXT DEFAULT 'expense',
      is_recurring INTEGER DEFAULT 0,
      is_duplicate INTEGER DEFAULT 0,
      is_transfer INTEGER DEFAULT 0,
      transfer_pair_id INTEGER,
      is_reviewed INTEGER DEFAULT 0,
      is_flagged INTEGER DEFAULT 0,
      flag_reason TEXT,
      notes TEXT,
      tags TEXT,
      import_hash TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
    )`);

    // 3. Copy data from old table
    db.sqlDb.exec(`INSERT INTO transactions SELECT * FROM transactions_old`);

    // 4. Recreate indexes
    db.sqlDb.exec('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC)');
    db.sqlDb.exec('CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id)');
    db.sqlDb.exec('CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)');
    db.sqlDb.exec('CREATE INDEX IF NOT EXISTS idx_transactions_import_hash ON transactions(import_hash)');
    db.sqlDb.exec('CREATE INDEX IF NOT EXISTS idx_transactions_is_reviewed ON transactions(is_reviewed)');

    // 5. Drop old table
    db.sqlDb.exec('DROP TABLE transactions_old');

    saveToDisk(db.sqlDb);
    console.log('✓ import_hash UNIQUE constraint removed');
  } catch (error) {
    console.error('Error removing import_hash UNIQUE constraint:', error.message);
  }
}

/**
 * Add deleted_at columns for soft-delete functionality
 */
function addSoftDeleteColumns(db) {
  try {
    // FIX: Added 'networthsnapshots' to this list so the column gets added
    const tables = [
      'transactions', 'accounts', 'budgets', 'investments',
      'financialgoals', 'categoryrules', 'categories',
      'networthsnapshots'
    ];

    for (const table of tables) {
      // Check if column already exists
      const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all();
      const hasDeletedAt = tableInfo.some(col => col.name === 'deleted_at');

      if (!hasDeletedAt) {
        // If table doesn't exist yet, this might fail, so we catch it
        try {
            db.sqlDb.exec(`ALTER TABLE ${table} ADD COLUMN deleted_at TEXT DEFAULT NULL`);
            db.sqlDb.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_deleted_at ON ${table}(deleted_at)`);
            console.log(`  ✓ Added deleted_at to ${table}`);
        } catch (e) {
            // Table might not exist yet if schema hasn't run, that's fine
        }
      }
    }

    saveToDisk(db.sqlDb);
    console.log('✓ Soft-delete columns checked');
  } catch (error) {
    console.error('Error adding soft-delete columns:', error.message);
  }
}

/**
 * Make institution column nullable in accounts table
 * (Institution field was removed from UI, should be optional)
 */
function makeInstitutionNullable(db) {
  try {
    // Check if institution column is NOT NULL
    const tableInfo = db.sqlDb.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='accounts'");
    if (!tableInfo || !tableInfo[0] || !tableInfo[0].values || !tableInfo[0].values[0]) {
      return;
    }

    const createTableSQL = tableInfo[0].values[0][0];
    if (!createTableSQL.includes('institution TEXT NOT NULL')) {
      console.log('✓ institution column already nullable');
      return;
    }

    console.log('Migrating accounts table to make institution nullable...');

    // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
    // 1. Rename old table
    db.sqlDb.exec('ALTER TABLE accounts RENAME TO accounts_old');

    // 2. Create new table with institution as nullable
    db.sqlDb.exec(`CREATE TABLE accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      institution TEXT,
      account_type TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      is_asset INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      last_synced TEXT,
      account_number_last4 TEXT,
      color TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`);

    // 3. Copy data from old table
    db.sqlDb.exec(`INSERT INTO accounts SELECT * FROM accounts_old`);

    // 4. Recreate indexes
    db.sqlDb.exec('CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active)');
    db.sqlDb.exec('CREATE INDEX IF NOT EXISTS idx_accounts_institution ON accounts(institution)');

    // 5. Drop old table
    db.sqlDb.exec('DROP TABLE accounts_old');

    saveToDisk(db.sqlDb);
    console.log('✓ institution column is now nullable');
  } catch (error) {
    console.error('Error making institution nullable:', error.message);
  }
}

// Export database getter and initialization function
export const getDb = () => db;
export { DB_PATH, initializeDatabase };