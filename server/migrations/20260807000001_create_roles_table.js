/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('roles');
  if (!exists) {
    await knex.schema.createTable('roles', (table) => {
      table.increments('id').primary();
      table.string('tenant_id', 36).nullable().index();
      table.string('name', 50).notNullable();
      table.string('display_name', 100).notNullable();
      table.text('description').nullable();
      table.json('permissions').notNullable();
      table.boolean('is_system').defaultTo(false);
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);

      table.unique(['tenant_id', 'name']);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('roles');
}
