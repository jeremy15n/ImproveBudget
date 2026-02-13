# ImproveBudget Architecture

This document describes the technical architecture of the ImproveBudget application.

## Overview

ImproveBudget is a full-stack personal finance application with a React frontend and Node.js/Express backend. It's designed to be completely local and portable, with no external service dependencies.

```
┌─────────────────────────────────────────────────┐
│          Browser (http://localhost:5173)        │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │        React SPA (Vite)                   │  │
│  │                                           │  │
│  │  Pages → Components → TanStack Query     │  │
│  │         ↓           ↓                     │  │
│  │      Tailwind CSS   apiClient.js         │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
           ↓ HTTP/REST (CORS)
    ┌──────────────────────────────────────────┐
    │  Node.js/Express (localhost:8000)        │
    │                                          │
    │  ┌──────────────────────────────────┐   │
    │  │  Routes                           │   │
    │  │  ↓                                │   │
    │  │  Controllers                      │   │
    │  │  ├─ Entity CRUD                   │   │
    │  │  └─ File Upload/Import            │   │
    │  │  ↓                                │   │
    │  │  Services                         │   │
    │  │  ├─ Database Service              │   │
    │  │  ├─ CSV Service                   │   │
    │  │  └─ Categorization Service        │   │
    │  │  ↓                                │   │
    │  │  Database                         │   │
    │  │  └─ SQLite (better-sqlite3)       │   │
    │  └──────────────────────────────────┘   │
    │                                          │
    │  File: budget.db                        │
    └──────────────────────────────────────────┘
```

## Tech Stack

### Frontend

**Framework & Build:**
- **React 18** - Component-based UI framework
- **Vite 6** - Fast build tool with HMR (Hot Module Replacement)
- **React Router v6** - Client-side routing

**State & Data Management:**
- **TanStack Query (React Query)** - Server state management and caching
- **React Hook Form** - Form state management
- **Zod** - Schema validation

**UI & Styling:**
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible component library (Radix UI primitives)
- **Lucide React** - Icon library

**Other:**
- **Framer Motion** - Animation library
- **date-fns** - Date manipulation
- **Recharts** - Data visualization

### Backend

**Framework & Server:**
- **Node.js 18+** - JavaScript runtime
- **Express 4** - Web framework
- **CORS** - Cross-origin resource sharing

**Database:**
- **SQLite 3** - Lightweight, file-based database
- **better-sqlite3** - Fast, synchronous SQLite driver

**Data Processing:**
- **papaparse** - CSV parser with auto-detection
- **multer** - File upload middleware

## Frontend Architecture

### Directory Structure

```
src/
├── main.jsx                    # Entry point
├── pages/                      # Page components
│   ├── Dashboard.jsx
│   ├── Transactions.jsx
│   ├── Accounts.jsx
│   ├── Budget.jsx
│   ├── Investments.jsx
│   ├── Goals.jsx
│   ├── Import.jsx
│   └── ...
├── components/                 # Reusable components
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.jsx
│   │   ├── input.jsx
│   │   ├── card.jsx
│   │   └── ...
│   ├── dashboard/              # Feature-specific components
│   ├── transactions/
│   ├── accounts/
│   ├── shared/
│   └── import/
├── api/                        # API client layer
│   └── apiClient.js           # Generic REST API client
├── lib/                        # Utilities
│   ├── query-client.js        # TanStack Query config
│   ├── AuthContext.jsx        # Auth state
│   ├── app-params.js          # App configuration
│   └── ...
└── hooks/                      # Custom React hooks
```

### Data Flow

1. **User Interaction** → Component event handler
2. **API Call** → `apiClient.entities.{Entity}.{method}()`
3. **HTTP Request** → Express backend on `localhost:8000/api`
4. **TanStack Query** → Caches response, manages state
5. **Re-render** → Component displays updated data

### Example: Fetching Transactions

```javascript
// Component
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';

function Transactions() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiClient.entities.Transaction.list('-date', 100)
  });

  // Render transactions...
}
```

### API Client Pattern

The `apiClient` in `src/api/apiClient.js` provides a generic Entity-based interface:

