import { db } from '../config/db.knex.js';

async function clearShopData() {
  console.log('🚀 Starting clean wipe of all shop business data while preserving all users, tenants, roles & settings...');

  const tablesToClear = [
    // Accounting ledger & journal entries
    'ledger_entries',
    'journal_entries',

    // Sales & Purchases
    'transactions',
    'purchase_orders',

    // Inventory & Catalog
    'inventory_units',
    'catalog_items',
    'products',

    // Customers, Suppliers, Investors
    'customers',
    'suppliers',
    'investor_transactions',
    'investors',

    // Expenses
    'recurring_expenses',
    'expenses',

    // HR Operations
    'payrolls',
    'leaves',
    'attendances',

    // Loans
    'loan_repayments',
    'loans',

    // Operations & Support
    'repair_tickets',
    'warranty_claims',
    'wholesale_prices',
    'wholesale_orders',
    'document_vaults',
    'tickets',
    'notifications',
  ];

  await db.raw('SET FOREIGN_KEY_CHECKS = 0');

  try {
    for (const table of tablesToClear) {
      try {
        const deleted = await db(table).del();
        console.log(`  ✅ Cleared ${table}: ${deleted} rows deleted`);
      } catch (err) {
        console.warn(`  ⚠️ Could not clear ${table}:`, err.message);
      }
    }

    // Reset default Chart of Accounts balances if any exist
    try {
      await db('accounts').update({ balance: 0 });
      console.log('  ✅ Reset account balances to 0');
    } catch {}

    console.log('\n🎉 ALL shop business data has been completely cleared!');
    console.log('👥 Kept Users:');
    const users = await db('users').select('id', 'username', 'email', 'role_name', 'tenant_id');
    console.table(users);

    console.log('\n🏬 Kept Tenants:');
    const tenants = await db('tenants').select('id', 'subdomain', 'shop_name', 'status');
    console.table(tenants);

  } finally {
    await db.raw('SET FOREIGN_KEY_CHECKS = 1');
  }

  process.exit(0);
}

clearShopData().catch((err) => {
  console.error('❌ Failed to clear shop data:', err);
  process.exit(1);
});
