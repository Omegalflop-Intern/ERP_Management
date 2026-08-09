/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasCatalog = await knex.schema.hasTable('catalog_items');
  if (!hasCatalog) {
    await knex.schema.createTable('catalog_items', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('name', 255).notNullable();
      table.string('type', 50).notNullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['tenant_id', 'name', 'type']);
    });
  }

  const hasCustomers = await knex.schema.hasTable('customers');
  if (!hasCustomers) {
    await knex.schema.createTable('customers', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('name', 255).notNullable();
      table.string('phone', 255).notNullable();
      table.string('phone_hash', 255).nullable().index();
      table.string('email', 255).nullable();
      table.text('address').nullable();
      table.string('customer_type', 50).defaultTo('INDIVIDUAL');
      table.string('company_name', 255).nullable();
      table.string('bin_or_tax_id', 100).nullable();
      table.decimal('due_balance', 14, 2).defaultTo(0);
      table.decimal('total_purchases', 14, 2).defaultTo(0);
      table.text('notes').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
    });
  }

  const hasSuppliers = await knex.schema.hasTable('suppliers');
  if (!hasSuppliers) {
    await knex.schema.createTable('suppliers', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('name', 255).notNullable();
      table.string('phone', 50).notNullable();
      table.string('email', 255).nullable();
      table.string('company', 255).nullable();
      table.text('address').nullable();
      table.decimal('due_balance', 14, 2).defaultTo(0);
      table.decimal('credit_balance', 14, 2).defaultTo(0);
      table.decimal('total_purchases', 14, 2).defaultTo(0);
      table.string('payment_terms', 50).defaultTo('CASH');
      table.text('notes').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
    });
  }

  const hasEmployees = await knex.schema.hasTable('employees');
  if (!hasEmployees) {
    await knex.schema.createTable('employees', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.integer('user_id').notNullable().index();
      table.string('employee_id', 100).notNullable();
      table.string('name', 255).notNullable();
      table.string('phone', 50).notNullable();
      table.string('email', 255).nullable();
      table.string('designation', 100).notNullable();
      table.string('department', 100).notNullable();
      table.string('branch', 100).defaultTo('Main');
      table.decimal('salary', 12, 2).defaultTo(0);
      table.dateTime('joining_date').notNullable();
      table.string('emergency_contact', 50).nullable();
      table.text('address').nullable();
      table.string('blood_group', 10).defaultTo('');
      table.string('nid_number', 255).nullable();
      table.boolean('is_active').defaultTo(true);
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['tenant_id', 'employee_id']);
    });
  }

  const hasInvestors = await knex.schema.hasTable('investors');
  if (!hasInvestors) {
    await knex.schema.createTable('investors', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('name', 255).notNullable();
      table.string('phone', 50).notNullable();
      table.string('email', 255).nullable();
      table.text('address').nullable();
      table.decimal('share_percentage', 5, 2).defaultTo(0);
      table.decimal('total_invested', 14, 2).defaultTo(0);
      table.decimal('total_withdrawn', 14, 2).defaultTo(0);
      table.decimal('total_profit_paid', 14, 2).defaultTo(0);
      table.string('profile_photo', 255).nullable();
      table.string('status', 50).defaultTo('Active');
      table.text('notes').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
    });
  }

  const hasInvestorTx = await knex.schema.hasTable('investor_transactions');
  if (!hasInvestorTx) {
    await knex.schema.createTable('investor_transactions', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.integer('investor_id').notNullable().index();
      table.string('type', 50).notNullable();
      table.decimal('amount', 14, 2).notNullable();
      table.string('payment_method', 50).defaultTo('cash');
      table.string('reference', 255).nullable();
      table.text('notes').nullable();
      table.dateTime('date').defaultTo(knex.fn.now());
      table.string('recorded_by', 255).nullable();
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
  await knex.schema.dropTableIfExists('investor_transactions');
  await knex.schema.dropTableIfExists('investors');
  await knex.schema.dropTableIfExists('employees');
  await knex.schema.dropTableIfExists('suppliers');
  await knex.schema.dropTableIfExists('customers');
  await knex.schema.dropTableIfExists('catalog_items');
}
