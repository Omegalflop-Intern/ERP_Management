/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasAttendances = await knex.schema.hasTable('attendances');
  if (!hasAttendances) {
    await knex.schema.createTable('attendances', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.integer('employee_id').notNullable().index();
      table.date('date').notNullable().index();
      table.dateTime('check_in').nullable();
      table.dateTime('check_out').nullable();
      table.decimal('lat', 10, 6).nullable();
      table.decimal('lng', 10, 6).nullable();
      table.string('status', 50).defaultTo('present').index();
      table.text('notes').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['employee_id', 'date']);
    });
  }

  const hasLeaves = await knex.schema.hasTable('leaves');
  if (!hasLeaves) {
    await knex.schema.createTable('leaves', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.integer('employee_id').notNullable().index();
      table.string('type', 50).notNullable();
      table.date('from_date').notNullable();
      table.date('to_date').notNullable();
      table.integer('days').notNullable();
      table.text('reason').notNullable();
      table.string('status', 50).defaultTo('pending').index();
      table.integer('approved_by').nullable();
      table.text('rejection_reason').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
    });
  }

  const hasPayrolls = await knex.schema.hasTable('payrolls');
  if (!hasPayrolls) {
    await knex.schema.createTable('payrolls', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.integer('employee_id').notNullable().index();
      table.integer('month').notNullable();
      table.integer('year').notNullable();
      table.decimal('basic_salary', 14, 2).notNullable();
      table.json('allowances').nullable();
      table.json('deductions').nullable();
      table.decimal('total_allowances', 14, 2).defaultTo(0);
      table.decimal('total_deductions', 14, 2).defaultTo(0);
      table.decimal('net_salary', 14, 2).notNullable();
      table.string('status', 50).defaultTo('pending').index();
      table.dateTime('paid_date').nullable();
      table.integer('paid_by').nullable();
      table.text('notes').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['employee_id', 'month', 'year']);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('payrolls');
  await knex.schema.dropTableIfExists('leaves');
  await knex.schema.dropTableIfExists('attendances');
}
