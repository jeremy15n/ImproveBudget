# ImproveBudget

A **fully local** personal finance tracking application with no cloud services required. Built with React and Node.js, all your financial data stays on your computer. Track transactions, manage budgets, monitor investments, and set financial goals - completely private and portable.

## Features

- **💰 Transactions** - Track and categorize income and expenses across multiple accounts
- **📊 Accounts** - Manage checking, savings, credit cards, investments, and loans
- **📈 Budget** - Set monthly spending limits by category and monitor progress
- **🎯 Goals** - Define financial goals and track progress toward them
- **📋 Investments** - Monitor investment portfolio and track gains/losses
- **💎 Net Worth** - Track total net worth over time with historical snapshots
- **🏦 CSV Import** - Bulk import transactions from bank and credit card statements
- **🤖 Auto-Categorization** - Create rules for automatic transaction categorization
- **📋 Dashboard** - Get a high-level overview of your finances at a glance

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Fast build tool with HMR
- **TanStack Query** - Server state management
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **SQLite** - Local file-based database
- **sql.js** - Pure JavaScript SQLite (no native dependencies)
- **papaparse** - CSV parser

## Quick Start

**Want to get started immediately?** See [QUICKSTART.md](QUICKSTART.md) for a 3-minute setup guide.

### Prerequisites

- **Node.js 18 or higher** - [Download here](https://nodejs.org)
- **npm** - Comes with Node.js (no additional installation needed)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ImproveBudget.git
   cd ImproveBudget
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Set up environment variables (optional):**

   The application works with default settings. Only create these files if you need custom configuration:

   ```bash
   # Frontend configuration (optional)
   cp .env.example .env.local

   # Backend configuration (optional)
   cp backend/.env.example backend/.env
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

   This will start both servers:
   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:8000

5. **Open your browser:**
   Navigate to http://localhost:5173

## Project Structure

```
ImproveBudget/
├── src/                           # React frontend
│   ├── pages/                    # Application pages
│   ├── components/               # React components
│   ├── api/                      # API client
│   ├── lib/                      # Utilities and context
│   └── main.jsx                  # Frontend entry point
├── backend/                       # Node.js backend
│   ├── src/
│   │   ├── server.js            # Server entry point
│   │   ├── app.js               # Express app config
│   │   ├── routes/              # API routes
│   │   ├── controllers/         # Request handlers
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Express middleware
│   │   ├── config/              # Configuration
│   │   └── db/                  # Database schema
│   ├── data/                     # SQLite database (auto-created)
│   ├── package.json
│   └── .env
├── entities/                      # Data model definitions
├── package.json
└── README.md
```

## Available Scripts

### Root Directory

```bash
# Start both frontend and backend servers
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend

# Build frontend for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Type-check with TypeScript
npm run typecheck
```

### Backend Directory

```bash
# Start backend server
npm start

# Start backend with auto-reload (development)
npm run dev
```

## Importing Data

### Supported Banks

ImproveBudget can import transactions from the following banks and institutions:

- **AMEX** - American Express (credit cards)
- **USAA** - USAA bank (all accounts)
- **Abound** - Abound Credit Union
- **PayPal** - PayPal Savings
- **Fidelity** - Fidelity brokerage accounts
- **Schwab** - Charles Schwab accounts (brokerage, IRA)

### Import Process

1. Go to the **Import** page in the application
2. Select the account to import into
3. Click the upload area and select your CSV file
4. The system will:
   - Auto-detect the bank format
   - Parse all transactions
   - Detect and skip duplicates (using import hash)
   - Bulk import valid transactions

### Export Instructions by Bank

**American Express:**
1. Log in to amex.com
2. Go to "Statements" → Select date range
3. Click "Download Transactions" → Choose "CSV"

**USAA:**
1. Log in to usaa.com
2. Go to "Statements & Documents"
3. Click account → Click "Download" → Choose "CSV"

**PayPal:**
1. Log in to paypal.com
2. Go to "Statements" → Select date range
3. Click "Download" → Choose "CSV"

**Fidelity:**
1. Log in to fidelity.com
2. Go to "Positions" or "History"
3. Use "Download" feature

**Schwab:**
1. Log in to schwab.com
2. Go to "Account Statements"
3. Use CSV export option

## Your Data

### Where Your Data Lives

**All your financial data is stored locally in a single file:**

```
backend/data/budget.db
```

This SQLite database file contains:
- All transactions
- Accounts
- Budgets
- Investment holdings
- Financial goals
- Net worth snapshots
- Categorization rules

**No data leaves your computer.** There are no cloud backups, no external services, and no third-party access.

### Backup Your Data

To backup your financial data, simply copy the database file:

**Windows:**
```bash
copy backend\data\budget.db C:\Backups\budget-backup-2025-02-13.db
```

**Mac/Linux:**
```bash
cp backend/data/budget.db ~/Backups/budget-backup-2025-02-13.db
```

**Recommended:** Set up automatic backups to external drive or cloud storage (Dropbox, Google Drive, etc.)

### Restore From Backup

Replace the current database with your backup:

**Windows:**
```bash
copy C:\Backups\budget-backup-2025-02-13.db backend\data\budget.db
```

**Mac/Linux:**
```bash
cp ~/Backups/budget-backup-2025-02-13.db backend/data/budget.db
```

Then restart the application.

### Start Fresh

To reset and start with a clean database:

**Windows:**
```bash
del backend\data\budget.db
npm run dev:backend
```

**Mac/Linux:**
```bash
rm backend/data/budget.db
npm run dev:backend
```

A new empty database will be created automatically.

## Configuration

### Frontend (.env.local)

```env
# API endpoint for backend
VITE_API_BASE_URL=http://localhost:8000/api
```

### Backend (.env)

```env
# Server port
PORT=8000

# Environment (development or production)
NODE_ENV=development

# Database file path
DB_PATH=./data/budget.db

# Upload directory for temporary files
UPLOAD_DIR=./uploads

# Maximum file size for uploads (10MB)
MAX_FILE_SIZE=10485760
```

## API Reference

### Authentication
*Note: Authentication is not yet implemented. All endpoints are currently open.*

### Entity Endpoints

All entities follow the same RESTful pattern:

```
GET    /api/{entity}              # List/filter entities
GET    /api/{entity}/{id}         # Get single entity
POST   /api/{entity}              # Create entity
POST   /api/{entity}/bulk         # Bulk create entities
PUT    /api/{entity}/{id}         # Update entity
DELETE /api/{entity}/{id}         # Delete entity
```

### Supported Entities

- `transaction` - Individual transactions
- `account` - Financial accounts
- `budget` - Monthly budgets
- `categoryrule` - Auto-categorization rules
- `financialgoal` - Financial goals
- `investment` - Investment holdings
- `networthsnapshot` - Net worth history

### File Upload Endpoints

```
POST /api/upload     # Upload CSV file
POST /api/extract    # Extract and parse CSV
POST /api/import     # Combined upload + extract + import
```

### Example Requests

**List transactions (with sorting and filtering):**
```bash
curl http://localhost:8000/api/transaction \
  ?sort_by=date&sort_order=desc&limit=50 \
  &account_id=1&category=groceries
```

**Create transaction:**
```bash
curl -X POST http://localhost:8000/api/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-01-15",
    "merchant_raw": "Whole Foods",
    "amount": -45.32,
    "category": "groceries",
    "account_id": 1
  }'
