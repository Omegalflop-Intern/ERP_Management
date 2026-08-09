/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('sessions');
  if (!exists) {
    await knex.schema.createTable('sessions', (table) => {
      table.increments('id').primary();
      table.integer('user_id').notNullable().index();
      table.text('refresh_token').notNullable();
      table.string('ip_address', 100).nullable();
      table.text('user_agent').nullable();
      table.string('device_info', 255).nullable();
      table.boolean('is_valid').defaultTo(true);
      table.dateTime('expires_at').notNullable().index();
      table.timestamps(true, true);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('sessions');
}
