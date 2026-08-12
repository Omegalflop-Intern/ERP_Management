/**
 * Migration: Add branch_id to audit_logs table.
 * This allows branch-scoped filtering of audit logs for multi-branch tenants.
 */

export async function up(knex) {
  const hasBranchId = await knex.schema.hasColumn('audit_logs', 'branch_id');
  if (!hasBranchId) {
    await knex.schema.alterTable('audit_logs', (table) => {
      table.integer('branch_id').nullable().index().after('tenant_id');
    });
  }
}

export async function down(knex) {
  const hasBranchId = await knex.schema.hasColumn('audit_logs', 'branch_id');
  if (hasBranchId) {
    await knex.schema.alterTable('audit_logs', (table) => {
      table.dropColumn('branch_id');
    });
  }
}
