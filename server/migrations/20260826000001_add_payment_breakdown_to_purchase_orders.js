/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('purchase_orders');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('purchase_orders', 'payment_breakdown');
    if (!hasColumn) {
      await knex.schema.alterTable('purchase_orders', (table) => {
        table.json('payment_breakdown').nullable().after('payment_method');
      });
    }
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasTable = await knex.schema.hasTable('purchase_orders');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('purchase_orders', 'payment_breakdown');
    if (hasColumn) {
      await knex.schema.alterTable('purchase_orders', (table) => {
        table.dropColumn('payment_breakdown');
      });
    }
  }
}
