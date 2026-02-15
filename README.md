# BetterBudget

A **fully local** personal finance application — no cloud services, no subscriptions, no data sharing. Built with React and Node.js, all your financial data stays on your computer in a single SQLite file.

## Features

- **Dashboard** — At-a-glance overview with date filters (This Month / Last Month / YTD / Year), income/expense/savings charts, spending breakdowns, and live net worth
- **Transactions** — Server-side paginated list with search, filters, bulk edit, bulk delete, and individual delete
- **Accounts** — Manage checking, savings, credit cards, brokerage, and retirement accounts with asset/liability tracking
- **Budget** — Set monthly spending limits by category with month-by-month history navigation
- **Investments** — Track holdings with live price refresh and portfolio summary
- **Net Worth** — Live net worth from accounts, historical snapshots, and what-if projection calculator
- **Goals** — Define financial targets and track progress
- **CSV Import** — Bulk import from AMEX, USAA, PayPal, Abound Credit Union, Fidelity, and Schwab
- **Auto-Categorization** — Rules engine to automatically categorize and clean merchant names
- **Categories** — Fully customizable spending categories with colors (Settings page)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TanStack Query, React Router v6 |
| Styling | Tailwind CSS, shadcn/ui (Radix UI), Lucide icons |
| Charts | Recharts |
| Backend | Node.js, Express |
| Database | SQLite via sql.js (pure JS, no native deps) |
| Import | papaparse (CSV), multer (file upload) |

## Quick Start

### Prerequisites

- **Node.js 18+** — [Download here](https://nodejs.org)

### Install & Run

```bash
git clone https://github.com/yourusername/BetterBudget.git
cd BetterBudget

npm install
cd backend && npm install && cd ..

npm run dev
```

This starts both servers:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000

### First Steps

1. **Add accounts** — Go to Accounts, add each bank/brokerage with its current balance
2. **Import transactions** — Go to Import, select an account, upload your bank's CSV export
3. **Set up rules** — Go to Rules, create auto-categorization rules for recurring merchants
4. **Create budgets** — Go to Budget, set monthly limits by category
5. **View dashboard** — Dashboard shows your finances at a glance

## Available Scripts

```bash
npm run dev              # Start frontend + backend
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # Check for issues
npm run lint:fix         # Auto-fix issues
```

## Project Structure

```
BetterBudget/
├── src/                            # React frontend
│   ├── pages/                      # Page components (Dashboard, Transactions, etc.)
│   ├── components/
│   │   ├── ui/                     # shadcn/ui base components
│   │   ├── shared/                 # PageHeader, StatCard, formatters
│   │   ├── transactions/           # TransactionRow, EditDialog, Filters
│   │   ├── dashboard/              # CashFlowChart, CategoryBreakdown, etc.
│   │   ├── networth/               # NetWorthProjector
│   │   └── import/                 # Import components
│   ├── hooks/                      # useCategories
│   ├── api/                        # apiClient.js (generic REST client)
│   └── lib/                        # Query client, utilities
├── backend/
│   ├── src/
│   │   ├── server.js               # Entry point
│   │   ├── app.js                  # Express config + route registration
│   │   ├── routes/                 # entity, upload, report, investment, account routes
│   │   ├── controllers/            # Request handlers
│   │   ├── services/               # database, csv, report, marketData services
│   │   ├── middleware/             # CORS, error handler
│   │   └── config/                 # Database init + schema + category seeding
│   └── data/                       # budget.db (auto-created)
├── entities/                       # Data model definitions
└── package.json
```

## Importing Data

### Supported Banks

| Bank | Format |
|------|--------|
| AMEX | CSV — Statements & Activity |
| USAA | CSV — Banking Transactions |
| Abound Credit Union | CSV — Account Statement |
| PayPal Savings | CSV — Activity / All Transactions |
| Fidelity | CSV — Positions or Activity & Orders |
| Schwab | CSV — Account History |

### How It Works

1. Export transactions as CSV from your bank's website
2. In BetterBudget, go to **Import** → select the target account → upload the file
3. The system auto-detects the bank format, parses transactions, and imports them
4. Duplicate detection (based on date + amount + merchant hash) prevents double-counting on re-import

## Your Data

All financial data lives in one local file:

```
backend/data/budget.db
```

**No data leaves your computer.** There are no cloud services, external APIs (except optional investment price refresh), or third-party access.

### Backup

```bash
# Windows
copy backend\data\budget.db backend\data\budget-backup.db

# Mac/Linux
cp backend/data/budget.db backend/data/budget-backup.db
```

### Restore

Replace `backend/data/budget.db` with your backup file and restart the app.

### Start Fresh

Delete `backend/data/budget.db` and restart the backend. A new empty database with default categories will be created.

## Configuration

Both frontend and backend work with defaults out of the box. Optional overrides:

**Frontend** (`.env.local`): `VITE_API_BASE_URL=http://localhost:8000/api`

**Backend** (`.env`): `PORT=8000`, `DB_PATH=./data/budget.db`, `MAX_FILE_SIZE=10485760`

## API Reference

See [backend/API.md](backend/API.md) for complete API documentation covering all entity CRUD endpoints, query parameters, bulk operations, reports, investments, and file import.

## Troubleshooting

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8000
kill -9 <PID>
```

**Database error ("no such table"):** Delete `backend/data/budget.db` and restart the backend.

**API connection failed:** Verify the backend is running on port 8000. Check `.env.local` for `VITE_API_BASE_URL`. Check browser console (F12) for errors.

**CSV import not working:** Ensure the CSV is from a supported bank, file is under 10MB, and the target account exists. Check browser console for details.

**Backend won't start:**
```bash
node -v          # Need 18+
cd backend && rm -rf node_modules && npm install && cd ..
```

## How to Upgrade

Since your database (`budget.db`) is strictly separated from the code via `.gitignore`, you can upgrade the application without losing any personal data. Choose the method that matches your installation type.

### Option 1: Git / Source Code Installation
*Use this if you are running the app directly on your machine or server using Node.js.*

1.  **Stop the Application**
    Stop the currently running process.

2.  **Pull the Latest Code**
    Download the newest version from GitHub.
    ```bash
    git pull origin main
    ```

3.  **Update Dependencies**
    Install any new libraries for both the frontend and backend.
    ```bash
    npm install
    cd backend && npm install && cd ..
    ```

4.  **Restart the Application**
    Start the app again. Any necessary database migrations (like new columns) will run automatically on startup.
    ```bash
    # For development:
    npm run dev

    # For production:
    npm run build
    npm start
    ```

## Further Reading

- [API Documentation](backend/API.md) — Full endpoint reference
- [Architecture](ARCHITECTURE.md) — Technical architecture and design decisions

## License

MIT
