/**
 * Migration: Add branch_id to shared entities (products, suppliers, investors, loans, accounts, document_vaults)
 */
export async function up(knex) {
  const tables = ['products', 'suppliers', 'investors', 'loans', 'accounts', 'document_vaults'];

  for (const tableName of tables) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (hasTable) {
      const hasBranchId = await knex.schema.hasColumn(tableName, 'branch_id');
      if (!hasBranchId) {
        await knex.schema.alterTable(tableName, (table) => {
          table.integer('branch_id').unsigned().nullable().references('id').inTable('branches').onDelete('SET NULL');
        });
      }
    }
  }
}

export async function down(knex) {
  const tables = ['products', 'suppliers', 'investors', 'loans', 'accounts', 'document_vaults'];

  for (const tableName of tables) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (hasTable) {
      const hasBranchId = await knex.schema.hasColumn(tableName, 'branch_id');
      if (hasBranchId) {
        await knex.schema.alterTable(tableName, (table) => {
          table.dropColumn('branch_id');
        });
      }
    }
  }
}
