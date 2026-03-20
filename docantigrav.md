# CallFlow — Exhaustive Website Documentation

> Every file, every concept, every flow — nothing missed.

---

## 1. Project Overview

**CallFlow** is a full-stack Call Management / CRM system for tracking customer service calls, assigning work to engineers, managing carry-in repairs, running a sales pipeline with reminders, and generating Excel exports — all with real-time updates.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, TailwindCSS 3, Zustand 5, React Router DOM 7, Socket.io-client, Axios, ExcelJS, react-hot-toast |
| Backend | Node.js, Express 4, TypeScript, Prisma 6 ORM, Socket.io 4, JWT, bcryptjs, Nodemailer, cookie-parser |
| Database | PostgreSQL (Neon free tier) |
| Deployment | Backend → Render, Frontend → Netlify |

---

## 2. Root-Level Files (Project Root)

### Configuration & Scripts

| File | Purpose |
|------|---------|
| [netlify.toml](file:///e:/Deeplatest/netlify.toml) | Netlify deployment config — sets build command and publish directory for frontend |
| [install-cookie-parser.bat](file:///e:/Deeplatest/install-cookie-parser.bat) | Windows batch script to install `cookie-parser` npm package in backend |
| [add-firewall-rules.bat](file:///e:/Deeplatest/add-firewall-rules.bat) | Windows batch script to add firewall rules for network access |
| [test-network.bat](file:///e:/Deeplatest/test-network.bat) | Windows batch script to test network connectivity |
| [migrate-reminder-system.ps1](file:///e:/Deeplatest/migrate-reminder-system.ps1) | PowerShell script to run Prisma generate + db push for the reminder system migration |
| [migrate-sales-share.ps1](file:///e:/Deeplatest/migrate-sales-share.ps1) | PowerShell script to run Prisma migration for making `createdById` nullable in sales share |

### Documentation Files (MD)

| File | What It Documents |
|------|-------------------|
| [README.md](file:///e:/Deeplatest/README.md) | Master project doc: tech stack, setup instructions, all env vars, API endpoints summary, deployment guide, troubleshooting |
| [ADMIN_PORTAL_COMPLETE.md](file:///e:/Deeplatest/ADMIN_PORTAL_COMPLETE.md) | Hidden admin portal at `/secreturl` — separate login, OTP recovery, read-only user view, completely isolated from main app |
| [BACKEND_TESTING_GUIDE.md](file:///e:/Deeplatest/BACKEND_TESTING_GUIDE.md) | 10 structured test cases for the bulk deletion feature: valid/invalid passwords, non-HOST users, non-completed calls, auto-cleanup, email notifications, Socket.io events, database notifications |
| [CLEANUP_SUMMARY.md](file:///e:/Deeplatest/CLEANUP_SUMMARY.md) | Documents removal of all `window.location.reload()` calls and manual state updates, replaced by WebSocket-driven real-time updates |
| [COOKIE_DROPDOWNS_IMPLEMENTATION.md](file:///e:/Deeplatest/COOKIE_DROPDOWNS_IMPLEMENTATION.md) | Cookie-based public access system: 1-hour tokens in `PublicAccessToken` table, auto-cleanup, city/area dropdown population for public sales forms |
| [CUSTOMER_EXPORT_UPDATE.md](file:///e:/Deeplatest/CUSTOMER_EXPORT_UPDATE.md) | Updates to customer export functionality |
| [DC_IMPLEMENTATION_SUMMARY.md](file:///e:/Deeplatest/DC_IMPLEMENTATION_SUMMARY.md) | Delivery Challan (DC) system: 5 new DB fields on Call model, DC selection step during call completion, DC page for HOST/ADMIN, bulk delete validates DC status |
| [DC_QUICK_START.md](file:///e:/Deeplatest/DC_QUICK_START.md) | Quick-start guide for DC feature |
| [DELETION_FEATURE_IMPLEMENTATION.md](file:///e:/Deeplatest/DELETION_FEATURE_IMPLEMENTATION.md) | Complete bulk deletion feature: DeletionHistory model, auto-cleanup (keeps 30 entries), Excel export before delete, email notifications to HOSTs, Socket.io broadcast, two-step confirmation with secret password |
| [DEPLOYMENT_CHECKLIST.md](file:///e:/Deeplatest/DEPLOYMENT_CHECKLIST.md) | Step-by-step deployment checklist for the reminder system: migration, testing (10 manual tests), production deploy to Render/Netlify |
| [DEPLOYMENT_GUIDE.md](file:///e:/Deeplatest/DEPLOYMENT_GUIDE.md) | General deployment guide |
| [EMAIL_PHONE_IMPLEMENTATION.md](file:///e:/Deeplatest/EMAIL_PHONE_IMPLEMENTATION.md) | Adding `email` and `phone` unique fields to User model, updating all forms and API endpoints |
| [EXCEL_EXPORT_FEATURE.md](file:///e:/Deeplatest/EXCEL_EXPORT_FEATURE.md) | HOST-only Excel export with password verification, ExportModal component, [excelExport.js](file:///e:/Deeplatest/frontend/src/utils/excelExport.js) utility functions |
| [FINAL_SUMMARY.md](file:///e:/Deeplatest/FINAL_SUMMARY.md) | Final implementation summary |
| [FRONTEND_IMPLEMENTATION.md](file:///e:/Deeplatest/FRONTEND_IMPLEMENTATION.md) | Frontend bulk deletion: BulkDeleteModal, Dashboard checkboxes, EngineerAnalytics deletion history, Socket.io event handlers |
| [LOCATION_TRACKING_MIGRATION.md](file:///e:/Deeplatest/LOCATION_TRACKING_MIGRATION.md) | Migration for adding GPS tracking fields to SalesLog |
| [LOCATION_TROUBLESHOOTING.md](file:///e:/Deeplatest/LOCATION_TROUBLESHOOTING.md) | GPS/location troubleshooting guide |
| [MOBILE_ACCESS_GUIDE.md](file:///e:/Deeplatest/MOBILE_ACCESS_GUIDE.md) | Guide for mobile device access |
| [NETLIFY_RENDER_DEPLOYMENT.md](file:///e:/Deeplatest/NETLIFY_RENDER_DEPLOYMENT.md) | Specific Netlify + Render deployment instructions |
| [PROJECT_VALIDATION_REPORT.md](file:///e:/Deeplatest/PROJECT_VALIDATION_REPORT.md) | Validation report for the project |
| [QUICK_START_TESTING.md](file:///e:/Deeplatest/QUICK_START_TESTING.md) | Quick-start testing guide |
| [REAL_TIME_IMPLEMENTATION.md](file:///e:/Deeplatest/REAL_TIME_IMPLEMENTATION.md) | Complete WebSocket implementation: 15+ event types (call_created, user_deleted, service_updated, category_deleted, etc.), store handlers, multi-user real-time sync |
| [REMINDER_SYSTEM_SUMMARY.md](file:///e:/Deeplatest/REMINDER_SYSTEM_SUMMARY.md) | Sales reminder system: auto 15-day timer after call/visit, Reminders page, navbar badge with auto-refresh, Call/Visit/Delay actions, delay tracking with username history |
| [REMINDER_MIGRATION.md](file:///e:/Deeplatest/REMINDER_MIGRATION.md) | Migration steps for reminder system DB fields |
| [REMINDER_QUICK_START.md](file:///e:/Deeplatest/REMINDER_QUICK_START.md) | Quick-start for reminder feature |
| [REMINDER_VISUAL_GUIDE.md](file:///e:/Deeplatest/REMINDER_VISUAL_GUIDE.md) | Visual ASCII art guide for reminder UI |
| [ROLE_IMPLEMENTATION.md](file:///e:/Deeplatest/ROLE_IMPLEMENTATION.md) | Role-based access: HOST > ADMIN > USER hierarchy, permissions matrix, HOST limit (max 3), call visibility rules, button permissions |
| [RUN_THIS_TO_FIX.md](file:///e:/Deeplatest/RUN_THIS_TO_FIX.md) | Quick-fix script reference |
| [SALES_SHARE_MIGRATION.md](file:///e:/Deeplatest/SALES_SHARE_MIGRATION.md) | Fix for sales share: made `createdById` nullable so public share forms work without a logged-in user |
| [SECRET_ADMIN_URL.md](file:///e:/Deeplatest/SECRET_ADMIN_URL.md) | Secret admin URL documentation |
| [VISUAL_GUIDE.md](file:///e:/Deeplatest/VISUAL_GUIDE.md) | ASCII art visual guide for secret admin portal login flow, OTP flow, and main app vs admin portal comparison |

---

## 3. Backend — File-by-File (`backend/`)

### 3.1 Configuration Files

| File | Purpose |
|------|---------|
| [package.json](file:///e:/Deeplatest/backend/package.json) | Dependencies: Express, Prisma, Socket.io, JWT, bcryptjs, Nodemailer, cookie-parser. Scripts: `dev` (tsx watch), `build` (tsc), [start](file:///e:/Deeplatest/backend/src/index.ts#3727-3742), `db:push`, `seed`, `seed-host` |
| [tsconfig.json](file:///e:/Deeplatest/backend/tsconfig.json) | TypeScript configuration for the backend compilation |
| [.env](file:///e:/Deeplatest/backend/.env) | Environment variables: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`, `PORT`, `EMAIL_USER`, `EMAIL_PASS`, `SPECIAL_ADMIN_*`, `KEEP_ALIVE_INTERVAL` |
| [.env.example](file:///e:/Deeplatest/backend/.env.example) | Template showing all required/optional env vars |
| [.gitignore](file:///e:/Deeplatest/backend/.gitignore) | Ignores `node_modules`, `dist`, [.env](file:///e:/Deeplatest/backend/.env) |
| [migration.sql](file:///e:/Deeplatest/backend/migration.sql) | Raw SQL migration file for schema changes |

### 3.2 Prisma (`backend/prisma/`)

#### `schema.prisma` — The Complete Database Schema

**12 Models Total:**

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | Authentication & roles | `username` (unique), `password` (bcrypt), `email` (unique), `phone` (unique), `role` (HOST/ADMIN/USER/SALES_EXECUTIVE), `secretPassword` |
| `Call` | Core CRM tickets | `problem`, `category`, `status`, `assignedTo`, `completedBy`, `customerName`, `phone`, `email`, `remark`, `engineerRemark`, `callCount`, `visitedAt`, `visitedBy`, `visitedRemark`, `dcRequired`, `dcStatus`, `dcCompletedBy` |
| `Customer` | Customer directory | `name`, `phone` (unique), `email`, `address`, `outsideCalls`, `carryInServices`, `totalInteractions`, `lastCallDate`, `lastServiceDate` |
| `CarryInService` | Warehouse repairs | `customerName`, `phone`, `category`, `serviceDescription`, `status` (PENDING→COMPLETED→DELIVERED), `completeRemark`, `deliverRemark` |
| `SalesEntry` | Sales leads | `firmName`, `gstNo` (unique), `contactPerson1/2`, `accountContact`, `address`, `city`, `area`, `pincode`, `whatsappNumber`, `reminderDate`, `delayCount`, `delayedBy[]`, `lastActivityDate` |
| `SalesLog` | Sales activity logs | `logType` (VISIT/CALL), `callType`, `remark`, `latitude`, `longitude`, `locationAccuracy` |
| `Notification` | In-app alerts | `userId`, `message`, `type`, `isRead`, `callId` |
| `City` | City master data | `name` (unique), `isActive` |
| `Area` | Area master data | `name`, `cityId` (FK→City), unique per city |
| `Category` | Call category master | `name` (unique), `isActive` |
| `ServiceCategory` | Service category master | `name` (unique), `isActive` |
| `OtpToken` | OTP verification | `email`, `otp`, `token` (unique), `expiresAt`, `used` |
| `DeletionHistory` | Call deletion audit | `deletedBy` (FK→User), `deletedByName`, `callCount` |
| `ServiceDeletionHistory` | Service deletion audit | `deletedBy` (FK→User), `deletedByName`, `serviceCount` |
| `PublicAccessToken` | Public share link tokens | `token` (unique), `expiresAt`, `used` |

### 3.3 Scripts (`backend/scripts/`)

| File | Purpose |
|------|---------|
| `seedHost.js` | Creates an initial HOST user with bcrypt-hashed password using `SEED_HOST_USERNAME`/`SEED_HOST_PASSWORD` env vars |
| `add-gujarat-cities.js` | Seed script to populate Gujarat state cities and areas into the City/Area tables |
| `migrate-cities-areas.js` | Migration script for city/area data restructuring |

### 3.4 Main Server (`backend/src/index.ts`) — 3,787 Lines

This single monolithic file contains **everything**: server setup, middleware, all API routes, WebSocket handling, email sending, and background jobs.

#### Server Infrastructure
- **Express + HTTP Server + Socket.io** — all initialized together
- **Prisma Client** with `withRetry()` wrapper (exponential backoff for P1001 timeouts)
- **Keep-alive system** — pings DB every 4 minutes with `SELECT 1`
- **CORS** — allows all localhost ports + configured production origins
- **Cookie Parser** for public access tokens
- **JSON body parser**

#### Authentication System
- `signToken()` / `verifyToken()` — JWT with 7-day expiry
- `authMiddleware` — extracts Bearer token, verifies, attaches `req.user`
- `requireRole(roles[])` — role-based access guard
- In-memory OTP cache with 1-minute cleanup interval
- In-memory used share tokens set with hourly cleanup

#### Email System (Nodemailer/Gmail)
- `sendOTPEmail()` — 6-digit OTP for password reset
- `sendDeletionNotificationEmail()` — alerts all HOSTs when calls are bulk-deleted
- `sendServiceDeletionNotificationEmail()` — alerts all HOSTs when services are bulk-deleted

#### Background Jobs
- OTP cleanup: every 60 seconds
- Used tokens cleanup: every 60 minutes
- Old notification cleanup: every 60 minutes (deletes >24h old)
- DB health check: every 5 minutes (logs if latency >5s)

#### All 70+ API Routes

**Health:**
- `GET /health` — DB connectivity check with latency measurement

**Authentication (8 routes):**
- `POST /auth/login` — username/password login, returns JWT + user data
- `GET /auth/me` — token validation, returns current user
- `POST /auth/verify-secret` — secondary password check for destructive actions
- `POST /auth/forgot-password` — sends OTP email for password reset
- `POST /auth/verify-otp` — validates OTP code
- `POST /auth/reset-password` — updates `secretPassword` after OTP verification
- `POST /auth/special-admin-login` — env-var-based admin login (no DB)
- `POST /auth/special-admin-verify-secret` / `request-otp` / `verify-otp` / `update-credentials` — full OTP recovery pipeline for special admin

**User Management (4 routes):**
- `GET /users` — list all users (HOST/ADMIN/SPECIAL_ADMIN only)
- `POST /users` — create user with bcrypt + role + email + phone (HOST only, max 3 HOSTs cap)
- `PUT /users/:id` — update user details (HOST/SPECIAL_ADMIN only)
- `DELETE /users/:id` — delete user (HOST/SPECIAL_ADMIN only), emits `user_deleted` Socket event

**Call Management (9 routes):**
- `GET /calls` — fetch all calls (USER sees only own+assigned; HOST/ADMIN sees all)
- `POST /calls` — create call, auto-creates/updates Customer, emits `call_created`
- `PUT /calls/:id` — edit call details (HOST/ADMIN, non-completed only)
- `POST /calls/:id/assign` — assign to engineer (HOST/ADMIN), creates Notification, emits `call_assigned`
- `POST /calls/:id/complete` — mark completed with optional DC selection, emits `call_completed`
- `POST /calls/:id/visited` — mark as visited with remark, emits `call_updated`
- `POST /calls/check-duplicate` — checks if pending call exists for phone+category
- `PUT /calls/:id/increment` — increments `callCount` on existing call
- `POST /calls/bulk-delete` — HOST-only mass deletion with secret password, Excel data return, DeletionHistory record, email to other HOSTs, Socket broadcast

**DC (Delivery Challan) (2 routes):**
- `GET /calls/dc` — fetch calls where `dcRequired=true`
- `POST /calls/:id/complete-dc` — mark DC as completed (HOST/ADMIN)

**Customer Management (6 routes):**
- `GET /customers` — list all customers
- `GET /customers/phone/:phone` — lookup by phone (auto-populate forms)
- `GET /carry-in-customers/phone/:phone` — lookup for carry-in service forms
- `GET /customers/analytics` — aggregated customer statistics
- `GET /customers/directory` — full directory with interaction counts
- `PUT /customers/:id` — update customer info

**Analytics (3 routes):**
- `GET /analytics/engineers` — engineer performance metrics
- `GET /analytics/deletion-history` — last 30 call deletion audit entries
- `GET /analytics/service-deletion-history` — last 30 service deletion audit entries

**Notifications (5 routes):**
- `GET /notifications` — user's notifications
- `GET /notifications/unread-count` — count for bell badge
- `PUT /notifications/:id/read` — mark as read
- `DELETE /notifications/:id` — delete single
- `POST /notifications/bulk-delete` — delete multiple

**Cities/Areas (10 routes):**
- `GET /cities` / `GET /cities/protected` — public vs authenticated city list
- `POST /cities` / `PUT /cities/:id` / `DELETE /cities/:id` — CRUD (HOST/SALES_EXECUTIVE)
- `GET /areas` / `GET /areas/protected` — public vs authenticated area list
- `POST /areas` / `PUT /areas/:id` / `DELETE /areas/:id` — CRUD

**Categories (10 routes):**
- `GET /categories` / `GET /categories/protected` — public vs authenticated
- `POST /categories` / `PUT /categories/:id` / `DELETE /categories/:id` — CRUD (HOST only)
- `GET /service-categories` / `GET /service-categories/protected`
- `POST /service-categories` / `PUT /service-categories/:id` / `DELETE /service-categories/:id`

**Carry-In Services (6 routes):**
- `GET /carry-in-services` — list all
- `POST /carry-in-services` — create, auto-creates/updates Customer
- `PUT /carry-in-services/:id` — edit (HOST/ADMIN)
- `POST /carry-in-services/:id/complete` — mark repaired
- `POST /carry-in-services/:id/deliver` — mark delivered to customer
- `POST /carry-in-services/bulk-delete` — mass delete delivered services

**Public Share (10 routes):**
- `POST /api/public/create-access-token` — creates 1-hour PublicAccessToken
- `GET /api/public/cities` / `GET /api/public/areas` — cookie-protected metadata for public forms
- `POST /share/create-link` — generates JWT share token (24h)
- `POST /share/create-sales-link` — generates sales-specific share token
- `GET /share/:linkId` / `GET /share/sales/:linkId` — validate share links
- `POST /share/:linkId/submit` — public call form submission
- `POST /share/:linkId/submit-service` — public service form submission
- `POST /share/sales/:linkId/submit` — public sales form submission (nullable createdById)

**Sales Pipeline (6 routes):**
- `GET /sales-entries` — list with pagination/filtering
- `GET /sales-entries/:id` — single entry with logs
- `POST /sales-entries` — create new lead
- `POST /sales-entries/:id/visit` — log field visit with GPS, sets reminderDate +15 days
- `POST /sales-entries/:id/call` — log phone call, sets reminderDate +15 days
- `PUT /sales-entries/:id` — edit entry details

---

## 4. Frontend — File-by-File (`frontend/`)

### 4.1 Configuration Files

| File | Purpose |
|------|---------|
| `index.html` | SPA entry point. Title: "Call Manager". Loads `/src/main.jsx` |
| `vite.config.js` | Vite config: React plugin, dev server on `127.0.0.1:5173`, no sourcemaps in prod, polyfills for `buffer`/`process` (needed by ExcelJS) |
| `tailwind.config.js` | Extended Tailwind: fluid spacing/typography/widths using CSS `clamp()`, custom grid templates, fluid utility classes (`container-fluid`, `text-fluid`, `heading-fluid`, `gap-fluid`, `p-fluid`) |
| `postcss.config.cjs` | PostCSS config loading TailwindCSS and Autoprefixer plugins |
| `eslint.config.js` | ESLint config with React hooks and refresh plugins |
| `.env` | `VITE_API_URL=http://localhost:4000` |
| `.env.production` | Production API URL pointing to Render backend |
| `netlify.toml` | Netlify SPA redirect: `/* → /index.html` for client-side routing |

### 4.2 Entry Point (`src/main.jsx`)
Wraps `<App />` with `<StrictMode>` and `<BrowserRouter>` from react-router-dom. Imports `index.css` (Tailwind base).

### 4.3 App Shell (`src/App.jsx`)
- Initializes auth on startup via `useAuthStore.initializeAuth()`
- Initializes WebSocket via `useSocket()` hook
- Shows loading spinner until `isInitialized`
- Conditionally renders `<Navbar />` (hidden on login, admin, share pages)
- **16 Routes** defined (see Section 3.4 routing)

### 4.4 Styles (`src/App.css`, `src/index.css`)
- `index.css`: Tailwind directives (`@tailwind base/components/utilities`)
- `App.css`: Minimal custom overrides

### 4.5 API Layer (`src/api/`)

#### `apiClient.js`
- Creates Axios instance with `baseURL` from `VITE_API_URL` (falls back to localhost:4000 dev / Render prod)
- **Request interceptor**: auto-attaches JWT Bearer token from `authStore`
- **Response interceptor**: handles 401 (auto-logout + redirect to `/login`), silent 404s for customer lookups

### 4.6 State Management (`src/store/`) — 7 Zustand Stores

#### `authStore.js`
- State: `user`, `token`, `isInitialized`
- Actions: `login()` → POST `/auth/login`, stores token in localStorage; `logout()` → clears state; `initializeAuth()` → reads localStorage token, calls `GET /auth/me`
- WebSocket handlers: `handleUserUpdated`, `handleUserDeleted` (auto-logout if current user deleted)

#### `callStore.js`
- State: `calls`, `customers`, `loading`, `error`
- Actions: `createCall()`, `fetchCalls()`, `updateCall()`, `fetchCustomers()`, `updateCustomer()`, `fetchCustomerByPhone()`, `assignCall()`, `completeCall()`, `visitCall()`, `bulkDeleteCalls()`
- WebSocket handlers: `handleCallCreated`, `handleCallUpdated`, `handleCallAssigned`, `handleCallCompleted`, `handleCallsBulkDeleted`

#### `carryInServiceStore.js`
- State: `services`, `loading`, `error`
- Actions: `fetchServices()`, `createService()`, `updateService()`, `completeService()`, `deliverService()`, `fetchCustomerByPhone()`, `bulkDeleteServices()`
- WebSocket handlers: `handleServiceCreated`, `handleServiceUpdated`

#### `salesStore.js`
- State: `entries`, `loading`, `error`
- Actions: `fetchEntries()`, `createEntry()`, `updateEntry()`, `logVisit()` (with GPS), `logCall()`, `fetchEntryDetails()`

#### `categoryStore.js`
- State: `categories`, `loading`
- Actions: `fetchCategories()`, `createCategory()`, `updateCategory()`, `deleteCategory()`
- WebSocket handlers for real-time category CRUD

#### `serviceCategoryStore.js`
- Same pattern as categoryStore but for service categories (`/service-categories`)

#### `dcStore.js`
- State: `dcCalls`, `loading`
- Actions: `fetchDCCalls()` (GET `/calls/dc`), `completeDC()` (POST `/calls/:id/complete-dc`)

### 4.7 Custom Hooks (`src/hooks/`) — 3 Hooks

#### `useSocket.js`
- Connects to backend Socket.io server using `VITE_API_URL`
- Registers user on connect
- Listens for **15+ event types**: `call_created`, `call_updated`, `call_assigned`, `call_completed`, `calls_bulk_deleted`, `user_created`, `user_updated`, `user_deleted`, `user_deleted_broadcast`, `service_created`, `service_updated`, `category_created/updated/deleted`, `service_category_created/updated/deleted`, `dc_completed`
- Routes each event to the appropriate Zustand store handler
- Handles reconnection gracefully

#### `useCitiesAndAreas.js`
- Fetches cities from `GET /cities`
- Fetches areas by city from `GET /areas?cityId=X`
- Provides CRUD functions: `addCity()`, `addArea()`, `updateCity()`, `updateArea()`, `deleteCity()`, `deleteArea()`
- Used by `CategorySettings.jsx` and form components

#### `useClickOutside.js`
- Generic hook that detects clicks outside a ref element — used for closing dropdowns/modals

### 4.8 Utilities (`src/utils/`) — 2 Files

#### `excelExport.js`
- Uses **ExcelJS** library (not xlsx) for browser-side Excel generation
- `exportCallsToExcel(calls)` → generates `Calls_Export_YYYY-MM-DD.xlsx` with formatted columns
- `exportUsersToExcel(users)` → generates `Users_Export_YYYY-MM-DD.xlsx` with call statistics
- `exportServicesToExcel(services)` → generates service export
- Triggers browser download via Blob URL

#### `cities.js`
- Static list of Indian cities and their areas for fallback/initial data

### 4.9 Pages (`src/pages/`) — 16 Page Components

#### `Login.jsx` (2.4KB)
Standard login form. Calls `authStore.login()`. Redirects to `/` on success. Link to "Forgot Password".

#### `ForgotPassword.jsx` (14.7KB)
Multi-step password recovery: enter username → sends OTP to registered email → verify OTP → enter new secret password. Uses `POST /auth/forgot-password`, `/auth/verify-otp`, `/auth/reset-password`.

#### `Dashboard.jsx` (27.2KB)
**Main operational hub.** Features:
- Filter tabs: ALL, MY_CALLS, ASSIGNED_TO_ME, PENDING, ASSIGNED, COMPLETED (role-dependent)
- Search by customer name/phone
- Stat cards showing counts per status
- Toggle between Card/Table view
- `AddCallForm` integration
- Bulk delete UI (HOST only): checkboxes on completed calls, floating action bar, `BulkDeleteModal`
- Export button (HOST only) → `ExportModal`
- `ShareModal` for generating public links
- Secret password verification via native `fetch` for destructive actions

#### `SalesDashboard.jsx` (27.5KB)
Sales pipeline management:
- List/search/filter sales entries (prefix search using `startsWith`)
- Add new entries via `AddSalesEntryForm`
- Edit entries via `EditSalesEntryForm`
- View details via `SalesEntryDetailsModal`
- Share sales links via `SalesShareModal`
- Table/Card toggle
- Secret password verification for sensitive actions

#### `CarryInService.jsx` (65.7KB — largest file)
Comprehensive carry-in service management:
- CRUD for physical device repairs
- Status workflow: PENDING → COMPLETED → DELIVERED
- Customer phone auto-lookup
- Bulk delete delivered services (HOST only with secret password)
- Share service links
- Service category filtering
- Mobile-responsive card/table views

#### `UserManagement.jsx` (40.6KB)
User administration (HOST only, requires secret password):
- List all users with email/phone
- Create new users (HOST/ADMIN/ENGINEER roles)
- Edit user details and roles
- Delete users
- Export users to Excel
- HOST count limit enforcement (max 3)

#### `Profile.jsx` (5KB)
Current user profile display: username, email, phone, role, account creation date.

#### `EngineerAnalytics.jsx` (26.1KB)
Performance metrics (HOST only):
- Engineer assignment/completion statistics
- Call/service deletion history tables (last 30 entries each)
- Service deletion history
- Date-range filtering

#### `CategorySettings.jsx` (21.9KB)
Master data management (HOST only):
- CRUD for Call Categories
- CRUD for Service Categories
- CRUD for Cities and Areas (hierarchical)
- All changes broadcast via WebSocket

#### `CustomerDirectory.jsx` (36.7KB)
Customer CRM directory (HOST only):
- Lists all customers with interaction metrics
- Shows outside calls count, carry-in services count, total interactions
- Customer detail modals with full history
- Edit customer info
- Export to Excel

#### `DCPage.jsx` (19.6KB)
Delivery Challan management (HOST/ADMIN only):
- Lists calls where `dcRequired=true`
- Filter by DC status (PENDING/COMPLETED)
- Complete DC action with remark
- Responsive card/table views

#### `AdminLogin.jsx` (14.5KB)
Hidden admin portal login (`/secreturl`):
- Separate from main login, no navbar
- Authenticates against env vars (not DB)
- Forgot password flow: verify secret → verify email → receive OTP → update credentials
- 2-minute OTP expiry with countdown timer

#### `AdminUserManagement.jsx` (16.4KB)
Admin portal user list (`/secreturl/manage`):
- **Read-only** view of all users
- Add/Edit/Delete users
- No navbar, isolated layout
- Logout returns to admin login

#### `PublicCallForm.jsx` (10.8KB)
Public form for call submission via share link (`/share/:linkId`):
- Validates link token via `GET /share/:linkId`
- Fetches categories from `GET /categories`
- Submits via `POST /share/:linkId/submit`
- No authentication required
- Uses native `fetch` (not apiClient)

#### `PublicServiceForm.jsx` (11KB)
Public form for service submission via share link (`/share-service/:linkId`):
- Same pattern as PublicCallForm but for carry-in services
- Fetches service categories
- Submits via `POST /share/:linkId/submit-service`

#### `PublicSalesForm.jsx` (29.7KB)
Public form for sales entry via share link (`/share/sales/:linkId`):
- Validates link, creates `PublicAccessToken` cookie
- Fetches cities/areas from `GET /api/public/cities` and `/areas` (cookie-protected)
- GST number validation
- Multi-contact person fields
- Submits via `POST /share/sales/:linkId/submit`

### 4.10 Components (`src/components/`) — 23 Components

#### `Navbar.jsx` (12.8KB)
Adaptive navigation bar:
- Shows different links based on role (Dashboard, Sales, Users, Analytics, Customers, Carry-In, DC, Categories)
- Notification bell with unread count
- Reminders badge (auto-refreshes every 60s)
- Mobile hamburger menu
- Username display + logout

#### `ProtectedRoute.jsx` (464B)
Route guard: redirects to `/login` if not authenticated. Optional `allowedRoles` prop.

#### `NotificationBell.jsx` (9.8KB)
Bell icon with dropdown:
- Fetches unread count from `GET /notifications/unread-count`
- Fetches notifications list from `GET /notifications`
- Mark as read, delete individual, bulk delete
- Real-time updates via Socket.io

#### `AddCallForm.jsx` (13.5KB)
Call creation form:
- Customer name, phone, email, address, problem, category
- Auto-populates from existing customer via phone lookup
- Duplicate detection: `POST /calls/check-duplicate` → offers to increment `callCount`
- Category dropdown from store

#### `CallCard.jsx` (32.8KB)
Individual call display card (mobile view):
- Shows all call details with status badges
- Action buttons: Assign, Complete (with DC selection step), Visit, Edit
- Permission-based button visibility
- Complete flow: remark → DC selection (DC/NO DC) → confirm

#### `CallTable.jsx` (48.2KB — largest component)
Tabular call display (desktop view):
- All columns: customer, phone, problem, category, status, assigned to, timestamps
- Inline action buttons
- Checkbox column for bulk selection (HOST, COMPLETED only)
- Sorting and filtering

#### `BulkDeleteModal.jsx` (4.8KB)
Two-step deletion confirmation:
- Step 1: warning + count display
- Step 2: secret password input
- Loading state during API call

#### `CallLogModal.jsx` (3.2KB)
Modal for viewing call activity log.

#### `VisitLogModal.jsx` (5.6KB)
Modal for viewing/adding visit logs with remarks.

#### `ConfirmDialog.jsx` (1.2KB)
Generic confirmation dialog with customizable message and actions.

#### `ExportModal.jsx` (5.9KB)
Export workflow modal:
- Step 1: Choose "Export Filtered" vs "Export All" with record counts
- Step 2: Enter secret password
- Triggers `excelExport.js` utility functions

#### `ShareModal.jsx` (8.4KB)
Share link generator for calls:
- Calls `POST /share/create-link` via native fetch
- Displays generated URL with copy button
- Shows QR-code-style sharing options

#### `ShareServiceModal.jsx` (8.7KB)
Same as ShareModal but generates service form share links.

#### `SalesShareModal.jsx` (14.5KB)
Sales-specific share link generator:
- Calls `POST /share/create-sales-link`
- Enhanced with city/area pre-selection

#### `CustomerDetailsModal.jsx` (10KB)
Customer detail view:
- Fetches customer's call history from `GET /calls`
- Fetches customer's service history from `GET /carry-in-services`
- Shows interaction timeline

#### `EditCustomerModal.jsx` (4.2KB)
Edit customer name, phone, email, address.

#### `CityAreaSelector.jsx` (12.5KB)
Reusable city/area dropdown pair:
- Cascading: selecting city filters areas
- "Add New" inline functionality for both
- Uses `useCitiesAndAreas` hook

#### `AddSalesEntryForm.jsx` (10.3KB)
Sales entry creation form:
- Firm name, GST, contacts, address, city/area, pincode, WhatsApp number
- City/Area selector component
- Validation for all fields

#### `EditSalesEntryForm.jsx` (11.3KB)
Sales entry edit form — same fields as Add with pre-populated values.

#### `SalesEntryCard.jsx` (6.1KB)
Mobile card view for sales entries with key metrics.

#### `SalesEntryDetailsModal.jsx` (14.4KB)
Detailed sales entry view:
- Shows all entry fields
- Activity log (visits and calls with dates)
- Location data for visits (lat/long)
- Delay history

#### `SalesEntryTable.jsx` (8.1KB)
Desktop table view for sales entries.

---

## 5. Key Concepts & Flows

### 5.1 Role-Based Access Control
- **HOST** (max 3): Full admin — creates users, assigns work, edits calls, deletes data, views analytics, exports Excel
- **ADMIN**: Middle tier — assigns work, views all calls, manages DC
- **USER/ENGINEER**: Worker — creates and completes assigned calls
- **SALES_EXECUTIVE**: Sales-specific — manages sales entries, sees reminders
- **SPECIAL_ADMIN**: Environment-variable-based emergency access (no DB user required)

### 5.2 Real-Time WebSocket Architecture
Every CRM action (create/update/delete call, assign, complete, user changes, category changes) emits a Socket.io event. All connected frontend clients receive these events and update Zustand stores automatically — **zero manual refreshes required**.

### 5.3 Public Share Link System
HOSTs/ADMINs can generate time-limited (24h), one-time-use JWT share links. Recipients access public forms without authentication to submit calls, services, or sales entries. For sales forms, a `PublicAccessToken` cookie (1h) enables city/area dropdown population.

### 5.4 Bulk Deletion with Audit Trail
HOST-only power: select completed calls/services → two-step confirmation → secret password → backend hard-deletes records → auto-downloads Excel backup → creates DeletionHistory entry (auto-capped at 30) → emails all other HOSTs → broadcasts Socket.io event → creates Notification for other HOSTs.

### 5.5 Sales Reminder System
After logging a call or visit on a sales entry, `reminderDate` auto-sets to +15 days. When overdue, entries appear on the Reminders page with a navbar badge. Three actions: Call (resets timer), Visit (resets timer), Delay (custom date + increments delay counter with username tracking).

### 5.6 Delivery Challan (DC) Flow
When completing a field call, engineers choose "DC" or "NO DC". DC-required calls appear on the DC page for HOST/ADMIN to process physical paperwork. Bulk delete validates DC status — DC PENDING calls cannot be deleted.

### 5.7 Excel Export System
HOST-only feature using ExcelJS library running entirely in-browser. Supports exporting calls, users, customers, and services to formatted `.xlsx` files with date-stamped filenames. Requires secret password verification before export.

### 5.8 Database Keep-Alive
Neon free-tier PostgreSQL connections timeout frequently. The backend runs a `SELECT 1` ping every 4 minutes and wraps all Prisma operations in a `withRetry()` function with exponential backoff (3 attempts).

---

## 6. Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon) |
| `JWT_SECRET` | ✅ | JWT signing key (32+ chars recommended) |
| `PORT` | ❌ | Server port (default: 4000) |
| `FRONTEND_ORIGIN` | ❌ | CORS allowed origin |
| `EMAIL_USER` | ✅ | Gmail address for sending OTPs/notifications |
| `EMAIL_PASS` | ✅ | Gmail App Password |
| `SPECIAL_ADMIN_USERNAME` | ❌ | Hidden admin username |
| `SPECIAL_ADMIN_PASSWORD` | ❌ | Hidden admin password |
| `SPECIAL_ADMIN_SECRET` | ❌ | Secret key for admin recovery |
| `SPECIAL_ADMIN_EMAIL` | ❌ | Email for admin OTP delivery |
| `KEEP_ALIVE_INTERVAL` | ❌ | DB ping interval in ms (default: 240000) |

### Frontend (`frontend/.env`)
| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_API_URL` | ❌ | Backend API URL (default: localhost:4000 dev, Render URL prod) |

---

## 7. Deployment Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Netlify        │ ──→ │   Render          │ ──→ │   Neon DB     │
│   (Frontend)     │     │   (Backend)       │     │  (PostgreSQL) │
│   React+Vite     │     │   Express+Prisma  │     │              │
│   Static SPA     │     │   Socket.io       │     │              │
└─────────────────┘     └──────────────────┘     └──────────────┘
```

**Build Commands:**
- Frontend: `npm run build` → outputs to `dist/`
- Backend: `npm install && npx prisma generate && npm run build` → outputs to `dist/`

---

*This document covers every single file in the project and every concept documented in the project's markdown files.*
