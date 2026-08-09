export async function up(knex) {
  const exists = await knex.schema.hasTable('contact_messages');
  if (!exists) {
    await knex.schema.createTable('contact_messages', (table) => {
      table.increments('id').primary();
      table.string('name', 150).notNullable();
      table.string('phone', 50).notNullable();
      table.string('email', 150).nullable();
      table.string('shop_name', 150).nullable();
      table.text('message').notNullable();
      table.string('status', 50).defaultTo('PENDING'); // PENDING, READ, REPLIED
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
    });
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('contact_messages');
}
