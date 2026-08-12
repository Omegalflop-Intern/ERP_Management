/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('transactions', 'notes');
  if (!hasColumn) {
    await knex.schema.alterTable('transactions', (table) => {
      table.text('notes').nullable();
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('transactions', 'notes');
  if (hasColumn) {
    await knex.schema.alterTable('transactions', (table) => {
      table.dropColumn('notes');
    });
  }
}
