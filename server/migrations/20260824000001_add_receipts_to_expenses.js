/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('expenses', 'receipts');
  if (!hasColumn) {
    await knex.schema.alterTable('expenses', (table) => {
      table.json('receipts').nullable();
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('expenses', 'receipts');
  if (hasColumn) {
    await knex.schema.alterTable('expenses', (table) => {
      table.dropColumn('receipts');
    });
  }
}
