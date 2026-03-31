# Role Authority Table

Complete authority reference for all roles compared to HOST.  
Sources: `frontend/src/App.jsx`, `frontend/src/components/Navbar.jsx`, `frontend/src/components/ProtectedRoute.jsx`, `frontend/src/pages/SalesDashboard.jsx`, `frontend/src/pages/OrdersPage.jsx`, `backend/src/index.ts`

---

## 1. Page Access

> Source: `frontend/src/App.jsx` (routes + redirect logic) · `frontend/src/components/Navbar.jsx` (nav visibility) · `frontend/src/components/ProtectedRoute.jsx` (route guard)

| Page | HOST | ADMIN | ENGINEER | SALES_EXECUTIVE | TALLY_CALLER | SALES_ADMIN | ACCOUNTANT | COMPANY_PAYROLL |
|---|---|---|---|---|---|---|---|---|
| `/` Dashboard | ✅ | ✅ | ✅ | ❌ → `/sales-dashboard` | ❌ → `/sales-dashboard` | ❌ → `/sales-dashboard` | ❌ → `/orders` | ❌ → `/orders` |
| `/sales-dashboard` | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/orders` | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| `/carry-in-service` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/dc` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/users` (Role Management) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/customers` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/analytics` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/settings/categories` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/profile` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Key lines:**
- `App.jsx` line 63–67 — root `/` redirect logic per role
- `App.jsx` line 68 — `/sales-dashboard` allowedRoles
- `App.jsx` line 69 — `/orders` allowedRoles
- `App.jsx` line 71 — `/users` HOST only
- `App.jsx` line 72–74 — `/analytics`, `/customers`, `/settings/categories` HOST only
- `Navbar.jsx` line 6 — `SALES_DASHBOARD_ROLES`
- `Navbar.jsx` line 7 — `ORDERS_ROLES`
- `Navbar.jsx` line 8 — `HIDE_MAIN_DASHBOARD`
- `Navbar.jsx` line 75 — CarryInService hidden for SALES_EXECUTIVE, TALLY_CALLER, SALES_ADMIN, ACCOUNTANT, COMPANY_PAYROLL
- `Navbar.jsx` line 77 — DC visible for HOST and ADMIN only

---

## 2. Sales Dashboard Features

> Source: `frontend/src/pages/SalesDashboard.jsx` · `backend/src/index.ts` (`/sales-entries` routes)

| Feature | HOST | SALES_EXECUTIVE | TALLY_CALLER | SALES_ADMIN |
|---|---|---|---|---|
| View all entries | ✅ | ✅ | ✅ | ✅ |
| Add Entry button | ✅ | ✅ | ✅ | ✅ |
| Edit Entry | ✅ | ✅ | ✅ | ✅ |
| Log Visit | ✅ | ✅ | ✅ | ✅ |
| Log Call | ✅ | ✅ | ✅ | ✅ |
| Export button | ✅ | ❌ | ❌ | ❌ |
| Share button | ✅ | ✅ | ✅ | ✅ |
| Sales Executive filter | ✅ | ❌ | ❌ | ✅ |
| Add new City / Area | ✅ | ✅ | ✅ | ✅ |

**Key lines:**
- `SalesDashboard.jsx` line 46–49 — `fetchUsers()` called for HOST and SALES_ADMIN only
- `SalesDashboard.jsx` line 199 — Export button visible for HOST only (`user?.role === 'HOST'`)
- `SalesDashboard.jsx` line 285 — Sales Executive filter visible for HOST and SALES_ADMIN (`user?.role === 'HOST' || user?.role === 'SALES_ADMIN'`)
- `index.ts` — `GET /sales-entries` requireRole: `['HOST', 'SALES_EXECUTIVE', 'TALLY_CALLER', 'SALES_ADMIN']`
- `index.ts` — `POST /sales-entries` requireRole: `['HOST', 'SALES_EXECUTIVE', 'TALLY_CALLER', 'SALES_ADMIN']`
- `index.ts` — `PUT /sales-entries/:id` requireRole: `['HOST', 'SALES_EXECUTIVE', 'TALLY_CALLER', 'SALES_ADMIN']`
- `index.ts` — `POST /sales-entries/:id/visit` requireRole: `['HOST', 'SALES_EXECUTIVE', 'TALLY_CALLER', 'SALES_ADMIN']`
- `index.ts` — `POST /sales-entries/:id/call` requireRole: `['HOST', 'SALES_EXECUTIVE', 'TALLY_CALLER', 'SALES_ADMIN']`
- `index.ts` — `POST /cities` requireRole: `['HOST', 'SALES_EXECUTIVE', 'TALLY_CALLER', 'SALES_ADMIN']`
- `index.ts` — `POST /areas` requireRole: `['HOST', 'SALES_EXECUTIVE', 'TALLY_CALLER', 'SALES_ADMIN']`

---

## 3. Orders Page Features

> Source: `frontend/src/pages/OrdersPage.jsx` · `backend/src/index.ts` (`/orders` routes)

| Feature | HOST | SALES_EXECUTIVE | TALLY_CALLER | SALES_ADMIN | ACCOUNTANT | COMPANY_PAYROLL |
|---|---|---|---|---|---|---|
| View orders | All | Own only | ❌ no access | All | All | Own only |
| "Created By" filter | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Add Entry | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Hold order | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Bill order | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Complete order | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Cancel order | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Revert cancelled | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Key lines:**
- `OrdersPage.jsx` line 10 — `ORDER_ACTION_ROLES = ['HOST', 'ACCOUNTANT', 'SALES_ADMIN']`
- `OrdersPage.jsx` line 11 — `ALL_ORDER_ROLES = ['HOST', 'ACCOUNTANT', 'SALES_ADMIN']`
- `OrdersPage.jsx` line 12 — `PERSONAL_ORDER_ROLES = ['SALES_EXECUTIVE', 'COMPANY_PAYROLL']`
- `OrdersPage.jsx` line 46 — `canAction` derived from `ORDER_ACTION_ROLES`
- `OrdersPage.jsx` line 47 — `canSeeAll` derived from `ALL_ORDER_ROLES` (controls "Created By" filter)
- `OrdersPage.jsx` line 48 — `canCancel = user?.role !== 'COMPANY_PAYROLL'`
- `index.ts` — `ORDER_PAGE_ROLES = ['HOST', 'ACCOUNTANT', 'SALES_EXECUTIVE', 'COMPANY_PAYROLL', 'SALES_ADMIN']`
- `index.ts` — `ORDER_ACTION_ROLES = ['HOST', 'ACCOUNTANT', 'SALES_ADMIN']`
- `index.ts` — `GET /orders`: SALES_EXECUTIVE and COMPANY_PAYROLL get `WHERE createdById = req.user.id` (personal only)
- `index.ts` — `POST /orders`: allowed for all `ORDER_PAGE_ROLES`
- `index.ts` — `POST /orders/:id/hold|bill|complete`: restricted to `ORDER_ACTION_ROLES`
- `index.ts` — `POST /orders/:id/cancel`: allowed for all `ORDER_PAGE_ROLES`
- `index.ts` — `POST /orders/:id/revert`: HOST only via `requireRole(['HOST'])`

---

## 4. Backend API Permissions

> Source: `backend/src/index.ts`

| Endpoint | HOST | ADMIN | ENGINEER | SALES_EXECUTIVE | TALLY_CALLER | SALES_ADMIN | ACCOUNTANT | COMPANY_PAYROLL |
|---|---|---|---|---|---|---|---|---|
| `GET /users` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `POST /users` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `PUT /users/:id` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `DELETE /users/:id` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /calls` | ✅ all | ✅ all | ✅ own | ✅ all | ✅ all | ✅ all | ✅ all | ✅ all |
| `POST /calls` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `PUT /calls/:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /calls/:id/assign` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /calls/:id/complete` | ✅ | ✅ | ✅ assigned | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /calls/:id/visited` | ✅ | ✅ | ✅ assigned | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /calls/bulk-delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /calls/dc` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /calls/:id/complete-dc` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /sales-entries` | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `POST /sales-entries` | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `PUT /sales-entries/:id` | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `POST /sales-entries/:id/visit` | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `POST /sales-entries/:id/call` | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `GET /sales-entries/search` | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /orders` | ✅ all | ❌ | ❌ | ✅ own | ❌ | ✅ all | ✅ all | ✅ own |
| `POST /orders` | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| `POST /orders/:id/hold` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `POST /orders/:id/bill` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `POST /orders/:id/complete` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `POST /orders/:id/cancel` | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| `POST /orders/:id/revert` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /customers` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /customers/analytics` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `PUT /customers/:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /analytics/engineers` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /analytics/deletion-history` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /cities` | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `PUT /cities/:id` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `DELETE /cities/:id` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /areas` | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `PUT /areas/:id` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `DELETE /areas/:id` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /categories` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `PUT /categories/:id` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `DELETE /categories/:id` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /carry-in-services` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /carry-in-services` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `PUT /carry-in-services/:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /carry-in-services/bulk-delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /auth/verify-secret` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/forgot-password` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 5. Quick Role Summary

| Role | Landing Page | Sales Dashboard | Orders | Scope |
|---|---|---|---|---|
| **HOST** | Dashboard | ✅ Full access + Export + Filter | ✅ Full access + Revert | All data, all actions |
| **ADMIN** | Dashboard | ❌ | ❌ | Calls + CarryIn + DC only |
| **ENGINEER** | Dashboard | ❌ | ❌ | Own assigned calls only |
| **SALES_EXECUTIVE** | Sales Dashboard | ✅ Full (no Export) | ✅ Own orders only, can Cancel | Sales + own orders |
| **TALLY_CALLER** | Sales Dashboard | ✅ Full (no Export, no filter) | ❌ | Sales Dashboard only |
| **SALES_ADMIN** | Sales Dashboard | ✅ Full (no Export) + filter | ✅ All orders, can Hold/Bill/Complete/Cancel | Sales + all orders |
| **ACCOUNTANT** | Orders | ❌ | ✅ All orders, can Hold/Bill/Complete/Cancel | Orders only |
| **COMPANY_PAYROLL** | Orders | ❌ | ✅ Own orders, view only (no actions) | Own orders, read-only |
