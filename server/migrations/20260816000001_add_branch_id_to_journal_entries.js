/**
 * Migration: Add branch_id to journal_entries for branch-level accounting isolation
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('journal_entries');
  if (hasTable) {
    const hasBranchId = await knex.schema.hasColumn('journal_entries', 'branch_id');
    if (!hasBranchId) {
      await knex.schema.alterTable('journal_entries', (table) => {
        table.integer('branch_id').unsigned().nullable().references('id').inTable('branches').onDelete('SET NULL');
      });
    }
  }
}

export async function down(knex) {
  const hasTable = await knex.schema.hasTable('journal_entries');
  if (hasTable) {
    const hasBranchId = await knex.schema.hasColumn('journal_entries', 'branch_id');
    if (hasBranchId) {
      await knex.schema.alterTable('journal_entries', (table) => {
        table.dropColumn('branch_id');
      });
    }
  }
}
