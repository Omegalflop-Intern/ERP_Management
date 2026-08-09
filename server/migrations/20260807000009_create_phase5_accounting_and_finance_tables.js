/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasAccounts = await knex.schema.hasTable('accounts');
  if (!hasAccounts) {
    await knex.schema.createTable('accounts', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('code', 50).notNullable();
      table.string('name', 255).notNullable();
      table.string('type', 50).notNullable();
      table.string('sub_type', 50).notNullable();
      table.integer('parent_id').nullable().index();
      table.text('description').nullable();
      table.boolean('is_active').defaultTo(true);
      table.decimal('balance', 14, 2).defaultTo(0);
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['tenant_id', 'code']);
    });
  }

  const hasJournals = await knex.schema.hasTable('journal_entries');
  if (!hasJournals) {
    await knex.schema.createTable('journal_entries', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('entry_number', 100).notNullable();
      table.dateTime('date').notNullable();
      table.text('description').notNullable();
      table.string('reference', 255).nullable();
      table.json('lines').nullable();
      table.decimal('total_debit', 14, 2).notNullable();
      table.decimal('total_credit', 14, 2).notNullable();
      table.string('status', 50).defaultTo('DRAFT');
      table.string('posted_by', 255).nullable();
      table.string('voided_by', 255).nullable();
      table.dateTime('voided_at').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['tenant_id', 'entry_number']);
    });
  }

  const hasLedgers = await knex.schema.hasTable('ledger_entries');
  if (!hasLedgers) {
    await knex.schema.createTable('ledger_entries', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('transaction_id', 100).nullable();
      table.string('transaction_type', 50).notNullable();
      table.integer('account_id').notNullable().index();
      table.string('entry_type', 20).notNullable(); // DEBIT or CREDIT
      table.decimal('amount', 14, 2).notNullable();
      table.text('narration').nullable();
      table.timestamps(true, true);
    });
  }

  const hasCategories = await knex.schema.hasTable('expense_categories');
  if (!hasCategories) {
    await knex.schema.createTable('expense_categories', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('name', 255).notNullable();
      table.text('description').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['tenant_id', 'name']);
    });
  }

  const hasExpenses = await knex.schema.hasTable('expenses');
  if (!hasExpenses) {
    await knex.schema.createTable('expenses', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('title', 255).notNullable();
      table.string('category', 100).defaultTo('Miscellaneous');
      table.decimal('amount', 14, 2).notNullable();
      table.string('payment_method', 50).defaultTo('cash');
      table.dateTime('date').defaultTo(knex.fn.now());
      table.string('voucher_number', 100).nullable();
      table.text('notes').nullable();
      table.string('recorded_by', 255).nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
    });
  }

  const hasLoans = await knex.schema.hasTable('loans');
  if (!hasLoans) {
    await knex.schema.createTable('loans', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('type', 50).defaultTo('LOAN_TAKEN');
      table.string('provider_name', 255).notNullable();
      table.text('account_number').nullable();
      table.string('phone', 50).nullable();
      table.decimal('loan_amount', 14, 2).notNullable();
      table.decimal('interest_rate', 5, 2).defaultTo(0);
      table.dateTime('borrowed_date').defaultTo(knex.fn.now());
      table.dateTime('due_date').nullable();
      table.integer('installment_count').defaultTo(1);
      table.json('installment_schedule').nullable();
      table.decimal('repaid_amount', 14, 2).defaultTo(0);
      table.string('status', 50).defaultTo('Active');
      table.text('notes').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
    });
  }

  const hasRepayments = await knex.schema.hasTable('loan_repayments');
  if (!hasRepayments) {
    await knex.schema.createTable('loan_repayments', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.integer('loan_id').notNullable().index();
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
  await knex.schema.dropTableIfExists('loan_repayments');
  await knex.schema.dropTableIfExists('loans');
  await knex.schema.dropTableIfExists('expenses');
  await knex.schema.dropTableIfExists('expense_categories');
  await knex.schema.dropTableIfExists('ledger_entries');
  await knex.schema.dropTableIfExists('journal_entries');
  await knex.schema.dropTableIfExists('accounts');
}
