# Quick Start Guide

Get ImproveBudget running in 3 minutes.

## Installation

```bash
# 1. Clone and navigate to the project
git clone https://github.com/yourusername/ImproveBudget.git
cd ImproveBudget

# 2. Install dependencies
npm install
cd backend && npm install && cd ..

# 3. Start the application
npm run dev
```

Open your browser to **http://localhost:5173**

## What Just Happened?

- **Frontend:** React app running on port 5173
- **Backend:** Express API running on port 8000
- **Database:** SQLite file created at `backend/data/budget.db`

## Where Is My Data?

All your financial data is stored locally in:

```
backend/data/budget.db
```

**Backup this file regularly** - it contains all your:
- Transactions
- Accounts
- Budgets
- Investment data
- Financial goals

## First Steps

1. **Create an Account**
   - Go to "Accounts" page
   - Click "New Account"
   - Add your checking, savings, or credit card accounts

2. **Import Transactions**
   - Go to "Import" page
   - Select an account
   - Upload a CSV file from your bank
   - Supported: AMEX, USAA, PayPal, Fidelity, Schwab

3. **Set Up Budgets**
   - Go to "Budget" page
   - Set monthly spending limits by category
   - Watch your progress in real-time

4. **View Dashboard**
   - Go to "Dashboard" for overview
   - See spending trends and account balances

## Common Commands

```bash
# Start application (frontend + backend)
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend

# Build for production
npm run build
```

## Backup Your Data

**Windows:**
```bash
copy backend\data\budget.db C:\Backups\budget-backup.db
```

**Mac/Linux:**
```bash
cp backend/data/budget.db ~/Backups/budget-backup.db
```

## Troubleshooting

**Port 5173 already in use?**
```bash
# Kill the process and restart
npm run dev
```

**Backend won't start?**
```bash
# Check Node.js version (need 18+)
node -v

# Reinstall backend dependencies
cd backend && rm -rf node_modules && npm install && cd ..
```

**White screen in browser?**
- Check browser console (F12) for errors
- Make sure backend is running (check port 8000)
- Try refreshing the page (Ctrl+R or Cmd+R)

## Need More Help?

- Full documentation: [README.md](README.md)
- API reference: [backend/API.md](backend/API.md)
- Architecture details: [ARCHITECTURE.md](ARCHITECTURE.md)
