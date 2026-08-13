import bcrypt from 'bcryptjs';
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
import * as addNotesToTenantsTable from '../migrations/20260812000016_add_notes_to_tenants_table.js';
import * as addNotesToTransactionsTable from '../migrations/20260812000017_add_notes_to_transactions_table.js';

import { seedDefaultRoles } from '../modules/role/role.service.js';
import { seedSubscriptionPlans } from '../modules/plans/plans.service.js';

const SEED_PASSWORD = process.env.SEED_PASSWORD || 'admin123';

const admins = [
  { username: 'salahuddin', email: 'salahuddin@erp.com', phone: '01710000001', fullName: 'Salahuddin' },
  { username: 'admin2', email: 'admin2@erp.com', phone: '01710000002', fullName: 'Admin Two' },
];

async function resetDatabase() {
  console.log('⚠️ [DB RESET] Starting database wipe & re-initialization...');

  try {
    // 1. Disable FK checks and drop all tables
    await db.raw('SET FOREIGN_KEY_CHECKS = 0;');
    const [tables] = await db.raw(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ?',
      [env.DB_NAME]
    );

    for (const t of tables) {
      const tableName = t.TABLE_NAME || t.table_name;
      if (tableName) {
        console.log(`  🗑️ Dropping table: ${tableName}`);
        await db.raw(`DROP TABLE IF EXISTS \`${tableName}\`;`);
      }
    }
    await db.raw('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✅ All existing tables dropped.');

    // 2. Re-run all migrations in sequence
    console.log('🔄 Rebuilding all database tables and columns...');
    await createRolesTable.up(db);
    await createTenantsTables.up(db);
    await createUsersTable.up(db);
    await createSessionsTable.up(db);
    await createBranchesAndSettingsTables.up(db);
    await createPhase2MasterDataTables.up(db);
    await createPhase3ProductAndStockTables.up(db);
    await createPhase4OperationsTables.up(db);
    await createPhase5AccountingAndFinanceTables.up(db);
    await createPhase6WorkforceTables.up(db);
    await createPhase7SystemTables.up(db);
    await createContactMessagesTable.up(db);
    await addBranchIdToOperationsTables.up(db);
    await addBranchIdToHrAndWarrantyTables.up(db);
    await addNotesToTenantsTable.up(db);
    await addNotesToTransactionsTable.up(db);
    console.log('✅ Schema created successfully!');

    // 3. Seed default roles, subscription plans, and super admins
    console.log('🌱 Seeding initial system data...');
    await seedDefaultRoles();
    await seedSubscriptionPlans();

    const adminRole = await db('roles').where({ name: 'ADMIN' }).first();
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

    for (const u of admins) {
      await db('users').insert({
        username: u.username,
        email: u.email,
        phone: u.phone,
        full_name: u.fullName,
        password_hash: passwordHash,
        role_id: adminRole?.id || 1,
        role_name: 'ADMIN',
        is_active: true,
        is_verified: true,
        is_deleted: false,
      });
      console.log(`  👤 Created Super Admin: ${u.username}`);
    }

    console.log('🎉 Database fully reset and freshly initialized!');
    console.log(`🔑 Login password for super admin: ${SEED_PASSWORD}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Database reset failed:', err);
    process.exit(1);
  }
}

resetDatabase();
