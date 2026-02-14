import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import ReactMarkdown from "react-markdown";

const sections = [
  {
    title: "Getting Started",
    content: `
## Welcome to BetterBudget — Your Personal Finance Command Center

BetterBudget gives you **full visibility** into every dollar you earn, spend, save, and invest across all your financial accounts.

### Quick Start (5 minutes)

1. **Add your accounts** — Go to **Accounts** and add each bank/brokerage account with its current balance.
2. **Import transactions** — Go to **Import** and upload CSV/Excel exports from each institution.
3. **Set up rules** — Go to **Rules** and create auto-categorization rules for recurring merchants.
4. **Create budgets** — Go to **Budget** and set monthly spending limits by category.
5. **Set goals** — Go to **Goals** and define your financial independence targets.
`
  },
  {
    title: "Accounts Setup",
    content: `
## Setting Up Your Accounts

### Your Current Accounts
- **USAA** — Credit card
- **Fidelity** — Individual brokerage account
- **Schwab** — Roth IRA + Traditional IRA
- **Abound Credit Union** — Checking & savings accounts
- **PayPal Savings** — High-yield savings
- **AMEX** — Credit cards

### How to Add an Account
1. Navigate to the **Accounts** page
2. Click **Add Account**
3. Select the institution, account type, and enter the current balance
4. Mark whether it's an **asset** (checking, savings, investments) or **liability** (credit card balance, loans)

### Asset vs Liability
- **Assets** add to your net worth: checking, savings, brokerage, retirement (IRAs, 401k)
- **Liabilities** subtract from your net worth: credit card balances, loans, mortgages

### Best Practice
Update balances whenever you import new transactions or at least monthly.
`
  },
  {
    title: "Net Worth Projections",
    content: `
## Net Worth What-If Calculator

### How to Use
On the **Net Worth** page, scroll to the projection section to model different scenarios:

1. **Projection Years** — How far into the future (1-50 years)
2. **Additional Monthly Savings** — Increase your savings by X amount
3. **Expense Reduction** — Cut costs by Y amount
4. **Expected Annual Return** — Investment growth rate (default 7%)

### Three Scenarios Shown
- **Current Trajectory** (gray dashed line) — Your path if nothing changes
- **Optimized Plan** (blue line) — With your additional savings + expense cuts
- **Aggressive Savings** (green line) — 2x additional savings + 1.5x expense cuts

### Example Scenarios
| Scenario | Monthly Change | 10-Year Impact |
|----------|---------------|----------------|
| Cut subscriptions | -$100 expenses | +$17,300 |
| Side hustle income | +$500 savings | +$86,500 |
| Both combined | +$600/month | +$103,800 |

### The Power of Compounding
The calculator includes compound returns:
- Assumes monthly contributions
- Investment growth compounds monthly
- Shows how small changes add up over time
- Default 7% annual return (historical stock market average)

### Tips
- Start conservative (5-6% return for mixed portfolios)
- Use this to justify lifestyle changes (e.g., "canceling that subscription = $20k in 10 years")
- Review quarterly and adjust based on actual performance
`
  },
  {
    title: "Importing Data",
    content: `
## Importing Financial Data

### CSV Import (Primary Method)
The import system uses AI to parse any CSV or Excel format from your bank. Here's how:

1. Log in to your bank's website
2. Navigate to the transactions/activity section
3. Download as CSV or Excel
4. In BetterBudget, go to **Import** → select the account → upload the file

### How Each Bank Exports

| Bank | Where to Export |
|------|----------------|
| AMEX | Statements & Activity → Download CSV |
| USAA | Banking → Transactions → Download |
| Abound CU | Account → Statement → Download CSV |
| PayPal | Activity → All Transactions → Download |
| Fidelity | Accounts → Activity & Orders → Download |
| Schwab | Accounts → History → Export |

### Duplicate Detection
Every transaction gets a **fingerprint** (hash) based on date + amount + merchant. When you re-import:
- Transactions with matching fingerprints are **automatically skipped**
- This prevents double-counting, especially important for transfers between accounts
- You'll see a summary of how many were imported vs skipped

### Transfer Detection
Transfers between your own accounts (e.g., checking → savings) appear as both a debit and credit. Mark these as **transfer** type to exclude them from income/expense calculations.
`
  },
  {
    title: "Categorization Rules",
    content: `
## Auto-Categorization Engine

### How Rules Work
Rules match merchant names to categories. When you click **Run Rules**, all uncategorized transactions are processed against your rules.

### Creating Rules
1. Go to **Rules** page
2. Click **Add Rule**
3. Enter a pattern (e.g., "NETFLIX"), match type, and target category

### Match Types
- **Contains** — Matches if the merchant name contains the pattern (most common)
- **Starts With** — Matches if merchant name starts with the pattern
- **Exact** — Only matches exact merchant name

### Example Rules
| Pattern | Match Type | Category | Clean Name |
|---------|-----------|----------|------------|
| NETFLIX | contains | Subscriptions | Netflix |
| SPOTIFY | contains | Subscriptions | Spotify |
| AMZN | contains | Shopping | Amazon |
| WHOLE FOODS | contains | Groceries | Whole Foods |
| SHELL | contains | Transportation | Shell Gas |
| FIDELITY | contains | Investments | Fidelity |

### Priority
Higher priority rules are checked first. Use this when patterns might overlap (e.g., "AMAZON PRIME" should be Subscriptions, while "AMAZON" is Shopping).

### Merchant Cleaning
The optional **Clean Name** field normalizes messy bank descriptions like "NETFLIX.COM 800-XXX-XXXX CA" into just "Netflix".
`
  },
  {
    title: "Budget Tracking",
    content: `
## Budget vs Actual

### Setting Budgets
1. Go to **Budget** page
2. Click **Add Budget** for each spending category
3. Set a monthly dollar limit

### How It Works
- Budgets compare your **actual spending** (from imported transactions) against your **monthly limit**
- Progress bars show how much you've used
- Red indicates over-budget, green indicates remaining funds

### Recommended Budget Categories (50/30/20 Rule)
For your strong income at 26, consider:
- **Needs (50%)**: Housing, Utilities, Insurance, Healthcare, Groceries, Transportation
- **Wants (30%)**: Entertainment, Shopping, Food & Dining, Travel, Subscriptions
- **Savings/Investing (20%+)**: Since you're focused on FI, aim for 30-50% savings rate

### Tips
- Start with 5-8 key categories rather than trying to budget everything
- Review monthly and adjust limits based on actual spending patterns
- The savings rate on your Dashboard automatically calculates (Income - Expenses) / Income
`
  },
  {
    title: "Architecture & Security",
    content: `
## System Architecture

### High-Level Architecture
\`\`\`
[Bank Exports] → [AI Parser] → [Duplicate Detection] → [Database]
                                                                    ↓
[Dashboard] ← [Query Engine] ← [Rule Engine] ← [Categorization Rules]
\`\`\`

### Data Flow
1. **Ingestion**: CSV files uploaded → AI extracts structured data
2. **Processing**: Duplicate detection → Rule-based categorization → Type classification
3. **Storage**: Encrypted database with standardized transaction schema
4. **Presentation**: Real-time dashboards, charts, and reports

### Database Schema
- **Account** — Institution, type, balance, asset/liability flag
- **Transaction** — Date, merchant, amount, category, account reference, review flags
- **Budget** — Category + monthly limit
- **Investment** — Symbol, shares, cost basis, current value
- **NetWorthSnapshot** — Point-in-time financial position
- **FinancialGoal** — Target amount, progress, timeline
- **CategoryRule** — Pattern matching rules for auto-categorization

### Security
- All data encrypted at rest and in transit
- No bank credentials stored in BetterBudget
- Hashed transaction fingerprints (never raw account numbers)
- Only last 4 digits of account numbers stored

### Duplicate Detection Logic
\`\`\`
hash = sha(date + "|" + amount + "|" + merchant_raw)
if hash exists in account transactions → skip
\`\`\`

### Scalability
- Entity-based architecture supports unlimited accounts and transactions
- Rule engine processes in priority order for efficient categorization
- Snapshot-based net worth tracking grows with your financial complexity
- Investment tracking supports any asset class (stocks, bonds, real estate, crypto)
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
      <PageHeader title="Documentation" subtitle="How to use your personal finance app" />

      <div className="space-y-2">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
            <button
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-slate-900">{section.title}</span>
              </div>
              {openSections.has(idx) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>
            {openSections.has(idx) && (
              <div className="px-5 pb-6 pt-0">
                <div className="prose prose-sm prose-slate max-w-none [&_table]:text-xs [&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-2 [&_table]:border [&_th]:border [&_td]:border [&_th]:bg-slate-50">
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