```

**Import transactions:**
```bash
curl -X POST http://localhost:8000/api/import \
  -F "file=@transactions.csv" \
  -F "account_id=1"
```

See [backend/API.md](backend/API.md) for complete API documentation.

## Development

### Code Style
- Uses ESLint for JavaScript linting
- Uses TypeScript for type checking (JSDoc)
- Tailwind CSS for consistent styling

### Running Linters
```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run typecheck   # Check types
```

### Adding Features
1. Create components in `src/components/`
2. Add API calls in `src/api/`
3. Use TanStack Query hooks for data fetching
4. Style with Tailwind CSS classes
5. Test in browser at http://localhost:5173

### Database Changes
1. Update schema in `backend/src/db/schema.sql`
2. Database auto-initializes on first run
3. For migrations, create numbered files in `backend/src/db/migrations/`

## Troubleshooting

### Port Already in Use
```bash
# Kill process using port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :8000
kill -9 <PID>
```

### Database Error: "no such table"
The database wasn't initialized properly. Delete and recreate:
```bash
rm backend/data/budget.db
npm run dev:backend
```

### API Connection Failed
1. Check backend is running on port 8000
2. Check `VITE_API_BASE_URL` in `.env.local`
3. Check browser console for detailed error

### CSV Import Not Working
1. Ensure CSV format is supported (see [Importing Data](#importing-data))
2. Check file size is under 10MB
3. Verify account exists
4. Check browser console for error details

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
cd backend && npm install --production && cd ..
npm run dev:backend
```

The frontend will be served from the backend Express server.

### Environment Variables for Production
Update `backend/.env`:
```env
NODE_ENV=production
PORT=8000
```

Update `.env.local`:
```env
VITE_API_BASE_URL=https://yourdomain.com/api
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to open issues and pull requests.

## Support

For issues and questions, please open a GitHub issue.

---

**Happy budgeting! 💰**