```javascript
// Available methods on each entity
apiClient.entities.Transaction.list(sortField, limit)
apiClient.entities.Transaction.filter(conditions, sortField, limit)
apiClient.entities.Transaction.create(data)
apiClient.entities.Transaction.update(id, data)
apiClient.entities.Transaction.delete(id)
apiClient.entities.Transaction.bulkCreate(items)
```

## Backend Architecture

### Directory Structure

```
backend/
├── src/
│   ├── server.js               # Entry point
│   ├── app.js                  # Express config
│   ├── config/
│   │   └── database.js         # Database connection
│   ├── db/
│   │   ├── schema.sql          # Database schema
│   │   └── migrations/         # Future migrations
│   ├── routes/
│   │   ├── index.js            # Route aggregator
│   │   ├── entity.routes.js    # Generic CRUD routes
│   │   └── upload.routes.js    # File upload routes
│   ├── controllers/
│   │   ├── entity.controller.js # CRUD logic
│   │   └── upload.controller.js # Upload/import logic
│   ├── services/
│   │   ├── database.service.js # Database operations
│   │   └── csv.service.js      # CSV parsing
│   └── middleware/
│       ├── errorHandler.js     # Error handling
│       └── cors.js             # CORS config
├── data/
│   └── budget.db               # SQLite database (auto-created)
├── uploads/                    # Temporary upload directory
└── package.json
```

### Request Flow

```
Request → Express Middleware (CORS, JSON parsing)
  ↓
Route Matching (entity.routes.js)
  ↓
Entity Validation Middleware
  ↓
Controller (entity.controller.js)
  ↓
Service Layer (database.service.js)
  ↓
Database (SQLite)
  ↓
Response → Error Handler (if error) → JSON Response
```

### Database Service

The `DatabaseService` in `backend/src/services/database.service.js` provides generic CRUD operations:

```javascript
// Available methods
dbService.list(table, filters, sort, limit)
dbService.getById(table, id)
dbService.create(table, data)
dbService.bulkCreate(table, items)
dbService.update(table, id, data)
dbService.delete(table, id)
dbService.raw(sql, params)  // For complex queries
```

**Key Features:**
- Parameterized queries (SQL injection prevention)
- Dynamic WHERE clause building
- Support for operators: `_gte`, `_lte`, `_like`
- Automatic timestamp management (`created_at`, `updated_at`)

### CSV Import Pipeline

```
Upload File
  ↓
Store in Memory
  ↓
Parse CSV (papaparse)
  ↓
Detect Bank Format
  ↓
Extract Transactions
  ↓
Generate Import Hashes
  ↓
Check for Duplicates
  ↓
Bulk Insert
  ↓
Return Results
```

**Supported Formats:** AMEX, USAA, PayPal, Abound, Fidelity, Schwab

**Duplicate Detection:**
- Uses `import_hash` field on transactions
- Hash is generated from: `date|amount|merchant_raw`
- Same algorithm used in frontend and backend for consistency

## Database Schema

### Core Tables

**accounts** - Financial accounts
- Fields: name, institution, account_type, balance, is_active
- Indexes: is_active, institution

**transactions** - Individual transactions
- Fields: date, merchant_raw, merchant_clean, amount, category, account_id, type, flags, notes, import_hash
- Unique: import_hash (for duplicate detection)
- Indexes: date, account_id, category, import_hash

**budgets** - Monthly budget limits
- Fields: category, monthly_limit, month, is_active, rollover
- Unique: category + month

**categoryrules** - Auto-categorization rules
- Fields: match_pattern, match_type, category, priority, is_active
- Indexes: is_active, priority

**financialgoals** - Financial goals
- Fields: name, target_amount, current_amount, target_date, category, is_active

**investments** - Investment holdings
- Fields: symbol, name, account_id, asset_class, shares, current_value, gain_loss

**networthsnapshots** - Historical net worth
- Fields: date, total_assets, total_liabilities, net_worth, month
- Indexes: date, month

All tables include `created_at` and `updated_at` timestamps.

### Relationships

- **transactions.account_id** → **accounts.id** (ON DELETE SET NULL)
- **investments.account_id** → **accounts.id** (ON DELETE SET NULL)

## Security Considerations

