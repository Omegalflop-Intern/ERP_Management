/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('wholesale_orders');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('wholesale_orders', 'branch_id');
    if (!hasColumn) {
      await knex.schema.table('wholesale_orders', (table) => {
        table.integer('branch_id').nullable().index();
      });
      console.log('  ✅ Added branch_id to wholesale_orders');
    } else {
      console.log('  ⏭️  branch_id already exists on wholesale_orders');
    }
  } else {
    console.log('  ⚠️  Table wholesale_orders not found, skipping');
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasTable = await knex.schema.hasTable('wholesale_orders');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('wholesale_orders', 'branch_id');
    if (hasColumn) {
      await knex.schema.table('wholesale_orders', (table) => {
        table.dropColumn('branch_id');
      });
    }
  }
}
