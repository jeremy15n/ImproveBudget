# BetterBudget Architecture

Technical architecture of the BetterBudget application.

## Overview

Full-stack personal finance app with a React frontend and Node.js/Express backend. Fully local — no external service dependencies (except optional live investment price refresh).

```
┌──────────────────────────────────────────────────┐
│           Browser (http://localhost:5173)         │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │         React SPA (Vite)                    │  │
│  │                                             │  │
│  │  Pages → Components → TanStack Query        │  │
│  │                        ↓                    │  │
│  │                   apiClient.js              │  │
│  └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
          ↓ HTTP/REST (CORS)
   ┌───────────────────────────────────────────┐
   │  Node.js/Express (localhost:8000)          │
   │                                            │
   │  Routes → Controllers → Services           │
   │    ├─ Entity CRUD (generic)                │
   │    ├─ Reports (cash flow aggregation)      │
   │    ├─ Investments (live price refresh)     │
   │    ├─ Accounts (balance sync)              │
   │    └─ File Upload/Import                   │
   │               ↓                            │
   │  SQLite (sql.js, in-memory + disk sync)    │
   │  File: backend/data/budget.db              │
   └────────────────────────────────────────────┘
```

## Tech Stack

### Frontend

- **React 18** — Component-based UI
- **Vite** — Build tool with HMR
- **React Router v6** — Client-side routing (auto-generated from `pages.config.js`)
- **TanStack Query** — Server state management and caching
- **Tailwind CSS** — Utility-first styling
- **shadcn/ui** — Accessible component library (Radix UI primitives)
- **Recharts** — Charts (bar, pie, area)
- **Lucide React** — Icons
- **Moment.js** — Date formatting
- **ReactMarkdown** — Markdown rendering (Documentation page)

### Backend

- **Node.js 18+** — JavaScript runtime
- **Express** — Web framework
- **sql.js** — Pure JavaScript SQLite (no native compilation)
- **papaparse** — CSV parsing with auto-detection
- **multer** — File upload middleware

## Frontend Architecture

### Directory Structure

```
src/
├── main.jsx                     # Entry point
├── App.jsx                      # Router setup
├── Layout.jsx                   # App shell with sidebar navigation
├── pages.config.js              # Auto-generated page routing
├── pages/
│   ├── Dashboard.jsx            # Overview with global date filter
│   ├── Transactions.jsx         # Paginated transaction list with bulk actions
│   ├── Accounts.jsx             # Account management
│   ├── Budget.jsx               # Budget tracking with month navigation
│   ├── Investments.jsx          # Portfolio tracking
│   ├── NetWorth.jsx             # Net worth tracking + projections
│   ├── Goals.jsx                # Financial goals
│   ├── Import.jsx               # CSV import
│   ├── Rules.jsx                # Auto-categorization rules
│   ├── Settings.jsx             # Category management
│   └── Documentation.jsx        # In-app help
├── components/
│   ├── ui/                      # shadcn/ui base components
│   ├── shared/                  # PageHeader, StatCard, EmptyState, formatters
│   ├── transactions/            # TransactionRow, TransactionEditDialog, TransactionFilters
│   ├── dashboard/               # CashFlowChart, CategoryBreakdown, IncomeBreakdown,
│   │                            #   RecentTransactions, AccountsSummary
│   ├── networth/                # NetWorthProjector
│   └── import/                  # Import flow components
├── hooks/
│   └── useCategories.js         # Dynamic categories from API
├── api/
│   └── apiClient.js             # Generic REST client with Entity pattern
└── lib/
    ├── query-client.js          # TanStack Query configuration
    └── utils.js                 # Utility functions
```

### Data Flow

1. **User interaction** → Component event handler
2. **API call** → `apiClient.entities.{Entity}.{method}()`
3. **HTTP request** → Express backend on `localhost:8000/api`
4. **TanStack Query** → Caches response, manages loading/error states
5. **Re-render** → Component displays updated data

### API Client Pattern

The `apiClient` provides a generic Entity-based interface for all CRUD operations:

```javascript
// Standard CRUD
apiClient.entities.Transaction.list(sortField, limit)
apiClient.entities.Transaction.filter(conditions, sortField, limit)
apiClient.entities.Transaction.create(data)
apiClient.entities.Transaction.update(id, data)
apiClient.entities.Transaction.delete(id)

// Bulk operations
apiClient.entities.Transaction.bulkCreate(items)
apiClient.entities.Transaction.bulkUpdate(ids, data)
apiClient.entities.Transaction.bulkDelete(ids)

// Paginated (returns { data, meta })
apiClient.entities.Transaction.listPaginated({ page, limit, sort_by, sort_order, ...filters })

// Reports (non-entity)
apiClient.getCashFlow(startDate, endDate, interval)
apiClient.getReportYears()
apiClient.refreshInvestmentPrices()
apiClient.getQuote(symbol)
```

### Dynamic Categories

Categories are stored in the database and served via the API. The `useCategories()` hook provides:

```javascript
const { categoryList, categoryColors, getCategoryLabel, isLoading } = useCategories();
```

Falls back to hardcoded defaults if the API is unavailable. Default categories are seeded on database initialization.

### Dashboard Architecture

The Dashboard page owns a global date filter (This Month / Last Month / YTD / Specific Year) that drives:
- **Stat cards** — Income, Expenses, Savings Rate (from cash flow report)
- **Net Worth** — Live calculation from active accounts (assets - liabilities)
- **Cash Flow chart** — 3-bar chart (income, expenses, savings) from report API
- **Category breakdowns** — Pie charts filtered by the selected date range
- **Recent transactions** — Latest 200 transactions

