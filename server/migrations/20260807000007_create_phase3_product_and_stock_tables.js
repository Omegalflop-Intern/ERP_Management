/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) {
    await knex.schema.createTable('products', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('name', 255).notNullable();
      table.string('brand', 100).notNullable();
      table.string('category', 100).notNullable();
      table.string('model', 100).nullable();
      table.string('sku', 100).notNullable();
      table.string('barcode', 100).nullable().index();
      table.string('ram', 50).nullable();
      table.string('storage', 50).nullable();
      table.string('color', 50).nullable();
      table.decimal('cost_price', 14, 2).notNullable();
      table.decimal('selling_price', 14, 2).notNullable();
      table.decimal('wholesale_price', 14, 2).nullable();
      table.decimal('vat_rate', 5, 2).defaultTo(0);
      table.string('unit', 50).defaultTo('piece');
      table.integer('min_stock_alert').defaultTo(2);
      table.integer('stock_quantity').defaultTo(0);
      table.integer('warranty_months').defaultTo(12);
      table.string('image', 255).nullable();
      table.text('description').nullable();
      table.boolean('is_active').defaultTo(true);
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['tenant_id', 'sku']);
    });
  }

  const hasInventory = await knex.schema.hasTable('inventory_units');
  if (!hasInventory) {
    await knex.schema.createTable('inventory_units', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('imei_or_serial', 100).notNullable().index();
      table.integer('product_id').notNullable().index();
      table.integer('branch_id').nullable().index();
      table.integer('supplier_id').nullable().index();
      table.string('status', 50).defaultTo('Available').index();
      table.decimal('purchase_price', 14, 2).notNullable();
      table.decimal('current_selling_price', 14, 2).notNullable();
      table.integer('warranty_months').defaultTo(12);
      table.dateTime('warranty_expiry').nullable();
      table.string('color', 50).nullable();
      table.string('ram', 50).nullable();
      table.string('storage', 50).nullable();
      table.integer('sold_to_customer_id').nullable();
      table.string('sold_invoice_number', 100).nullable();
      table.dateTime('sold_at').nullable();
      table.json('passport_history').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['tenant_id', 'imei_or_serial']);
    });
  }

  const hasTransfers = await knex.schema.hasTable('stock_transfers');
  if (!hasTransfers) {
    await knex.schema.createTable('stock_transfers', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('transfer_number', 100).notNullable();
      table.integer('from_branch_id').notNullable().index();
      table.integer('to_branch_id').notNullable().index();
      table.integer('product_id').notNullable().index();
      table.string('imei_or_serial', 100).nullable();
      table.integer('quantity').defaultTo(1);
      table.string('status', 50).defaultTo('PENDING');
      table.text('notes').nullable();
      table.string('transferred_by', 255).nullable();
      table.dateTime('delivered_at').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.unique(['tenant_id', 'transfer_number']);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('stock_transfers');
  await knex.schema.dropTableIfExists('inventory_units');
  await knex.schema.dropTableIfExists('products');
}
