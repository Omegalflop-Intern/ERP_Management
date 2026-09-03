/**
 * Migration 30: Remove branch/outlet system + simplify tenant statuses
 *
 * 1. Drop foreign key constraints referencing branches
 * 2. Drop branch_id columns from all tables
 * 3. Drop tables: stock_transfers, product_branch_stocks, branches
 * 4. Simplify tenant statuses: PAUSED→SUSPENDED, PENDING_KYC→ACTIVE, REJECTED→SUSPENDED
 * 5. Change tenants.status default from PENDING_KYC to ACTIVE
 * 6. Drop max_branches column from tenants and subscription_plans
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // ─── 1. Drop foreign key constraints referencing branches ──────────
  // We need to drop FK constraints before dropping branch_id columns or the branches table
  const tablesWithBranchId = [
    'users',
    'products',
    'inventory_units',
    'transactions',
    'customers',
    'purchase_orders',
    'expenses',
    'repair_tickets',
    'warranty_claims',
    'attendances',
    'leaves',
    'payrolls',
    'employees',
    'wholesale_orders',
    'audit_logs',
    'suppliers',
    'investors',
    'loans',
    'accounts',
    'document_vaults',
    'journal_entries',
    'recurring_expenses',
  ];

  // Drop FK constraints first (raw SQL needed since Knex doesn't expose FK names easily)
  for (const tableName of tablesWithBranchId) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (hasTable) {
      const hasColumn = await knex.schema.hasColumn(tableName, 'branch_id');
      if (hasColumn) {
        // Try to drop the foreign key constraint (name convention: table_branch_id_foreign)
        try {
          await knex.schema.alterTable(tableName, (table) => {
            table.dropForeign('branch_id');
          });
        } catch {
          // FK might not exist or have a different name — try raw approach
          try {
            const fkName = `${tableName}_branch_id_foreign`;
            await knex.raw(`ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${fkName}\``);
          } catch {
            // Ignore — constraint may not exist
          }
        }
      }
    }
  }

  // ─── 2. Drop branch_id columns from all tables ──────────────────────
  for (const tableName of tablesWithBranchId) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (hasTable) {
      const hasColumn = await knex.schema.hasColumn(tableName, 'branch_id');
      if (hasColumn) {
        await knex.schema.alterTable(tableName, (table) => {
          table.dropColumn('branch_id');
        });
      }
    }
  }

  // ─── 3. Drop tables (order matters due to FK constraints) ───────────
  await knex.schema.dropTableIfExists('stock_transfers');
  await knex.schema.dropTableIfExists('product_branch_stocks');
  await knex.schema.dropTableIfExists('branches');

  // ─── 4. Simplify tenant statuses ────────────────────────────────────
  // PAUSED → SUSPENDED (subscription expired or admin action)
  await knex('tenants').where('status', 'PAUSED').update({ status: 'SUSPENDED' });

  // PENDING_KYC → ACTIVE (auto-approve existing pending tenants)
  await knex('tenants').where('status', 'PENDING_KYC').update({ status: 'ACTIVE' });

  // REJECTED → SUSPENDED
  await knex('tenants').where('status', 'REJECTED').update({ status: 'SUSPENDED' });

  // ─── 5. Change tenants.status default ───────────────────────────────
  const hasTenants = await knex.schema.hasTable('tenants');
  if (hasTenants) {
    await knex.schema.alterTable('tenants', (table) => {
      table.string('status', 50).defaultTo('ACTIVE').alter();
    });
  }

  // ─── 6. Drop max_branches from tenants ──────────────────────────────
  if (hasTenants) {
    const hasMaxBranches = await knex.schema.hasColumn('tenants', 'max_branches');
    if (hasMaxBranches) {
      await knex.schema.alterTable('tenants', (table) => {
        table.dropColumn('max_branches');
      });
    }
  }

  // ─── 7. Drop max_branches from subscription_plans ───────────────────
  const hasPlans = await knex.schema.hasTable('subscription_plans');
  if (hasPlans) {
    const hasMaxBranches = await knex.schema.hasColumn('subscription_plans', 'max_branches');
    if (hasMaxBranches) {
      await knex.schema.alterTable('subscription_plans', (table) => {
        table.dropColumn('max_branches');
      });
    }
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // NOTE: This down migration cannot fully restore dropped data.
  // It only re-creates the structural changes.

  // Restore tenants.status default
  const hasTenants = await knex.schema.hasTable('tenants');
  if (hasTenants) {
    await knex.schema.alterTable('tenants', (table) => {
      table.string('status', 50).defaultTo('PENDING_KYC').alter();
    });
  }

  // Revert SUSPENDED back to PAUSED (best-effort)
  if (hasTenants) {
    await knex('tenants').where('status', 'SUSPENDED').update({ status: 'PAUSED' });
  }
}
