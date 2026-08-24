/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('recurring_expenses');
  if (!exists) {
    await knex.schema.createTable('recurring_expenses', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().nullable();
      table.integer('branch_id').unsigned().nullable();
      table.string('title', 255).notNullable();
      table.string('category', 100).defaultTo('Miscellaneous');
      table.decimal('amount', 12, 2).notNullable();
      table.string('payment_method', 50).defaultTo('Cash');
      table.string('frequency', 20).notNullable(); // MONTHLY, WEEKLY, YEARLY, QUARTERLY
      table.date('start_date').notNullable();
      table.date('end_date').nullable();
      table.date('next_due_date').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const exists = await knex.schema.hasTable('recurring_expenses');
  if (exists) {
    await knex.schema.dropTableIfExists('recurring_expenses');
  }
}
