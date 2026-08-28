/**
 * Tenant Business Data Reset Script
 * ----------------------------------
 * Clears ALL business/operational data for a given tenant.
 * KEEPS: tenants, users, roles, branches, settings, sessions, plans, audit_logs
 * WIPES: products, stock, sales, purchases, customers, suppliers, accounting,
 *        expenses, employees, payroll, loans, investors, warranties, repairs,
 *        tickets, documents, catalog, inventory units, notifications, etc.
 *
 * Usage:  node scripts/resetTenantData.js [tenantId]
 *         e.g.  node scripts/resetTenantData.js 1
 */

import { db } from '../config/db.knex.js';

const TENANT_ID = Number(process.argv[2] || 1);

// Tables to fully DELETE rows for the given tenant (in safe order — children first)
const TENANT_TABLES = [
  // Accounting (children first)
  'ledger_entries',
  'journal_entries',
  'accounts',

  // Sales / Transactions
  'transactions',

  // Purchases
  'purchase_orders',

  // Products & Stock
  'product_branch_stocks',
  'inventory_units',
  'catalog_items',
  'products',

  // People
  'customers',
  'suppliers',
  'investors',
  'investor_transactions',

  // Expenses
  'recurring_expenses',
  'expense_categories',
  'expenses',

  // HR / Workforce
  'payrolls',
  'leaves',
  'attendances',
  'employees',

  // Finance
  'loan_repayments',
  'loans',

  // Operations
  'warranty_claims',
  'repair_tickets',
  'stock_transfers',
  'wholesale_prices',
  'wholesale_orders',
  'document_vaults',
  'tickets',
  'notifications',
];

async function resetTenantData() {
  console.log(`\n🔄  Starting business data reset for Tenant ID: ${TENANT_ID}`);
  console.log('⚠️   Keeping: tenants, users, roles, branches, settings, sessions\n');

  // Confirm by listing what exists before reset
  const [txCount] = await db('transactions').where('tenant_id', TENANT_ID).count('id as c');
  const [custCount] = await db('customers').where('tenant_id', TENANT_ID).count('id as c');
  const [prodCount] = await db('products').where('tenant_id', TENANT_ID).count('id as c');
  const [jeCount] = await db('journal_entries').where('tenant_id', TENANT_ID).count('id as c');

  console.log('📊  Current data snapshot:');
  console.log(`    Transactions:    ${txCount.c}`);
  console.log(`    Customers:       ${custCount.c}`);
  console.log(`    Products:        ${prodCount.c}`);
  console.log(`    Journal Entries: ${jeCount.c}`);
  console.log('');

  await db.transaction(async (trx) => {
    for (const table of TENANT_TABLES) {
      try {
        // Check if the table actually has a tenant_id column
        const exists = await trx(table).where('tenant_id', TENANT_ID).count('* as c').first().catch(() => null);
        if (exists === null) {
          console.log(`    ⏭️  Skipping ${table} (no tenant_id or doesn't exist)`);
          continue;
        }

        const deleted = await trx(table).where('tenant_id', TENANT_ID).del();
        if (deleted > 0) {
          console.log(`    ✅  Cleared ${table}: ${deleted} row(s) deleted`);
        } else {
          console.log(`    ⚪  ${table}: already empty`);
        }
      } catch (err) {
        console.warn(`    ⚠️  Could not clear ${table}: ${err.message}`);
      }
    }
  });

  console.log('\n✨  Tenant data reset complete!');
  console.log('    You can now log in and start fresh.\n');
  process.exit(0);
}

resetTenantData().catch((err) => {
  console.error('\n❌  Reset failed:', err.message);
  process.exit(1);
});
