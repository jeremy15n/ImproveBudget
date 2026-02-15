import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import ReactMarkdown from "react-markdown";

const sections = [
  {
    title: "Getting Started",
    content: `
## Welcome to BetterBudget

BetterBudget is a fully local personal finance app. All your data stays on your computer in a single file — no cloud, no subscriptions, no data sharing.

### Quick Start

1. **Add your accounts** — Go to **Accounts** and add each bank, brokerage, or credit card with its current balance. Mark each as an asset or liability.
2. **Import transactions** — Go to **Import**, select an account, and upload a CSV export from your bank.
3. **Set up rules** — Go to **Rules** and create auto-categorization rules for recurring merchants.
4. **Create budgets** — Go to **Budget** and set monthly spending limits by category.
5. **Set goals** — Go to **Goals** and define your financial targets.
6. **View your dashboard** — The **Dashboard** gives you an at-a-glance overview of everything.
`
  },
  {
    title: "Dashboard",
    content: `
## Dashboard Overview

The Dashboard is your financial command center. It shows key metrics and charts for a selected time period.

### Date Filter

Use the filter bar at the top to switch between:
- **This Month** — Current calendar month
- **Last Month** — Previous calendar month
- **Year to Date** — January 1 through today
- **Specific Year** — Any year that has transaction data

All stat cards and charts update automatically when you change the filter.

### Stat Cards

- **Net Worth** — Live calculation from your active accounts (total assets minus total liabilities). Matches the Net Worth page.
- **Income** — Total income for the selected period
- **Expenses** — Total expenses for the selected period
- **Savings Rate** — Percentage of income going to savings: (savings / income) x 100

### Charts & Breakdowns

- **Cash Flow** — Bar chart showing income (green), expenses (red), and savings (indigo) by month
- **Income by Category** — Pie chart of income sources for the selected period
- **Spending by Category** — Pie chart of expense categories for the selected period
- **Recent Transactions** — Latest transactions across all accounts
- **Accounts Summary** — Current balances for all accounts
`
  },
  {
    title: "Accounts & Net Worth",
    content: `
## Managing Accounts

### Adding Accounts

1. Go to the **Accounts** page
2. Click **Add Account**
3. Enter the name, institution, account type, and current balance
4. Mark whether it's an **asset** or **liability**

### Asset vs Liability

- **Assets** add to your net worth: checking, savings, brokerage, retirement (IRAs, 401k)
- **Liabilities** subtract from your net worth: credit card balances, loans, mortgages

### Active vs Inactive

Inactive accounts are excluded from net worth calculations and the Dashboard. Use this for closed accounts you want to keep for historical reference.

## Net Worth Tracking

### Live Net Worth

Your net worth is calculated in real-time from your active accounts: **Total Assets - Total Liabilities**. This value appears on both the Dashboard and the Net Worth page.

### Snapshots

Click **Take Snapshot** on the Net Worth page to save a point-in-time record. Snapshots enable:
- Historical net worth chart showing your trajectory over time
- Trend percentage on the Dashboard (current vs last snapshot)

Take snapshots monthly for the best historical tracking.

### Balance Sync

For brokerage and retirement accounts, click **Sync Balances** to recalculate account balances from your investment holdings.

### What-If Projections

The Net Worth page includes a projection calculator. Adjust:
- **Projection years** — How far into the future (1-50 years)
- **Additional monthly savings** — Extra savings per month
- **Expense reduction** — Monthly costs to cut
- **Expected annual return** — Investment growth rate (default 7%)

Three scenarios are shown:
- **Current trajectory** — No changes
- **Optimized plan** — With your specified savings/cuts
- **Aggressive savings** — 2x savings + 1.5x expense cuts
`
  },
  {
    title: "Transactions",
    content: `
## Working with Transactions

### Viewing & Filtering

The Transactions page shows a paginated list with:
- **Search** — Search by merchant name or notes
- **Category filter** — Filter to a specific category
- **Type filter** — Filter by income, expense, savings, transfer, or refund
- **Account filter** — Filter to a specific account
- **Date range** — Filter by start/end date

### Transaction Types

| Type | Amount Sign | Description |
|------|------------|-------------|
| Income | Positive (+) | Money earned (salary, dividends, refunds) |
| Expense | Negative (-) | Money spent (purchases, bills, fees) |
| Savings | Negative (-) | Money moved to savings (treated separately from expenses in reports) |
| Transfer | Either | Moves between your own accounts (excluded from income/expense totals) |
| Refund | Positive (+) | Money returned |

### Editing

Click the edit icon on any transaction to change its date, amount, type, category, merchant name, account, or notes. Changing the type between income and expense automatically flips the amount sign.

### Bulk Actions

Select multiple transactions using the checkboxes, then use the bulk action bar to:
- **Change category** — Apply a category to all selected
- **Change type** — Change the transaction type (amount signs flip automatically)
- **Delete** — Remove all selected transactions (with confirmation)

### Deleting

Click the trash icon on any individual transaction, or use bulk delete for multiple.
`
  },
  {
    title: "Importing Data",
    content: `
## Importing Financial Data

### How to Import

1. Log in to your bank's website and download transactions as CSV
2. In BetterBudget, go to **Import**
3. Select the target account
4. Upload the CSV file
5. The system auto-detects the bank format, parses transactions, and imports them

### Supported Banks

| Bank | Where to Export |
|------|----------------|
| AMEX | Statements & Activity > Download CSV |
| USAA | Banking > Transactions > Download |
| Abound Credit Union | Account > Statement > Download CSV |
| PayPal Savings | Activity > All Transactions > Download |
| Fidelity | Accounts > Activity & Orders > Download |
| Schwab | Accounts > History > Export |

### Duplicate Detection

Every transaction gets a fingerprint (hash) based on **date + amount + merchant name**. When you re-import:
- Matching transactions are automatically skipped
- You'll see a count of imported vs skipped
- This prevents double-counting when re-importing overlapping date ranges

### Tips

- Import regularly (weekly or monthly) to keep data current
- After importing, review transactions and fix any miscategorized items
- Use the Rules page to set up auto-categorization for recurring merchants
- Mark transfers between your own accounts as "transfer" type to exclude them from income/expense calculations
`
  },
  {
    title: "Categorization Rules",
    content: `
## Auto-Categorization

### How Rules Work

Rules match merchant names from imported transactions to categories. When you click **Run Rules** on the Rules page, all uncategorized transactions are processed.

### Creating Rules

1. Go to the **Rules** page
2. Click **Add Rule**
3. Set a **pattern** (text to match against merchant names)
4. Choose a **match type**: Contains, Starts With, or Exact
5. Select the **target category**
6. Optionally set a **clean name** to normalize the merchant display name

### Example Rules

| Pattern | Match Type | Category | Clean Name |
|---------|-----------|----------|------------|
| NETFLIX | Contains | Subscriptions | Netflix |
| SPOTIFY | Contains | Subscriptions | Spotify |
| AMZN | Contains | Shopping | Amazon |
| WHOLE FOODS | Contains | Groceries | Whole Foods |
| SHELL OIL | Contains | Transportation | Shell Gas |

### Priority

Higher priority rules are checked first. Use this when patterns overlap. For example, "AMAZON PRIME" (priority 10, Subscriptions) should match before "AMAZON" (priority 5, Shopping).

### Merchant Cleaning

The optional **Clean Name** field normalizes messy bank descriptions. For example, "NETFLIX.COM 800-XXX-XXXX CA" becomes just "Netflix" in your transaction list.
`
  },
  {
    title: "Budget & Goals",
    content: `
## Budget Tracking

### Setting Up Budgets

1. Go to the **Budget** page
2. Click **Add Budget** for each spending category you want to track
3. Set a monthly dollar limit
4. Use the month navigation arrows to view budget performance for any month

### How It Works

- Budgets compare your **actual spending** (from categorized transactions) against your **monthly limit**
- Progress bars show how much of each budget you've used
- Red indicates over-budget, green indicates under-budget
- Navigate between months to see historical budget performance

### Suggested Approach (50/30/20 Rule)

- **Needs (50%)** — Housing, utilities, insurance, healthcare, groceries, transportation
- **Wants (30%)** — Entertainment, shopping, dining out, travel, subscriptions
- **Savings (20%+)** — Savings transfers, investments, debt payoff

Start with 5-8 key categories rather than budgeting everything at once.

## Financial Goals

### Creating Goals

1. Go to the **Goals** page
2. Click **Add Goal**
3. Set a name, target amount, current amount, and target date

### Examples

- Emergency fund: $10,000 by end of year
- Down payment: $50,000 by 2028
- Vacation fund: $3,000 by summer

Update current amounts as you make progress.
`
  },
  {
    title: "Investments",
    content: `
## Investment Tracking

### Managing Holdings

The **Investments** page shows your portfolio with current values, gains/losses, and allocation.

### Adding Holdings

Holdings can be added two ways:
- **CSV Import** — Import from Fidelity or Schwab (auto-detects positions)
- **Manual Entry** — Add individual holdings with symbol, shares, and cost basis

### Live Price Refresh

Click **Refresh Prices** to fetch current market prices for all holdings. This updates:
- Current share prices
- Total current value
- Gain/loss calculations

### Account Sync

After refreshing prices, click **Sync Balances** on the Net Worth page to update your brokerage/retirement account balances based on current investment values.
`
  },
  {
    title: "Categories & Settings",
    content: `
## Custom Categories

### Managing Categories

Go to **Settings** to view, add, edit, or delete spending categories.

Each category has:
- **Name** — Internal identifier used in the database
- **Label** — Display name shown in the UI
- **Color** — Color used in charts and category indicators

### Default Categories

BetterBudget comes with ~40 default categories covering common spending areas. You can:
- Edit default category labels and colors
- Add new custom categories
- Delete categories you don't need (transactions using that category will keep their assignment)

### Where Categories Appear

Categories are used throughout the app:
- Transaction categorization (manual or via rules)
- Budget tracking (budgets are per-category)
- Dashboard pie charts (spending and income by category)
- Transaction filters
`
  },
  {
    title: "Data & Privacy",
    content: `
## Your Data

### Where It Lives

All your financial data is stored in a single local file:

\`\`\`
backend/data/budget.db
\`\`\`

This is a SQLite database containing all transactions, accounts, budgets, categories, rules, investments, goals, and net worth snapshots.

### Privacy

- **No cloud storage** — Everything stays on your computer
- **No account credentials** — You import CSV files, never connect directly to banks
- **No tracking or analytics** — No data is sent anywhere
- **One exception** — The optional "Refresh Prices" feature fetches live stock prices from a market data API. No personal data is sent — only stock symbols.

### Backup

Copy \`backend/data/budget.db\` to a safe location regularly. This single file contains everything.

### Restore

Replace \`backend/data/budget.db\` with your backup and restart the app.

### Start Fresh

Delete \`backend/data/budget.db\` and restart the backend. A new empty database with default categories will be created automatically.
`
  }
];

export default function Documentation() {
  const [openSections, setOpenSections] = useState(new Set([0]));

  const toggle = (idx) => {
    const next = new Set(openSections);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setOpenSections(next);
  };

  return (
    <div>
      <PageHeader title="Documentation" subtitle="Learn how to use BetterBudget" />

      <div className="space-y-2">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
            <button
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{section.title}</span>
              </div>
              {openSections.has(idx) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>
            {openSections.has(idx) && (
              <div className="px-5 pb-6 pt-0">
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none [&_table]:text-xs [&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-2 [&_table]:border [&_th]:border [&_td]:border [&_th]:bg-slate-50 dark:[&_th]:bg-slate-800">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
