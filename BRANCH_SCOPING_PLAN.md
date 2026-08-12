# Branch Scoping Fix Plan

## Problem
Multi-branch shop owners see data from other branches when a specific branch is selected. The `X-Branch-Id` header is sent by the frontend but many backend modules ignore it.

## Architecture
- Frontend sends `X-Branch-Id` header on every request (via `client/src/lib/api.js`)
- Auth middleware extracts it to `req.selectedBranchId` (admin can switch; non-admin locked)
- Each service must filter queries by `branchId` when set

---

## Phase 1: Infrastructure

### 1.1 Create shared `applyBranchScope` helper
- **File**: `server/utils/branchScope.js`
- **Purpose**: DRY helper that applies branch filtering to any Knex query
- **Used by**: All modules going forward

---

## Phase 2: P0 — Critical Fixes

### 2.1 Fix ALL report endpoints
- **File**: `server/modules/report/report.routes.js` (inline handlers)
- **Issue**: All 7 report endpoints only use `getTenantScope(req)`, ignoring `req.selectedBranchId`
- **Fix**: Extract `req.selectedBranchId` and pass to each report query

### 2.2 Fix getById/update/delete branch scoping
For each module below, add branch filtering to single-record operations:

| Module | Service File | Operations to Fix |
|--------|-------------|-------------------|
| sale | `sale.service.js` | `getSaleById`, `getSaleByInvoice`, `updateSale`, `deleteSale`, `processReturn` |
| purchase | `purchaseOrder.service.js` | `getPurchaseOrderById`, `updatePurchaseOrder`, `receiveGoods`, `deletePurchaseOrder`, `returnToSupplier` |
| imei | `imei.service.js` | `getIMEIPassport`, `lookupIMEI`, `updateIMEIStatus`, `deleteIMEI` |
| customer | `customer.service.js` | `getCustomerById`, `getCustomerHistory`, `collectDue`, `getCustomerStats` |
| expense | `expense.service.js` | `updateExpense`, `deleteExpense` |
| employee | `employee.service.js` | `getEmployeeById`, `updateEmployee`, `deleteEmployee`, `getEmployeeStats` |
| attendance | `attendance.service.js` | `checkOut`, `getTodayStatus`, `updateAttendance` |
| payroll | `payroll.service.js` | `getPayrollSummary`, `getPayslip`, `markAsPaid`, `deletePayroll` |
| repair | `repair.service.js` | `getRepairById`, `updateRepairStatus`, `updateRepair`, `deleteRepair`, `getRepairStats` |
| warranty | `warranty.service.js` | `getClaimById`, `getClaimsByIMEI`, `updateClaim`, `getWarrantyReport` |

---

## Phase 3: P1 — High Priority Fixes

### 3.1 Fix `createLeave` missing `branch_id`
- **File**: `server/modules/leave/leave.service.js`
- **Issue**: Insert statement doesn't include `branch_id`
- **Fix**: Add `branch_id` to the insert

### 3.2 Fix product IMEI queries to filter by branch
- **Files**: `server/modules/product/product.controller.js`, `product.service.js`
- **Issue**: `getAllProducts` and `getProductIMEIUnits` ignore `req.selectedBranchId`
- **Fix**: Pass `branchId` to service, filter `inventory_units` by `branch_id`

### 3.3 Fix stock transfers filtering
- **File**: `server/modules/stock/` (stock transfer service)
- **Issue**: Listing shows all transfers, not filtered by user's branch
- **Fix**: Filter by `from_branch_id` OR `to_branch_id` matching user's branch

### 3.4 Add `branch_id` to `wholesale_orders` + scope queries
- **Migration**: New migration to add `branch_id` column
- **Service**: Filter queries by branch, set on create

---

## Phase 4: P2 — Cleanup

### 4.1 Fix audit logs branch filtering
- **Files**: `server/utils/auth/auditLog.js`, `server/modules/audit/auditLog.service.js`
- **Issue**: All tenant audit logs shown regardless of branch
- **Fix**: Add optional branch filtering

### 4.2 Fix user module to use `req.selectedBranchId`
- **File**: `server/modules/user/user.controller.js`
- **Issue**: Uses `req.query.branchId` instead of `req.selectedBranchId`
- **Fix**: Use the middleware-provided branch context

---

## Modules NOT Scoped (By Design — No Fix Needed)
- Products (catalog) — shared; inventory_units tracks branch stock
- Suppliers — shared vendor directory
- Roles — shared across branches
- Settings — tenant-level config
- Notifications — per-user
- Investors/Loans — tenant-level financial partners
- Catalog items — shared reference data
- Document vault — entity-linked, not branch-specific
