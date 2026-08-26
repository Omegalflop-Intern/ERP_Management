/**
 * Migration: Add is_deleted column to tickets table
 *
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('tickets');
  if (hasTable) {
    const hasCol = await knex.schema.hasColumn('tickets', 'is_deleted');
    if (!hasCol) {
      await knex.schema.alterTable('tickets', (table) => {
        table.boolean('is_deleted').defaultTo(false).index();
      });
    }
  }
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  const hasTable = await knex.schema.hasTable('tickets');
  if (hasTable) {
    const hasCol = await knex.schema.hasColumn('tickets', 'is_deleted');
    if (hasCol) {
      await knex.schema.alterTable('tickets', (table) => {
        table.dropColumn('is_deleted');
      });
    }
  }
}
