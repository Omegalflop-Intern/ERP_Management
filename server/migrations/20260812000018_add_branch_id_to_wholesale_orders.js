/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('wholesale_orders');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('wholesale_orders', 'branch_id');
    if (!hasColumn) {
      await knex.schema.table('wholesale_orders', (table) => {
        table.integer('branch_id').nullable().index();
      });
    }
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasTable = await knex.schema.hasTable('wholesale_orders');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('wholesale_orders', 'branch_id');
    if (hasColumn) {
      await knex.schema.table('wholesale_orders', (table) => {
        table.dropColumn('branch_id');
      });
    }
  }
}
