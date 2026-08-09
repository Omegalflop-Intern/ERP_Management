/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasBranches = await knex.schema.hasTable('branches');
  if (!hasBranches) {
    await knex.schema.createTable('branches', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('name', 255).notNullable();
      table.text('address').nullable();
      table.string('phone', 50).nullable();
      table.string('email', 255).nullable();
      table.integer('manager_id').nullable().index();
      table.boolean('is_active').defaultTo(true);
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);

      table.unique(['tenant_id', 'name']);
    });
  }

  const hasSettings = await knex.schema.hasTable('settings');
  if (!hasSettings) {
    await knex.schema.createTable('settings', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('key', 100).notNullable();
      table.json('value').notNullable();
      table.string('category', 50).defaultTo('general');
      table.integer('updated_by').nullable();
      table.timestamps(true, true);

      table.unique(['tenant_id', 'key']);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('settings');
  await knex.schema.dropTableIfExists('branches');
}
