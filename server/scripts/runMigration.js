import mysql from 'mysql2/promise';
import { db } from '../config/db.knex.js';
import { env } from '../config/env.config.js';

import * as createRolesTable from '../migrations/20260807000001_create_roles_table.js';
import * as createTenantsTables from '../migrations/20260807000002_create_tenants_tables.js';
import * as createUsersTable from '../migrations/20260807000003_create_users_table.js';
import * as createSessionsTable from '../migrations/20260807000004_create_sessions_table.js';
import * as createBranchesAndSettingsTables from '../migrations/20260807000005_create_branches_and_settings_tables.js';
import * as createPhase2MasterDataTables from '../migrations/20260807000006_create_phase2_master_data_tables.js';
import * as createPhase3ProductAndStockTables from '../migrations/20260807000007_create_phase3_product_and_stock_tables.js';
import * as createPhase4OperationsTables from '../migrations/20260807000008_create_phase4_operations_tables.js';
import * as createPhase5AccountingAndFinanceTables from '../migrations/20260807000009_create_phase5_accounting_and_finance_tables.js';
import * as createPhase6WorkforceTables from '../migrations/20260807000010_create_phase6_workforce_tables.js';
import * as createPhase7SystemTables from '../migrations/20260807000011_create_phase7_system_tables.js';
import * as createContactMessagesTable from '../migrations/20260807000012_create_contact_messages_table.js';
import * as createTicketsTable from '../migrations/20260807000013_create_tickets_table.js';
import * as addBranchIdToOperationsTables from '../migrations/20260811000014_add_branch_id_to_operations_tables.js';
import * as addBranchIdToHrAndWarrantyTables from '../migrations/20260812000015_add_branch_id_to_hr_and_warranty_tables.js';
import * as addNotesToTenantsTable from '../migrations/20260812000016_add_notes_to_tenants_table.js';
import * as addNotesToTransactionsTable from '../migrations/20260812000017_add_notes_to_transactions_table.js';
import * as addBranchIdToWholesaleOrders from '../migrations/20260812000018_add_branch_id_to_wholesale_orders.js';
import * as addBranchIdToAuditLogs from '../migrations/20260812000019_add_branch_id_to_audit_logs.js';
import * as addBranchIdToSharedTables from '../migrations/20260812000020_add_branch_id_to_shared_tables.js';
import * as addBranchIdToJournalEntries from '../migrations/20260816000001_add_branch_id_to_journal_entries.js';

async function ensureDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: env.DB_HOST,
      port: Number(env.DB_PORT),
      user: env.DB_USER,
      password: env.DB_PASSWORD,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\`;`);
    await connection.end();
    console.log(`✅ Database '${env.DB_NAME}' ensured.`);
  } catch (err) {
    console.error('⚠️ Could not automatically create database:', err.message);
  }
}

export async function runAutoMigrations() {
  await ensureDatabase();

  console.log('🔄 Running migration 1: roles table...');
  await createRolesTable.up(db);
  console.log('🔄 Running migration 2: tenants tables...');
  await createTenantsTables.up(db);
  console.log('🔄 Running migration 3: users table...');
  await createUsersTable.up(db);
  console.log('🔄 Running migration 4: sessions table...');
  await createSessionsTable.up(db);
  console.log('🔄 Running migration 5: branches and settings tables...');
  await createBranchesAndSettingsTables.up(db);
  console.log('🔄 Running migration 6: Phase 2 master data tables...');
  await createPhase2MasterDataTables.up(db);
  console.log('🔄 Running migration 7: Phase 3 product & stock tables...');
  await createPhase3ProductAndStockTables.up(db);
  console.log('🔄 Running migration 8: Phase 4 operations tables...');
  await createPhase4OperationsTables.up(db);
  console.log('🔄 Running migration 9: Phase 5 accounting & finance tables...');
  await createPhase5AccountingAndFinanceTables.up(db);
  console.log('🔄 Running migration 10: Phase 6 workforce tables...');
  await createPhase6WorkforceTables.up(db);
  console.log('🔄 Running migration 11: Phase 7 system tables...');
  await createPhase7SystemTables.up(db);
  console.log('🔄 Running migration 12: contact messages table...');
  await createContactMessagesTable.up(db);
  console.log('🔄 Running migration 13: support tickets table...');
  await createTicketsTable.up(db);
  console.log('🔄 Running migration 14: add branch_id to operations tables...');
  await addBranchIdToOperationsTables.up(db);
  console.log('🔄 Running migration 15: add branch_id to HR & warranty tables...');
  await addBranchIdToHrAndWarrantyTables.up(db);
  console.log('🔄 Running migration 16: add notes column to tenants table...');
  await addNotesToTenantsTable.up(db);
  console.log('🔄 Running migration 17: add notes column to transactions table...');
  await addNotesToTransactionsTable.up(db);
  console.log('🔄 Running migration 18: add branch_id to wholesale orders...');
  await addBranchIdToWholesaleOrders.up(db);
  console.log('🔄 Running migration 19: add branch_id to audit logs...');
  await addBranchIdToAuditLogs.up(db);
  console.log('🔄 Running migration 20: add branch_id to shared tables...');
  await addBranchIdToSharedTables.up(db);
  console.log('🔄 Running migration 21: add branch_id to journal entries...');
  await addBranchIdToJournalEntries.up(db);

  console.log('✅ All 21 migrations completed successfully!');
  return true;
}

// Execute directly if run via CLI
const isDirectRun = process.argv[1] && (process.argv[1].endsWith('runMigration.js') || process.argv[1].endsWith('runMigration'));
if (isDirectRun) {
  runAutoMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration error:', err);
      process.exit(1);
    });
}