## Backend Architecture

### Directory Structure

```
backend/
├── src/
│   ├── server.js                # Entry point (port binding)
│   ├── app.js                   # Express config, middleware, route registration
│   ├── config/
│   │   └── database.js          # DB init, schema, migrations, category seeding
│   ├── routes/
│   │   ├── entity.routes.js     # Generic CRUD + bulk routes (/:entity pattern)
│   │   ├── upload.routes.js     # File upload + import routes
│   │   ├── report.routes.js     # Cash flow + available years
│   │   ├── investment.routes.js # Price refresh + quote
│   │   └── account.routes.js    # Balance sync
│   ├── controllers/
│   │   ├── entity.controller.js # Generic CRUD + bulk operations
│   │   └── upload.controller.js # Upload, extract, import logic
│   ├── services/
│   │   ├── database.service.js  # Generic DB operations (list, create, update, delete, bulk)
│   │   ├── csv.service.js       # CSV parsing + bank format auto-detection
│   │   ├── report.service.js    # Cash flow aggregation queries
│   │   ├── marketData.service.js # Live stock/ETF price fetching
│   │   └── account.service.js   # Account balance sync from investments
│   └── middleware/
│       ├── errorHandler.js      # Global error handler
│       └── cors.js              # CORS configuration
├── data/
│   └── budget.db                # SQLite database (auto-created)
└── uploads/                     # Temporary upload directory
```

### Route Registration Order

Routes are registered in `app.js` in a specific order because the generic `/:entity` pattern would otherwise catch everything:

```javascript
app.use('/api', uploadRoutes);           // /api/upload, /api/extract, /api/import
app.use('/api/investments', investmentRoutes); // /api/investments/refresh, /quote/:symbol
app.use('/api/accounts', accountRoutes);      // /api/accounts/sync-balances
app.use('/api/reports', reportRoutes);        // /api/reports/cash-flow, /years
app.use('/api', entityRoutes);               // /api/:entity (must be last)
```

### Database Service

Generic CRUD operations for all entity types:

```javascript
dbService.list(table, filters, sort, limit)
dbService.getById(table, id)
dbService.create(table, data)
dbService.update(table, id, data)
dbService.delete(table, id)
dbService.bulkCreate(table, items)
dbService.bulkUpdate(table, ids, data)
dbService.bulkDelete(table, ids)
dbService.raw(sql, params)
```

Features:
- Parameterized queries (SQL injection prevention)
- Dynamic WHERE clause building with operators: `=`, `_gte`, `_lte`, `_like`, `search`
- Opt-in pagination (when `page` param present, returns `{ data, meta }`)
- Automatic `updated_at` timestamp management
- Entity name → table name mapping

### Report Service

Handles aggregated queries that don't fit the generic CRUD pattern:

- **Cash Flow** — Groups transactions by month or year, aggregates into 3 buckets:
  - `income` — Positive amounts (excluding savings type)
  - `expenses` — Negative amounts (excluding savings type)
  - `savings` — Transactions with type "savings" (absolute value)
  - Transfers are excluded entirely
- **Available Years** — Returns distinct years that have transaction data

### CSV Import Pipeline

```
Upload CSV → papaparse → Auto-detect bank format → Normalize transactions
  → Generate import hashes (date|amount|merchant) → Deduplicate → Bulk insert
```

Supported formats: AMEX, USAA, Abound Credit Union, PayPal Savings, Fidelity, Schwab.

### Database Initialization

On startup (`backend/src/config/database.js`):
1. Load or create SQLite database file via sql.js
2. Run schema creation (all tables + indexes)
3. Run migrations (schema changes)
4. Sync default categories (seed/update defaults, preserve user-created)
5. Save to disk

## Database Schema

### Tables

| Table | Key Fields | Notes |
|-------|-----------|-------|
| `accounts` | name, institution, account_type, balance, is_asset, is_active | Asset/liability flag for net worth |
| `transactions` | date, merchant_raw, merchant_clean, amount, category, account_id, type, import_hash | Types: income, expense, savings, transfer, refund |
| `budgets` | category, monthly_limit, month, is_active, rollover | Unique on category + month |
| `categories` | name, label, color, is_default, sort_order | Seeded with ~40 defaults |
| `categoryrules` | match_pattern, match_type, category, merchant_clean_name, priority | Contains/starts_with/exact matching |
| `investments` | symbol, name, account_id, asset_class, shares, current_value, gain_loss | Linked to accounts |
| `networthsnapshots` | date, total_assets, total_liabilities, net_worth, accounts_breakdown, month | Point-in-time snapshots |
| `financialgoals` | name, target_amount, current_amount, target_date, category, is_active | Progress tracking |

### Relationships

- `transactions.account_id` → `accounts.id` (ON DELETE SET NULL)
- `investments.account_id` → `accounts.id` (ON DELETE SET NULL)

## Security

- **SQL injection prevention** — All queries use parameterized statements
- **File upload validation** — CSV/Excel only, 10MB size limit, in-memory with auto-cleanup
- **CORS** — Configured for localhost in development
- **Local-only data** — All data in `budget.db`, no external network calls (except opt-in investment price refresh)
- **No credentials stored** — App uses exported CSV files, not bank login credentials

## Performance

- **Frontend:** TanStack Query caches responses; categories cached for 1 minute; Vite tree-shaking and code splitting
- **Backend:** Strategic indexes on date, account_id, category, import_hash; sql.js operates in-memory with periodic disk sync; bulk operations use database transactions
- **Pagination:** Server-side pagination for transactions prevents loading entire dataset

---

For API details, see [backend/API.md](backend/API.md). For setup, see [README.md](README.md).
