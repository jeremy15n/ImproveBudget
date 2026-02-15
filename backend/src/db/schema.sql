-- ImproveBudget Database Schema
-- SQLite database for storing all budget and financial data

-- Track database schema version
CREATE TABLE IF NOT EXISTS schema_version (
  id INTEGER PRIMARY KEY,
  version INTEGER NOT NULL,
  applied_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO schema_version (version) VALUES (1);

-- Accounts table - stores financial accounts
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  institution TEXT NOT NULL,
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
);

CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_accounts_institution ON accounts(institution);

-- Transactions table - stores individual transactions
CREATE TABLE IF NOT EXISTS transactions (
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
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_import_hash ON transactions(import_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_is_reviewed ON transactions(is_reviewed);

-- Budgets table - stores monthly budget limits by category
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  month TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  rollover INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(category, month)
);

CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_budgets_is_active ON budgets(is_active);

-- Categories table - customizable spending categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT DEFAULT '#cbd5e1',
  is_default INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Category Rules table - for auto-categorization
CREATE TABLE IF NOT EXISTS categoryrules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_pattern TEXT NOT NULL,
  match_type TEXT NOT NULL,
  category TEXT NOT NULL,
  merchant_clean_name TEXT,
  is_active INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_categoryrules_is_active ON categoryrules(is_active);
CREATE INDEX IF NOT EXISTS idx_categoryrules_priority ON categoryrules(priority DESC);

-- Financial Goals table
CREATE TABLE IF NOT EXISTS financialgoals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0,
  target_date TEXT,
  category TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  monthly_contribution REAL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_financialgoals_is_active ON financialgoals(is_active);
CREATE INDEX IF NOT EXISTS idx_financialgoals_category ON financialgoals(category);

-- Investments table - tracks investment holdings
CREATE TABLE IF NOT EXISTS investments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  account_id INTEGER,
  account_name TEXT,
  asset_class TEXT NOT NULL,
  shares REAL NOT NULL,
  cost_basis REAL,
  current_value REAL,
  current_price REAL,
  gain_loss REAL,
  gain_loss_pct REAL,
  last_updated TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_investments_account ON investments(account_id);
CREATE INDEX IF NOT EXISTS idx_investments_symbol ON investments(symbol);

-- Net Worth Snapshots table - tracks net worth over time
CREATE TABLE IF NOT EXISTS networthsnapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  total_assets REAL NOT NULL,
  total_liabilities REAL NOT NULL,
  net_worth REAL NOT NULL,
  accounts_breakdown TEXT,
  month TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_networthsnapshots_date ON networthsnapshots(date DESC);
CREATE INDEX IF NOT EXISTS idx_networthsnapshots_month ON networthsnapshots(month);
CREATE INDEX IF NOT EXISTS idx_networthsnapshots_deleted_at ON networthsnapshots(deleted_at);