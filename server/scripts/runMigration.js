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
import * as addBranchIdToOperationsTables from '../migrations/20260811000014_add_branch_id_to_operations_tables.js';
import * as addBranchIdToHrAndWarrantyTables from '../migrations/20260812000015_add_branch_id_to_hr_and_warranty_tables.js';

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

async function main() {
  await ensureDatabase();

  console.log('🔄 Running migration for roles table...');
  await createRolesTable.up(db);
  console.log('🔄 Running migration for tenants tables...');
  await createTenantsTables.up(db);
  console.log('🔄 Running migration for users table...');
  await createUsersTable.up(db);
  console.log('🔄 Running migration for sessions table...');
  await createSessionsTable.up(db);
  console.log('🔄 Running migration for branches and settings tables...');
  await createBranchesAndSettingsTables.up(db);
  console.log('🔄 Running migration for Phase 2 master data tables...');
  await createPhase2MasterDataTables.up(db);
  console.log('🔄 Running migration for Phase 3 product & stock tables...');
  await createPhase3ProductAndStockTables.up(db);
  console.log('🔄 Running migration for Phase 4 operations tables...');
  await createPhase4OperationsTables.up(db);
  console.log('🔄 Running migration for Phase 5 accounting & finance tables...');
  await createPhase5AccountingAndFinanceTables.up(db);
  console.log('🔄 Running migration for Phase 6 workforce tables...');
  await createPhase6WorkforceTables.up(db);
  console.log('🔄 Running migration for Phase 7 system tables...');
  await createPhase7SystemTables.up(db);
  console.log('🔄 Running migration for contact messages table...');
  await createContactMessagesTable.up(db);
  console.log('🔄 Running migration: add branch_id to operations tables...');
  await addBranchIdToOperationsTables.up(db);
  console.log('🔄 Running migration: add branch_id to HR & warranty tables...');
  await addBranchIdToHrAndWarrantyTables.up(db);
  console.log('✅ All migrations completed successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});
