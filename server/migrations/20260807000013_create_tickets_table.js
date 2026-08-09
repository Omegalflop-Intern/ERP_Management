/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('tickets');
  if (!exists) {
    await knex.schema.createTable('tickets', (table) => {
      table.increments('id').primary();
      table.string('ticket_number', 50).notNullable().unique();
      table.integer('tenant_id').notNullable().index();
      table.integer('user_id').notNullable().index();
      table.string('subject', 255).notNullable();
      table.string('category', 50).defaultTo('General');
      table.string('priority', 20).defaultTo('MEDIUM');
      table.text('description').notNullable();
      table.string('contact_phone', 50).nullable();
      table.string('contact_email', 150).nullable();
      table.string('status', 20).defaultTo('OPEN').index(); // OPEN, IN_PROGRESS, RESOLVED, CLOSED
      table.text('resolution_notes').nullable();
      table.integer('resolved_by').nullable();
      table.timestamp('resolved_at').nullable();
      table.timestamps(true, true);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('tickets');
}
