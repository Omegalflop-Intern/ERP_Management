/**
 * Migration: Set default value 'Generic' for brand column in products table
 */
export async function up(knex) {
  const hasProducts = await knex.schema.hasTable('products');
  if (hasProducts) {
    await knex.schema.alterTable('products', (table) => {
      table.string('brand', 100).defaultTo('Generic').alter();
    });
  }
}

export async function down(knex) {
  const hasProducts = await knex.schema.hasTable('products');
  if (hasProducts) {
    await knex.schema.alterTable('products', (table) => {
      table.string('brand', 100).notNullable().alter();
    });
  }
}
