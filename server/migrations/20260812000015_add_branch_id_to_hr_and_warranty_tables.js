/**
 * Migration: Add branch_id to remaining tables for full branch isolation
 * Tables: warranty_claims, attendances, leaves, payrolls, employees
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const tables = ['warranty_claims', 'attendances', 'leaves', 'payrolls', 'employees'];

  for (const tableName of tables) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (hasTable) {
      const hasColumn = await knex.schema.hasColumn(tableName, 'branch_id');
      if (!hasColumn) {
        await knex.schema.table(tableName, (table) => {
          table.integer('branch_id').nullable().index();
        });
      }
    }
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const tables = ['warranty_claims', 'attendances', 'leaves', 'payrolls', 'employees'];

  for (const tableName of tables) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (hasTable) {
      const hasColumn = await knex.schema.hasColumn(tableName, 'branch_id');
      if (hasColumn) {
        await knex.schema.table(tableName, (table) => {
          table.dropColumn('branch_id');
        });
      }
    }
  }
}
