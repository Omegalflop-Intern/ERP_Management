# Single-Tenant Multi-Branch ERP Master Architecture & Porting Guide

> **Target Architecture:** Single-Tenant with Multi-Branch Support (Single Shop / Company with multiple outlets/branches).  
> **Key Goal:** Strip away SaaS Multi-Tenancy (`tenant_id`, tenant middleware, tenant subdomains) while maintaining strict **Branch-Wise Data Isolation**, **Branch-to-Branch Stock Transfers (IMEI & Non-IMEI)**, **Branch-Wise Accounting & Ledger Entries**, and **Branch-Level Profit/Loss & Reports**.

---

## 📑 Table of Contents
1. [Core Architecture & Branch Scoping Concept](#1-core-architecture--branch-scoping-concept)
2. [Database Schema Adaptations (Single-Tenant vs Multi-Tenant)](#2-database-schema-adaptations)
3. [Branch Context & Middleware Pipeline](#3-branch-context--middleware-pipeline)
4. [Branch-Wise Inventory & Stock Management](#4-branch-wise-inventory--stock-management)
5. [Complete Branch-to-Branch Stock Transfer Flow (IMEI + Bulk)](#5-complete-branch-to-branch-stock-transfer-flow)
6. [Branch-Wise Double-Entry Accounting & Journal Entries](#6-branch-wise-double-entry-accounting--journal-entries)
7. [Branch-Wise Profit, Loss & Analytics Calculation](#7-branch-wise-profit-loss--analytics-calculation)
8. [Module-by-Module Branch Scoping Matrix & Code Changes](#8-module-by-module-branch-scoping-matrix)
9. [Frontend Branch Switching & State Management](#9-frontend-branch-switching--state-management)
10. [Step-by-Step Implementation & Verification Checklist](#10-step-by-step-implementation--verification-checklist)

---

## 1. Core Architecture & Branch Scoping Concept

### What Stays vs What is Removed:
| Component | Multi-Tenant (SaaS) | Single-Tenant Multi-Branch (Target) |
|---|---|---|
| `tenant_id` in DB | Present on all tables | ❌ **Removed entirely** |
| Subdomain Middleware | Resolves tenant by domain | ❌ **Removed entirely** |
| Tenant Subscription/Plans | Enforces expiration/billing | ❌ **Removed entirely** |
| `branch_id` in DB | Present on operational tables | ✅ **Retained & strictly enforced** |
| `X-Branch-Id` Header | Sent from frontend | ✅ **Retained (`all` or specific integer ID)** |
| Branch Context Middleware | Attaches `req.selectedBranchId` | ✅ **Retained** |
| Product Catalog | Shared across branches | ✅ **Central catalog with branch stocks** |
| Customer / Supplier base | Shared or branch-tagged | ✅ **Shared CRM / Vendor Directory** |

---

## 2. Database Schema Adaptations

### 2.1 Schema Cleanup
Remove `tenant_id` from every table and ensure every operational table has an indexed `branch_id INT UNSIGNED NULL`.

```sql
-- 1. Branches Table
CREATE TABLE IF NOT EXISTS `branches` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `phone` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `is_main` TINYINT(1) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `is_deleted` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Product Branch Stocks (Non-IMEI / General Item Quantities per Branch)
CREATE TABLE IF NOT EXISTS `product_branch_stocks` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `branch_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_branch_product` (`branch_id`, `product_id`),
  FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Inventory Units (Serialized IMEI / Serial Number Units per Branch)
CREATE TABLE IF NOT EXISTS `inventory_units` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT UNSIGNED NOT NULL,
  `branch_id` INT UNSIGNED NULL,
  `imei_or_serial` VARCHAR(191) NOT NULL UNIQUE,
  `status` ENUM('Available', 'Sold', 'Transferred', 'Damaged', 'In_Repair', 'Returned') DEFAULT 'Available',
  `purchase_price` DECIMAL(12,2) DEFAULT 0.00,
  `selling_price` DECIMAL(12,2) DEFAULT 0.00,
  `passport_history` LONGTEXT NULL, -- JSON array of events
  `is_deleted` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_branch_status` (`branch_id`, `status`),
  FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Stock Transfers Table
CREATE TABLE IF NOT EXISTS `stock_transfers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `transfer_number` VARCHAR(100) NOT NULL UNIQUE,
  `from_branch_id` INT UNSIGNED NOT NULL,
  `to_branch_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `imei_or_serial` VARCHAR(191) NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `status` ENUM('PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
  `notes` TEXT NULL,
  `transferred_by` VARCHAR(100) NULL,
  `delivered_at` DATETIME NULL,
  `is_deleted` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_transfer_branches` (`from_branch_id`, `to_branch_id`, `status`),
  FOREIGN KEY (`from_branch_id`) REFERENCES `branches`(`id`),
  FOREIGN KEY (`to_branch_id`) REFERENCES `branches`(`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 3. Branch Context & Middleware Pipeline

### 3.1 Branch Scope Helper (`server/utils/branchScope.js`)
Create a single reusable helper for Knex queries:

```javascript
/**
 * Applies branch filtering to a Knex query.
 * @param {import('knex').Knex.QueryBuilder} query - Knex query instance
 * @param {number|string|null} branchId - Selected branch ID or 'all'
 * @param {string} [column='branch_id'] - Target column name (can include table prefix)
 */
export function applyBranchScope(query, branchId, column = 'branch_id') {
  if (branchId && branchId !== 'all' && branchId !== 'null' && branchId !== 'undefined') {
    const numBranchId = Number(branchId);
    if (!isNaN(numBranchId)) {
      query.where((b) => {
        b.where(column, numBranchId).orWhereNull(column);
      });
    }
  }
}

/**
 * Strict branch filtering (does not include NULL branch_id rows).
 */
export function applyStrictBranchScope(query, branchId, column = 'branch_id') {
  if (branchId && branchId !== 'all' && branchId !== 'null' && branchId !== 'undefined') {
    const numBranchId = Number(branchId);
    if (!isNaN(numBranchId)) {
      query.where(column, numBranchId);
    }
  }
}
```

### 3.2 Branch Context Middleware (`server/middleware/branchContext.middleware.js`)
```javascript
export function branchContext(req, res, next) {
  // 1. Extract from header, query, or user's assigned branch
  const headerBranch = req.headers['x-branch-id'];
  const queryBranch = req.query.branchId;
  const userAssignedBranch = req.user?.branchId || req.user?.branch_id;
  const userRole = req.user?.roleName || req.user?.role_name || '';

  let selected = 'all';

  if (headerBranch !== undefined && headerBranch !== '') {
    selected = headerBranch;
  } else if (queryBranch !== undefined && queryBranch !== '') {
    selected = queryBranch;
  }

  // Non-admin / non-manager users can only view their own assigned branch
  if (!['ADMIN', 'SUPERADMIN', 'OWNER'].includes(userRole.toUpperCase())) {
    if (userAssignedBranch) {
      selected = String(userAssignedBranch);
    }
  }

  req.selectedBranchId = selected === 'all' ? null : (isNaN(Number(selected)) ? null : Number(selected));
  next();
}
```

---

## 4. Branch-Wise Inventory & Stock Management

In a gadget shop ERP, products have two inventory models:
1. **Serialized Devices (Smartphones, Laptops, Tablets):** Tracked via individual unique `imei_or_serial` in `inventory_units`.
2. **Bulk Accessories (Chargers, Cables, Cases):** Tracked via numerical quantity in `product_branch_stocks`.

### 4.1 Retrieving Branch Stock for a Product
```javascript
export async function getProductStockForBranch(productId, branchId = null) {
  // 1. Check if product is IMEI-tracked
  const product = await db('products').where({ id: productId, is_deleted: false }).first();
  if (!product) return { totalStock: 0, branchStock: 0 };

  if (product.has_imei || product.type === 'DEVICE') {
    const query = db('inventory_units')
      .where({ product_id: productId, status: 'Available', is_deleted: false });
    
    if (branchId) {
      query.where({ branch_id: branchId });
    }
    const count = await query.count('* as count').first();
    return Number(count?.count || 0);
  }

  // 2. Non-IMEI bulk stock
  if (branchId) {
    const branchStock = await db('product_branch_stocks')
      .where({ product_id: productId, branch_id: branchId })
      .first();
    return Number(branchStock?.stock_quantity || 0);
  }

  // Aggregate across all branches
  const total = await db('product_branch_stocks')
    .where({ product_id: productId })
    .sum({ sum: 'stock_quantity' })
    .first();
  return Number(total?.sum || product.stock_quantity || 0);
}
```

---

## 5. Complete Branch-to-Branch Stock Transfer Flow

```
+-------------------------------------------------------------------------------+
|                        STOCK TRANSFER LIFECYCLE                               |
|                                                                               |
|   1. INITIATION (Source Branch)                                               |
|      - Non-IMEI: Decrement source product_branch_stocks                       |
|      - IMEI: Mark inventory_unit as 'Transferred' + Append passport history   |
|      - Status: 'PENDING' / 'IN_TRANSIT'                                       |
|                                                                               |
|   2. RECEIPT (Destination Branch - updateTransferStatus -> 'DELIVERED')       |
|      - Non-IMEI: Increment destination product_branch_stocks (UPSERT)         |
|      - IMEI: Update inventory_unit branch_id = toBranch, status = 'Available'|
|      - Record delivered_at = NOW()                                            |
|                                                                               |
|   3. CANCELLATION (updateTransferStatus -> 'CANCELLED')                       |
|      - Non-IMEI: Re-increment source product_branch_stocks                     |
|      - IMEI: Revert inventory_unit status = 'Available'                       |
+-------------------------------------------------------------------------------+
```

### Complete Service Implementation:
```javascript
// server/modules/stock/stock.service.js

import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';

export const createTransfer = async (data, transferredBy = 'system') => {
  if (Number(data.fromBranchId) === Number(data.toBranchId)) {
    throw ApiError.badRequest('Source and destination branches cannot be the same');
  }

  const items = Array.isArray(data.items) && data.items.length > 0
    ? data.items
    : [{ productId: data.productId, imeiOrSerial: data.imeiOrSerial, quantity: data.quantity || 1 }];

  return await db.transaction(async (trx) => {
    const createdTransfers = [];

    for (const item of items) {
      const transferNumber = 'TRF-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();

      // Case A: Serialized IMEI Transfer
      if (item.imeiOrSerial) {
        const unit = await trx('inventory_units')
          .where({ imei_or_serial: item.imeiOrSerial, is_deleted: false })
          .first();

        if (!unit) throw ApiError.notFound(`IMEI "${item.imeiOrSerial}" not found`);
        if (unit.status !== 'Available') throw ApiError.badRequest(`IMEI "${item.imeiOrSerial}" is currently ${unit.status}`);
        if (unit.branch_id && Number(unit.branch_id) !== Number(data.fromBranchId)) {
          throw ApiError.badRequest(`IMEI "${item.imeiOrSerial}" does not belong to the source branch`);
        }

        let history = [];
        try { history = JSON.parse(unit.passport_history || '[]'); } catch {}
        history.push({
          event: 'TRANSFER_INITIATED',
          details: `In transit to branch #${data.toBranchId} (Transfer: ${transferNumber})`,
          performedBy: transferredBy,
          timestamp: new Date().toISOString(),
        });

        await trx('inventory_units').where({ id: unit.id }).update({
          status: 'Transferred',
          passport_history: JSON.stringify(history),
        });
      } 
      // Case B: Bulk Non-IMEI Transfer
      else if (item.productId) {
        const qty = Number(item.quantity || 1);
        const srcStock = await trx('product_branch_stocks')
          .where({ branch_id: data.fromBranchId, product_id: item.productId })
          .first();

        if (!srcStock || srcStock.stock_quantity < qty) {
          throw ApiError.badRequest(`Insufficient stock at source branch for product #${item.productId}`);
        }

        await trx('product_branch_stocks')
          .where({ id: srcStock.id })
          .decrement('stock_quantity', qty);
      }

      const [insertedId] = await trx('stock_transfers').insert({
        transfer_number: transferNumber,
        from_branch_id: data.fromBranchId,
        to_branch_id: data.toBranchId,
        product_id: item.productId,
        imei_or_serial: item.imeiOrSerial || null,
        quantity: item.quantity || 1,
        status: 'PENDING',
        notes: data.notes || null,
        transferred_by: transferredBy,
        is_deleted: false,
      });

      createdTransfers.push(insertedId);
    }

    return createdTransfers;
  });
};

export const updateTransferStatus = async (id, status, performedBy = 'system') => {
  return await db.transaction(async (trx) => {
    const transfer = await trx('stock_transfers').where({ id, is_deleted: false }).first();
    if (!transfer) throw ApiError.notFound('Transfer record not found');
    if (transfer.status === status) return transfer;
    if (['DELIVERED', 'CANCELLED'].includes(transfer.status)) {
      throw ApiError.badRequest(`Cannot modify a transfer that is already ${transfer.status}`);
    }

    if (status === 'DELIVERED') {
      if (transfer.imei_or_serial) {
        const unit = await trx('inventory_units')
          .where({ imei_or_serial: transfer.imei_or_serial, is_deleted: false })
          .first();

        if (unit) {
          let history = [];
          try { history = JSON.parse(unit.passport_history || '[]'); } catch {}
          history.push({
            event: 'TRANSFER_RECEIVED',
            details: `Received at branch #${transfer.to_branch_id} (${transfer.transfer_number})`,
            performedBy,
            timestamp: new Date().toISOString(),
          });

          await trx('inventory_units').where({ id: unit.id }).update({
            branch_id: transfer.to_branch_id,
            status: 'Available',
            passport_history: JSON.stringify(history),
          });
        }
      } else if (transfer.product_id) {
        const qty = Number(transfer.quantity || 1);
        const destStock = await trx('product_branch_stocks')
          .where({ branch_id: transfer.to_branch_id, product_id: transfer.product_id })
          .first();

        if (destStock) {
          await trx('product_branch_stocks')
            .where({ id: destStock.id })
            .increment('stock_quantity', qty);
        } else {
          await trx('product_branch_stocks').insert({
            branch_id: transfer.to_branch_id,
            product_id: transfer.product_id,
            stock_quantity: qty,
          });
        }
      }

      await trx('stock_transfers').where({ id }).update({
        status: 'DELIVERED',
        delivered_at: new Date(),
      });
    } else if (status === 'CANCELLED') {
      // Return stock back to source
      if (transfer.imei_or_serial) {
        const unit = await trx('inventory_units')
          .where({ imei_or_serial: transfer.imei_or_serial, is_deleted: false })
          .first();

        if (unit && unit.status === 'Transferred') {
          let history = [];
          try { history = JSON.parse(unit.passport_history || '[]'); } catch {}
          history.push({
            event: 'TRANSFER_CANCELLED',
            details: `Transfer cancelled (${transfer.transfer_number}) — returned to source branch #${transfer.from_branch_id}`,
            performedBy,
            timestamp: new Date().toISOString(),
          });

          await trx('inventory_units').where({ id: unit.id }).update({
            status: 'Available',
            branch_id: transfer.from_branch_id,
            passport_history: JSON.stringify(history),
          });
        }
      } else if (transfer.product_id) {
        const qty = Number(transfer.quantity || 1);
        const srcStock = await trx('product_branch_stocks')
          .where({ branch_id: transfer.from_branch_id, product_id: transfer.product_id })
          .first();

        if (srcStock) {
          await trx('product_branch_stocks')
            .where({ id: srcStock.id })
            .increment('stock_quantity', qty);
        } else {
          await trx('product_branch_stocks').insert({
            branch_id: transfer.from_branch_id,
            product_id: transfer.product_id,
            stock_quantity: qty,
          });
        }
      }

      await trx('stock_transfers').where({ id }).update({ status: 'CANCELLED' });
    }

    return await trx('stock_transfers').where({ id }).first();
  });
};
```

---

## 6. Branch-Wise Double-Entry Accounting & Journal Entries

In a multi-branch system, each transaction (Sales, Returns, Expenses, Due Collections) must link its journal entry to the initiating `branch_id`.

### 6.1 Standard Account Structure
- `1000` — Cash in Hand (Branch-Scoped)
- `1010` — Bank Account
- `1011` — bKash Account
- `1012` — Nagad Account
- `1013` — Rocket Account
- `1020` — Accounts Receivable (Customer Dues)
- `1030` — Inventory Asset
- `2000` — Accounts Payable (Supplier Dues)
- `4000` — Sales Revenue
- `5000` — Cost of Goods Sold (COGS)
- `6000` — Operating Expenses

### 6.2 Computing Branch-Scoped Account Balances
To display accurate balances in Chart of Accounts when a branch is selected:

```javascript
// server/modules/accounting/accounting.service.js

export async function computeBranchScopedAccountBalances(branchId = null) {
  const accounts = await db('accounts').where({ is_deleted: false });
  const journalQuery = db('journal_entries').where({ status: 'POSTED', is_deleted: false });

  if (branchId && branchId !== 'all') {
    journalQuery.where('branch_id', Number(branchId));
  }

  const postedJournals = await journalQuery.select('lines');
  const balanceMap = {};
  for (const a of accounts) balanceMap[a.id] = 0;

  for (const je of postedJournals) {
    let lines = [];
    try { lines = typeof je.lines === 'string' ? JSON.parse(je.lines) : (je.lines || []); } catch {}
    for (const l of lines) {
      const acctId = Number(l.accountId || l.account_id);
      if (balanceMap[acctId] !== undefined) {
        const debit = Number(l.debit || 0);
        const credit = Number(l.credit || 0);
        const acct = accounts.find((a) => a.id === acctId);
        
        // ASSET & EXPENSE: Debit increases (+), Credit decreases (-)
        // LIABILITY, EQUITY & REVENUE: Credit increases (+), Debit decreases (-)
        if (['ASSET', 'EXPENSE'].includes(acct?.type)) {
          balanceMap[acctId] += (debit - credit);
        } else {
          balanceMap[acctId] += (credit - debit);
        }
      }
    }
  }

  return accounts.map((a) => ({
    ...a,
    balance: balanceMap[a.id] || 0,
  }));
}
```

---

## 7. Branch-Wise Profit, Loss & Analytics Calculation

When calculating Gross & Net Profit per branch in `server/modules/report/report.routes.js`:

```javascript
/**
 * Exact Financial Formula:
 * 1. Gross Revenue = SUM(net_total) - SUM(returned_amount) - SUM(outstanding_dues)
 * 2. COGS = SUM(unitCost * qty for each item sold) - (Returned Item Costs)
 * 3. Gross Profit = Gross Revenue - COGS
 * 4. Operating Expenses = SUM(expense.amount) [excluding Supplier Payments]
 * 5. Net Profit = Gross Profit - Operating Expenses
 */

export async function calculateBranchProfitLoss(branchId, fromDate, toDate) {
  const branchFilter = (q, col = 'branch_id') => {
    if (branchId && branchId !== 'all') q.where(col, Number(branchId));
    if (fromDate) q.where('created_at', '>=', new Date(fromDate));
    if (toDate) q.where('created_at', '<=', new Date(toDate));
  };

  // 1. Revenue & Sales
  const salesQuery = db('transactions')
    .where({ is_deleted: false, tx_type: 'SALE', status: 'COMPLETED' })
    .modify((q) => branchFilter(q, 'branch_id'));

  const sales = await salesQuery.select('net_total', 'returned_amount', 'line_items', 'payment_breakdown', 'return_logs');

  let totalRevenue = 0;
  let totalCogs = 0;

  for (const s of sales) {
    let pb = {};
    try { pb = typeof s.payment_breakdown === 'string' ? JSON.parse(s.payment_breakdown) : (s.payment_breakdown || {}); } catch {}
    const due = Number(pb.dueAmount || 0);
    const saleNet = Number(s.net_total || 0) - Number(s.returned_amount || 0) - due;
    totalRevenue += Math.max(0, saleNet);

    // Calculate COGS
    let items = [];
    try { items = typeof s.line_items === 'string' ? JSON.parse(s.line_items) : (s.line_items || []); } catch {}
    let saleCogs = 0;
    const costMap = {};

    for (const it of items) {
      const cost = Number(it.unitCost || it.costPrice || 0);
      const qty = Number(it.qty || 1);
      saleCogs += (cost * qty);
      if (it.productId) costMap[String(it.productId)] = cost;
    }

    // Deduct returned items cost from COGS
    let returns = [];
    try { returns = typeof s.return_logs === 'string' ? JSON.parse(s.return_logs) : (s.return_logs || []); } catch {}
    for (const ret of returns) {
      for (const rItem of (ret.items || [])) {
        const rCost = costMap[String(rItem.productId)] || 0;
        saleCogs = Math.max(0, saleCogs - (rCost * Number(rItem.quantity || 1)));
      }
    }
    totalCogs += saleCogs;
  }

  // 2. Branch Expenses
  const expQuery = db('expenses')
    .where({ is_deleted: false })
    .whereNot('category', 'Supplier Payment')
    .modify((q) => branchFilter(q, 'branch_id'));

  const expRes = await expQuery.sum({ total: 'amount' }).first();
  const totalExpenses = Number(expRes?.total || 0);

  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalExpenses;

  return {
    totalRevenue,
    totalCogs,
    grossProfit,
    totalExpenses,
    netProfit,
    marginPercentage: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0,
  };
}
```

---

## 8. Module-by-Module Branch Scoping Matrix

Apply the following scoping rules to your controllers and services:

| Module | Table | Branch Column | Scoping Rule |
|---|---|---|---|
| **Sales** | `transactions` | `branch_id` | Set on create; filter on list, getById, returns |
| **Purchases** | `purchase_orders` | `branch_id` | Set receiving branch; updates branch stock on receive |
| **Stock Transfer** | `stock_transfers` | `from_branch_id`, `to_branch_id` | Filter where `from_branch_id = X OR to_branch_id = X` |
| **IMEI Units** | `inventory_units` | `branch_id` | Set on purchase; updated on transfer / sale |
| **Expenses** | `expenses` | `branch_id` | Filter lists, reports, and sums by `branch_id` |
| **Repairs** | `repair_tickets` | `branch_id` | Filter repair intake and delivery by branch |
| **Employees** | `employees` | `branch_id` | Assign staff to outlet; filter staff lists & attendance |
| **Attendance** | `attendances` | `branch_id` | Record check-in branch; auto-checkout per branch shift |
| **Payroll** | `payrolls` | `branch_id` | Generate payroll by branch |
| **Warranties** | `warranty_claims` | `branch_id` | Track claims per outlet |
| **Journal Entries**| `journal_entries` | `branch_id` | Tag double-entry vouchers to branch |

---

## 9. Frontend Branch Switching & State Management

### 9.1 Branch Store (`client/src/store/branchStore.js`)
```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useBranchStore = create(
  persist(
    (set) => ({
      activeBranchId: 'all', // 'all' or numeric branch ID
      activeBranchName: 'All Branches',
      setActiveBranch: (id, name) => set({ activeBranchId: String(id), activeBranchName: name }),
    }),
    { name: 'erp-branch-storage' }
  )
);
```

### 9.2 Global API Interceptor (`client/src/lib/api.js`)
Ensure the active branch is automatically passed with every request:

```javascript
import axios from 'axios';
import { useBranchStore } from '../store/branchStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const activeBranchId = useBranchStore.getState().activeBranchId;
  if (activeBranchId && activeBranchId !== 'all') {
    config.headers['X-Branch-Id'] = activeBranchId;
  }
  return config;
});

export default api;
```

---

## 10. Step-by-Step Implementation & Verification Checklist

1. [ ] **Database Setup:**
   - Drop `tenant_id` from all tables.
   - Run migrations to ensure `branches`, `product_branch_stocks`, `inventory_units`, and `stock_transfers` exist with foreign keys.
2. [ ] **Middleware:**
   - Remove `subdomain.middleware.js` and `tenant.middleware.js`.
   - Register `branchContext` middleware globally in `app.js` after auth.
3. [ ] **Stock Transfers:**
   - Test IMEI transfer from Branch A to Branch B (`PENDING` -> `DELIVERED`).
   - Test Non-IMEI transfer: verify Branch A decrements immediately, and Branch B increments upon delivery.
   - Test Transfer Cancellation: verify stock reverts cleanly to source branch.
4. [ ] **Sales & Dues:**
   - Make a sale with due balance in Branch A.
   - Verify `branch_id` is stamped on `transactions` and `journal_entries`.
   - Collect due: ensure cash account in Branch A increments and Accounts Receivable decrements.
5. [ ] **Reports & Dashboard:**
   - Select Branch A in top-bar dropdown -> verify sales count, revenue, and profit only reflect Branch A.
   - Select "All Branches" -> verify whole-store aggregate numbers.
