/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('product_branch_stocks');
  if (!hasTable) {
    await knex.schema.createTable('product_branch_stocks', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.integer('branch_id').notNullable().index();
      table.integer('product_id').notNullable().index();
      table.integer('stock_quantity').defaultTo(0);
      table.timestamps(true, true);
      table.unique(['tenant_id', 'branch_id', 'product_id']);
    });

    // Seed existing products into product_branch_stocks
    const products = await knex('products').where({ is_deleted: false });
    for (const p of products) {
      const branchId = p.branch_id || 1; // Default to main branch if null
      const existing = await knex('product_branch_stocks')
        .where({ tenant_id: p.tenant_id, branch_id: branchId, product_id: p.id })
        .first();
      if (!existing) {
        await knex('product_branch_stocks').insert({
          tenant_id: p.tenant_id,
          branch_id: branchId,
          product_id: p.id,
          stock_quantity: Number(p.stock_quantity || 0),
        });
      }
    }

    // Apply existing delivered transfers
    const deliveredTransfers = await knex('stock_transfers')
      .where({ status: 'DELIVERED', is_deleted: false })
      .whereNull('imei_or_serial');

    for (const trf of deliveredTransfers) {
      const qty = Number(trf.quantity || 1);
      const dest = await knex('product_branch_stocks')
        .where({ tenant_id: trf.tenant_id, branch_id: trf.to_branch_id, product_id: trf.product_id })
        .first();
      if (dest) {
        await knex('product_branch_stocks')
          .where({ id: dest.id })
          .increment('stock_quantity', qty);
      } else {
        await knex('product_branch_stocks').insert({
          tenant_id: trf.tenant_id,
          branch_id: trf.to_branch_id,
          product_id: trf.product_id,
          stock_quantity: qty,
        });
      }
    }
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('product_branch_stocks');
}
