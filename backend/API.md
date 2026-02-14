# BetterBudget API Documentation

## Overview

RESTful API built with Node.js/Express for managing personal finances. All data is stored locally in SQLite.

**Base URL:** `http://localhost:8000/api`
**Database:** `backend/data/budget.db` (auto-created on first run)

## Response Format

### Success
```json
{ "id": 1, "date": "2025-01-15", "amount": -45.32, ... }
```

### Paginated Success (when `page` param is used)
```json
{
  "data": [ { "id": 1, ... }, ... ],
  "meta": { "total": 150, "page": 1, "limit": 50, "totalPages": 3 }
}
```

### Error
```json
{ "error": true, "message": "Human-readable error message" }
```

### HTTP Status Codes
- `200` — OK (GET, PUT)
- `201` — Created (POST)
- `400` — Bad Request (validation error)
- `404` — Not Found
- `500` — Internal Server Error

---

## Entity Endpoints

All entities follow the same RESTful pattern:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{entity}` | List/filter entities |
| GET | `/api/{entity}/{id}` | Get single entity |
| POST | `/api/{entity}` | Create entity |
| POST | `/api/{entity}/bulk` | Bulk create |
| PUT | `/api/{entity}/{id}` | Update entity |
| PUT | `/api/{entity}/bulk-update` | Bulk update by IDs |
| DELETE | `/api/{entity}/{id}` | Delete entity |
| POST | `/api/{entity}/bulk-delete` | Bulk delete by IDs |

### Supported Entities

| Entity | Table | Description |
|--------|-------|-------------|
| `transaction` | transactions | Individual transactions (types: income, expense, savings, transfer, refund) |
| `account` | accounts | Financial accounts (checking, savings, credit, brokerage, retirement) |
| `budget` | budgets | Monthly spending limits by category |
| `category` | categories | Customizable spending categories with colors |
| `categoryrule` | categoryrules | Auto-categorization rules (pattern matching) |
| `financialgoal` | financialgoals | Financial goals with progress tracking |
| `investment` | investments | Investment holdings (stocks, ETFs, bonds) |
| `networthsnapshot` | networthsnapshots | Point-in-time net worth history |

---

## Query Parameters

### Pagination (opt-in)

When `page` is included, the response switches from a plain array to `{ data, meta }`.

| Param | Description |
|-------|-------------|
| `page` | Page number (1-based). Enables paginated response. |
| `limit` | Items per page (default 50, max 500) |

```
GET /api/transaction?page=1&limit=50&sort_by=date&sort_order=desc
```

**Response:**
```json
{
  "data": [ ... ],
  "meta": { "total": 342, "page": 1, "limit": 50, "totalPages": 7 }
}
```

Without `page`, the response is a plain array (backwards compatible).

### Sorting

| Param | Description |
|-------|-------------|
| `sort_by` | Field name to sort by |
| `sort_order` | `asc` (default) or `desc` |

### Filtering

| Pattern | Description | Example |
|---------|-------------|---------|
| `{field}=value` | Exact match | `category=groceries` |
| `{field}_gte=value` | Greater than or equal | `date_gte=2025-01-01` |
| `{field}_lte=value` | Less than or equal | `date_lte=2025-01-31` |
| `{field}_like=value` | LIKE match (auto-wraps with %) | `merchant_raw_like=amazon` |
| `search=value` | Multi-field text search (merchant_raw, merchant_clean, notes) | `search=whole foods` |

### Limiting (non-paginated mode)

```
GET /api/transaction?limit=50
```

---

## Bulk Operations

### Bulk Update

```
PUT /api/{entity}/bulk-update
```

**Body:**
```json
{ "ids": [1, 2, 3], "data": { "category": "groceries" } }
```

**Response:**
```json
{ "updated": 3 }
```

### Bulk Delete

```
POST /api/{entity}/bulk-delete
```

**Body:**
```json
{ "ids": [1, 2, 3] }
```

**Response:**
```json
{ "deleted": 3 }
```

---

## Report Endpoints

### Cash Flow

```
GET /api/reports/cash-flow
```

Aggregated income, expenses, and savings grouped by time interval within a date range.

| Param | Description |
|-------|-------------|
| `startDate` | Start date `YYYY-MM-DD` (e.g., `2025-01-01`) |
| `endDate` | End date `YYYY-MM-DD` (e.g., `2025-12-31`) |
| `interval` | `month` (default) or `year` |

Transactions with `type='transfer'` are excluded. Transactions with `type='savings'` are aggregated into a separate `savings` bucket.

**Monthly example:** `GET /api/reports/cash-flow?startDate=2025-01-01&endDate=2025-12-31&interval=month`

**Response:**
```json
[
  { "period": "2025-01", "label": "2025-01", "income": 5200, "expenses": 3100, "savings": 500, "net": 1600 },
  { "period": "2025-02", "label": "2025-02", "income": 5200, "expenses": 2800, "savings": 600, "net": 1800 }
]
```

**Yearly example:** `GET /api/reports/cash-flow?interval=year`

**Response:**
```json
[
  { "period": "2024", "label": "2024", "income": 62000, "expenses": 38000, "savings": 6000, "net": 18000 },
  { "period": "2025", "label": "2025", "income": 10400, "expenses": 5900, "savings": 1100, "net": 3400 }
]
```

### Available Years

```
GET /api/reports/years
```

Returns years that have transaction data.

**Response:**
```json
["2024", "2025"]
```

---

## Investment Endpoints

### Refresh Prices

```
POST /api/investments/refresh
```

Fetches live market data and updates all investment holdings with current prices.

**Response:**
```json
{ "updated": 5, "errors": [] }
```

### Get Quote

```
GET /api/investments/quote/{symbol}
```

Get live price data for a stock/ETF symbol.

**Response:**
```json
{ "symbol": "VOO", "price": 485.32, "name": "Vanguard S&P 500 ETF" }
```

---

## Account Endpoints

### Sync Balances

```
POST /api/accounts/sync-balances
```

Recalculates account balances from investment holdings (for brokerage/retirement accounts).

---

## File Upload & Import

### Upload File

```
POST /api/upload
```

Upload a CSV file. Returns a `file_id` for use with `/extract`.

- Max file size: 10MB
- Formats: CSV, Excel (.xlsx, .xls)
- Files auto-expire after 1 hour

### Extract Data

```
POST /api/extract
```

Parse an uploaded CSV and return structured transactions. Auto-detects bank format.

**Body:**
```json
{ "file_id": "file_xxx", "account_id": 1 }
```

### Import Transactions

```
POST /api/import
```

Combined upload + parse + import in one request.

**Request:** multipart/form-data with `file` and `account_id` fields.

**Response:**
```json
{ "imported": 25, "duplicates": 0, "total": 25, "ids": [1, 2, 3, ...] }
```

### Supported Bank Formats

| Bank | Auto-detected By |
|------|-----------------|
| AMEX | Posting Date, Reference Number, Description, Amount |
| USAA | Transaction Date, Posting Date, Description, Amount |
| PayPal Savings | Date, Name, Net |
| Abound Credit Union | Transaction Date, Description, Amount |
| Fidelity | Symbol, Quantity, Price |
| Schwab | Symbol, Shares, Price |

---

For setup instructions, see [README.md](../README.md). For architecture details, see [ARCHITECTURE.md](../ARCHITECTURE.md).
