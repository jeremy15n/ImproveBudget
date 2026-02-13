# ImproveBudget API Documentation

## Overview

The ImproveBudget API is a RESTful API built with Node.js/Express that provides a complete interface for managing personal finances. All data is stored locally in a SQLite database file.

**Base URL:** `http://localhost:8000/api`
**Database Location:** `backend/data/budget.db` (auto-created on first run)
**Technology:** Node.js, Express, SQLite (sql.js)

## Table of Contents

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Entity Endpoints](#entity-endpoints)
- [File Upload](#file-upload)
- [Query Parameters](#query-parameters)
- [Examples](#examples)

## Authentication

*Note: Authentication is not yet implemented. All endpoints are currently open.*

Future implementations will use JWT tokens passed in the Authorization header:
```
Authorization: Bearer <token>
```

## Response Format

All successful responses return a JSON object or array:

### Success Response
```json
{
  "id": 1,
  "date": "2025-01-15",
  "merchant_raw": "Whole Foods",
  "amount": -45.32,
  "category": "groceries",
  "account_id": 1,
  ...
}
```

### Error Response
```json
{
  "error": true,
  "message": "Human-readable error message",
  "detail": "Additional details (in development mode)"
}
```

### HTTP Status Codes
- `200` - OK (successful GET, PUT)
- `201` - Created (successful POST)
- `400` - Bad Request (validation error)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Error Handling

Common error scenarios:

### Validation Error (400)
```json
{
  "error": true,
  "message": "Request body is required"
}
```

### Not Found (404)
```json
{
  "error": true,
  "message": "transaction not found",
  "id": 999
}
```

### Duplicate Entry (400)
```json
{
  "error": true,
  "message": "Duplicate entry",
  "detail": "A record with this value already exists"
}
```

### Invalid Reference (400)
```json
{
  "error": true,
  "message": "Invalid reference",
  "detail": "Referenced record does not exist"
}
```

## Entity Endpoints

All entities follow the same RESTful pattern. The following entities are available:

- `transaction` - Individual transactions
- `account` - Financial accounts
- `budget` - Monthly budgets
- `categoryrule` - Auto-categorization rules
- `financialgoal` - Financial goals
- `investment` - Investment holdings
- `networthsnapshot` - Net worth snapshots

### List Entities

```
GET /api/{entity}
```

Returns an array of entities with optional filtering and sorting.

**Query Parameters:**
- `sort_by` - Field name to sort by
- `sort_order` - Sort direction: `asc` or `desc` (default: `asc`)
- `limit` - Maximum number of records to return
- `{field}` - Filter by field equality (e.g., `category=groceries`)
- `{field}_gte` - Filter by field >= value (e.g., `amount_gte=100`)
- `{field}_lte` - Filter by field <= value (e.g., `amount_lte=100`)
- `{field}_like` - Filter by field LIKE value (e.g., `merchant_raw_like=%amazon%`)

**Example:**
```bash
GET /api/transaction?sort_by=date&sort_order=desc&limit=50&category=groceries
```

**Response (200):**
```json
[
  {
    "id": 1,
    "date": "2025-01-15",
    "merchant_raw": "Whole Foods",
    "merchant_clean": "Whole Foods",
    "amount": -45.32,
    "category": "groceries",
    "account_id": 1,
    "account_name": "Chase Checking",
    "type": "expense",
    "is_reviewed": false,
    "is_flagged": false,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
]
```

### Get Single Entity

```
GET /api/{entity}/{id}
```

Returns a single entity by ID.

**Example:**
```bash
GET /api/transaction/1
```

**Response (200):**
```json
{
  "id": 1,
  "date": "2025-01-15",
  ...
}
```

**Response (404):**
```json
{
  "error": true,
  "message": "transaction not found",
  "id": 1
}
```

### Create Entity

```
POST /api/{entity}
```

Creates a new entity. Request body should contain the entity data.

**Example:**
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

**Response (201):**
```json
{
  "id": 1,
  "date": "2025-01-15",
  "merchant_raw": "Whole Foods",
  "amount": -45.32,
  "category": "groceries",
  "account_id": 1,
  ...
}
```

### Bulk Create Entities

```
POST /api/{entity}/bulk
```

Creates multiple entities in a single request. Request body should contain `items` array.

**Example:**
```bash
curl -X POST http://localhost:8000/api/transaction/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "date": "2025-01-15",
        "merchant_raw": "Whole Foods",
        "amount": -45.32,
        "category": "groceries",
        "account_id": 1
      },
      {
        "date": "2025-01-14",
        "merchant_raw": "Shell Gas",
        "amount": -55.00,
        "category": "transportation",
        "account_id": 1
      }
    ]
  }'
```

**Response (201):**
```json
{
  "created": 2,
  "ids": [1, 2]
}
```

### Update Entity

```
PUT /api/{entity}/{id}
```

Updates an existing entity. Request body should contain only the fields to update.

**Example:**
```bash
curl -X PUT http://localhost:8000/api/transaction/1 \
  -H "Content-Type: application/json" \
  -d '{
    "category": "groceries",
    "notes": "Weekly shopping",
    "is_reviewed": true
  }'
```

**Response (200):**
```json
{
  "id": 1,
  "date": "2025-01-15",
  "merchant_raw": "Whole Foods",
  "amount": -45.32,
  "category": "groceries",
  "notes": "Weekly shopping",
  "is_reviewed": true,
  ...
}
```

### Delete Entity

```
DELETE /api/{entity}/{id}
```

Deletes an entity by ID.

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/transaction/1
```

**Response (200):**
```json
{
  "deleted": true,
  "id": 1
}
```

## File Upload

### Upload File

```
POST /api/upload
```

Uploads a CSV file for parsing. Returns a file ID for use with `/extract`.

**Request:**
```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@transactions.csv"
```

**Response (201):**
```json
{
  "file_id": "file_1735689000_abc123xyz",
  "filename": "transactions.csv",
  "size": 15234,
  "mimetype": "text/csv"
}
```

**Constraints:**
- Maximum file size: 10MB (configurable via `MAX_FILE_SIZE`)
- Supported formats: CSV, Excel (.xlsx, .xls)
- Files expire after 1 hour

### Extract Data

```
POST /api/extract
```

Parses uploaded CSV file and returns transactions ready for import. Automatically detects bank format.

**Request:**
```bash
curl -X POST http://localhost:8000/api/extract \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "file_1735689000_abc123xyz",
    "account_id": 1
  }'
```

**Response (200):**
```json
{
  "rows": [
    {
      "date": "2025-01-15",
      "merchant_raw": "Whole Foods",
      "merchant_clean": "Whole Foods",
      "amount": -45.32,
      "category": "uncategorized",
      "type": "expense",
      "account_id": 1,
      "import_hash": "abc123xyz"
    }
  ],
  "total": 1,
  "format_detected": "amex"
}
```

### Import Transactions

```
POST /api/import
```

Combined endpoint that uploads, parses, and imports transactions in one request. Automatically detects and skips duplicates.

**Request:**
```bash
curl -X POST http://localhost:8000/api/import \
  -F "file=@transactions.csv" \
  -F "account_id=1"
```

**Response (201):**
```json
{
  "imported": 25,
  "duplicates": 3,
  "total": 28,
  "ids": [1, 2, 3, ...]
}
```

## Supported Bank Formats

The CSV import feature auto-detects and supports the following bank formats:

### AMEX (American Express)
**Required Headers:** Posting Date, Amount, Description, Reference Number

**Example CSV:**
```
Posting Date,Reference Number,Description,Amount
01/15/2025,123456789,WHOLE FOODS MARKET,-45.32
01/14/2025,123456788,SHELL GAS STATION,-55.00
```

### USAA
**Required Headers:** Transaction Date, Posting Date, Description, Amount

**Example CSV:**
```
Transaction Date,Posting Date,Description,Amount
01/15/2025,01/15/2025,WHOLE FOODS MARKET,-45.32
01/14/2025,01/14/2025,DEPOSIT PAYCHECK,+2500.00
```

### PayPal Savings
**Required Headers:** Date, Name, Net

**Example CSV:**
```
Date,Name,Net
2025-01-15,Withdrawal to Bank,+500.00
2025-01-14,Interest,+0.45
```

### Abound Credit Union
**Required Headers:** Transaction Date, Description, Amount

**Example CSV:**
```
Transaction Date,Description,Amount
01/15/2025,WHOLE FOODS MARKET,-45.32
01/14/2025,SALARY DEPOSIT,+2500.00
```

### Fidelity / Schwab
**Required Headers:** Symbol, Quantity/Shares, Price

Typically used for investment holdings.

## Query Parameters

### Sorting

Use `sort_by` with optional `sort_order`:

```
GET /api/transaction?sort_by=date&sort_order=desc
GET /api/transaction?sort_by=amount&sort_order=asc
```

**Default:** Ascending order

### Filtering

#### Exact Match
```
GET /api/transaction?category=groceries&type=expense
```

#### Greater Than or Equal (>=)
```
GET /api/transaction?amount_gte=100&date_gte=2025-01-01
```

#### Less Than or Equal (<=)
```
GET /api/transaction?amount_lte=50&date_lte=2025-01-31
```

#### Pattern Match (LIKE)
```
GET /api/transaction?merchant_raw_like=%whole%
```

### Limiting Results

```
GET /api/transaction?limit=50
GET /api/transaction?sort_by=-date&limit=10
```

## Examples

### Get Recent Expenses

```bash
curl "http://localhost:8000/api/transaction?sort_by=date&sort_order=desc&category=groceries&limit=10"
```

### Get Accounts by Institution

```bash
curl "http://localhost:8000/api/account?institution=chase&is_active=1"
```

### Filter Transactions by Date Range

```bash
curl "http://localhost:8000/api/transaction?date_gte=2025-01-01&date_lte=2025-01-31&sort_by=date"
```

### Create Account

```bash
curl -X POST http://localhost:8000/api/account \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chase Checking",
    "institution": "chase",
    "account_type": "checking",
    "balance": 5000.00,
    "is_asset": true,
    "is_active": true
  }'
```

### Create Budget

```bash
curl -X POST http://localhost:8000/api/budget \
  -H "Content-Type: application/json" \
  -d '{
    "category": "groceries",
    "monthly_limit": 400.00,
    "month": "2025-01",
    "is_active": true
  }'
```

### Create Categorization Rule

```bash
curl -X POST http://localhost:8000/api/categoryrule \
  -H "Content-Type: application/json" \
  -d '{
    "match_pattern": "whole",
    "match_type": "contains",
    "category": "groceries",
    "merchant_clean_name": "Whole Foods",
    "is_active": true,
    "priority": 1
  }'
```

## Rate Limiting

*Not yet implemented. All endpoints are currently unlimited.*

## Webhooks

*Not yet implemented.*

## Changelog

### Version 1.0.0 (2025-01-15)
- Initial release
- Basic CRUD operations for all entities
- CSV import with bank format detection
- Duplicate transaction detection

---

For more information, see the main [README.md](../README.md).