### SQL Injection Prevention
- All queries use parameterized statements
- No string concatenation in SQL queries
- User input validated before database operations

### File Upload Security
- File type validation (only CSV/Excel)
- File size limit (10MB default)
- Files stored in memory, auto-deleted after 1 hour
- No execution of uploaded content

### CORS
- Only allows requests from localhost (development) or configured domain (production)
- Credentials not sent cross-origin

### Future: Authentication
- Planned but not implemented
- Will use JWT tokens in Authorization header
- Stored securely (httpOnly cookies recommended)

## Performance Optimizations

### Frontend
- **Code Splitting:** Routes lazy-loaded via React Router
- **Image Optimization:** Lucide icons are SVG (small footprint)
- **Caching:** TanStack Query caches queries
- **Bundling:** Vite provides tree-shaking and code splitting

### Backend
- **Indexing:** Strategic indexes on frequently queried fields
- **In-Memory Files:** Uploaded files stored in memory temporarily
- **Prepared Statements:** Reused across requests
- **Synchronous Database:** better-sqlite3 avoids async overhead for local DB

## Environment

### Development
```
Frontend: http://localhost:5173
Backend:  http://localhost:8000/api
Database: ./backend/data/budget.db (auto-created)
```

### Production
```
Frontend: Built to /dist, served from backend
Backend:  Configurable port (default 8000)
Database: Configurable path (default ./data/budget.db)
```

## Data Models

All data models are defined in the `entities/` folder as JSON schemas:

```javascript
// entities/Transaction.js
{
  name: "Transaction",
  type: "object",
  properties: { ... },
  required: ["date", "amount"]
}
```

These schemas are used for:
1. Frontend validation (React Hook Form + Zod)
2. Backend type hints (JSDoc comments)
3. Database schema generation (reflected in schema.sql)

## Deployment Considerations

### Single File Database
- SQLite database is a single file (`budget.db`)
- Easy to backup and restore
- No database server needed

### Portability
- Works on Windows, Mac, Linux
- No system dependencies (except Node.js)
- All configuration via `.env` files

### Scaling Limitations
- SQLite is single-threaded
- Not suitable for high-concurrency applications
- Recommended for personal use (single user or small team)

### Future: Scaling
To scale beyond single-user:
1. Migrate to PostgreSQL/MySQL
2. Implement connection pooling
3. Add database migrations system
4. Implement authentication/authorization
5. Add activity logging and audit trail

## Monitoring & Debugging

### Backend Logging
```javascript
// Server logs requests and errors
console.log('✓ Server running on http://localhost:8000');
console.log('Error:', errorMessage);
```

### Frontend DevTools
- React Developer Tools
- Redux DevTools (for TanStack Query inspection)
- Browser Network tab for API calls

### Database Inspection
```bash
# Open database in SQLite CLI
sqlite3 backend/data/budget.db

# Common queries
SELECT name FROM sqlite_master WHERE type='table';
SELECT COUNT(*) FROM transactions;
SELECT * FROM transactions ORDER BY date DESC LIMIT 10;
```

## Testing Strategy

### Frontend Testing (Not Yet Implemented)
- Unit tests: Components and hooks
- Integration tests: Page-level interactions
- E2E tests: Full user workflows

### Backend Testing (Not Yet Implemented)
- Unit tests: Service layer
- Integration tests: API endpoints
- Load tests: Database performance

### Manual Testing
- Import CSV files from sample banks
- Verify duplicate detection
- Test filtering and sorting
- Check responsive design on mobile

## Future Enhancements

1. **Authentication & Multi-User**
   - User registration/login
   - Role-based access control
   - Data isolation per user

2. **Real-Time Sync**
   - WebSocket for live updates
   - Conflict resolution
   - Offline-first with sync

3. **Advanced Features**
   - Plaid integration for auto-sync
   - Machine learning for categorization
   - Bill reminders and alerts
   - Recurring transaction detection

4. **Performance**
   - Database query optimization
   - Caching layer (Redis)
   - Pagination for large datasets

5. **Mobile App**
   - React Native implementation
   - Offline support
   - Push notifications

---

For more details, see [README.md](README.md) and [backend/API.md](backend/API.md).
