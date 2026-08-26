/**
 * Migration: Allow NULL imei_id in warranty_claims table for non-IMEI and wholesale products.
 *
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('warranty_claims');
  if (hasTable) {
    await knex.schema.alterTable('warranty_claims', (table) => {
      table.integer('imei_id').nullable().alter();
    });
  }
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  const hasTable = await knex.schema.hasTable('warranty_claims');
  if (hasTable) {
    await knex.schema.alterTable('warranty_claims', (table) => {
      table.integer('imei_id').notNullable().alter();
    });
  }
}
