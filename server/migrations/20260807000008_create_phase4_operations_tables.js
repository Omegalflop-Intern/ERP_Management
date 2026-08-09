/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasPO = await knex.schema.hasTable('purchase_orders');
  if (!hasPO) {
    await knex.schema.createTable('purchase_orders', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('po_number', 100).notNullable();
      table.integer('supplier_id').notNullable().index();
      table.string('status', 50).defaultTo('DRAFT');
      table.json('line_items').nullable();
      table.json('grn_entries').nullable();
      table.json('return_logs').nullable();
      table.integer('returned_count').defaultTo(0);
      table.decimal('returned_amount', 14, 2).defaultTo(0);
      table.dateTime('returned_date').nullable();
      table.decimal('sub_total', 14, 2).notNullable();
      table.decimal('discount', 14, 2).defaultTo(0);
      table.decimal('tax', 14, 2).defaultTo(0);
      table.decimal('net_total', 14, 2).notNullable();
      table.decimal('paid_amount', 14, 2).defaultTo(0);
      table.decimal('due_amount', 14, 2).defaultTo(0);
      table.string('payment_method', 50).defaultTo('CREDIT');
      table.dateTime('expected_delivery_date').nullable();
      table.dateTime('received_date').nullable();
      table.text('notes').nullable();
      table.string('created_by', 255).nullable();
      table.string('approved_by', 255).nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['tenant_id', 'po_number']);
    });
  }

  const hasTx = await knex.schema.hasTable('transactions');
  if (!hasTx) {
    await knex.schema.createTable('transactions', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('invoice_number', 100).notNullable();
      table.string('tx_type', 50).notNullable();
      table.string('sale_type', 50).defaultTo('RETAIL');
      table.string('status', 50).defaultTo('COMPLETED');
      table.integer('customer_id').nullable().index();
      table.integer('supplier_id').nullable().index();
      table.json('line_items').nullable();
      table.json('return_logs').nullable();
      table.string('customer_name', 255).nullable();
      table.string('customer_phone', 50).nullable();
      table.string('customer_email', 255).nullable();
      table.text('customer_address').nullable();
      table.decimal('sub_total', 14, 2).notNullable();
      table.decimal('discount', 14, 2).defaultTo(0);
      table.decimal('tax', 14, 2).defaultTo(0);
      table.decimal('net_total', 14, 2).notNullable();
      table.decimal('returned_amount', 14, 2).defaultTo(0);
      table.json('payment_breakdown').nullable();
      table.string('cashier_username', 100).nullable();
      table.string('seller_name', 255).nullable();
      table.integer('seller_id').nullable();
      table.string('public_token', 255).nullable().index();
      table.dateTime('token_expires_at').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['tenant_id', 'invoice_number']);
    });
  }

  const hasWholesalePrice = await knex.schema.hasTable('wholesale_prices');
  if (!hasWholesalePrice) {
    await knex.schema.createTable('wholesale_prices', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.integer('product_id').notNullable().index();
      table.string('tier', 100).notNullable();
      table.integer('min_qty').notNullable().defaultTo(1);
      table.integer('max_qty').nullable();
      table.decimal('price', 14, 2).notNullable();
      table.boolean('is_active').defaultTo(true);
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
    });
  }

  const hasWholesaleOrder = await knex.schema.hasTable('wholesale_orders');
  if (!hasWholesaleOrder) {
    await knex.schema.createTable('wholesale_orders', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('order_number', 100).notNullable();
      table.integer('customer_id').notNullable().index();
      table.json('items').nullable();
      table.decimal('sub_total', 14, 2).notNullable();
      table.decimal('discount', 14, 2).defaultTo(0);
      table.decimal('grand_total', 14, 2).notNullable();
      table.decimal('paid_amount', 14, 2).defaultTo(0);
      table.decimal('due_amount', 14, 2).defaultTo(0);
      table.string('payment_method', 50).defaultTo('CASH');
      table.string('status', 50).defaultTo('PENDING');
      table.text('notes').nullable();
      table.integer('created_by').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['tenant_id', 'order_number']);
    });
  }

  const hasRepairs = await knex.schema.hasTable('repair_tickets');
  if (!hasRepairs) {
    await knex.schema.createTable('repair_tickets', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('ticket_number', 100).notNullable();
      table.string('customer_name', 255).notNullable();
      table.string('customer_phone', 50).notNullable();
      table.string('device_model', 255).notNullable();
      table.string('imei_or_serial', 100).nullable();
      table.text('issue_description').notNullable();
      table.decimal('estimated_cost', 14, 2).notNullable();
      table.decimal('advance_paid', 14, 2).defaultTo(0);
      table.string('status', 50).defaultTo('RECEIVED');
      table.string('technician_name', 255).nullable();
      table.json('parts_used').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['tenant_id', 'ticket_number']);
    });
  }

  const hasWarranties = await knex.schema.hasTable('warranty_claims');
  if (!hasWarranties) {
    await knex.schema.createTable('warranty_claims', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.integer('imei_id').notNullable().index();
      table.integer('customer_id').notNullable().index();
      table.integer('invoice_id').nullable().index();
      table.string('claim_type', 50).notNullable();
      table.text('description').notNullable();
      table.string('status', 50).defaultTo('pending').index();
      table.text('resolution').nullable();
      table.integer('resolved_by').nullable();
      table.dateTime('resolved_at').nullable();
      table.text('notes').nullable();
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
  await knex.schema.dropTableIfExists('warranty_claims');
  await knex.schema.dropTableIfExists('repair_tickets');
  await knex.schema.dropTableIfExists('wholesale_orders');
  await knex.schema.dropTableIfExists('wholesale_prices');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('purchase_orders');
}
