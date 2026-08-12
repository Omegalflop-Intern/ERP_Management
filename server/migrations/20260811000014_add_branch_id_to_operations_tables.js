/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const tables = ['transactions', 'customers', 'purchase_orders', 'expenses', 'repair_tickets'];

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
  const tables = ['transactions', 'customers', 'purchase_orders', 'expenses', 'repair_tickets'];

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
