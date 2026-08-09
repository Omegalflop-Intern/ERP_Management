/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasNotifications = await knex.schema.hasTable('notifications');
  if (!hasNotifications) {
    await knex.schema.createTable('notifications', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.integer('user_id').notNullable().index();
      table.string('type', 50).notNullable();
      table.string('title', 255).notNullable();
      table.text('message').notNullable();
      table.boolean('is_read').defaultTo(false).index();
      table.string('link', 255).nullable();
      table.json('meta').nullable();
      table.timestamps(true, true);
    });
  }

  const hasAuditLogs = await knex.schema.hasTable('audit_logs');
  if (!hasAuditLogs) {
    await knex.schema.createTable('audit_logs', (table) => {
      table.increments('id').primary();
      table.integer('user_id').nullable().index();
      table.string('username', 100).nullable();
      table.string('full_name', 255).nullable();
      table.string('role_name', 100).nullable();
      table.string('phone', 50).nullable();
      table.integer('tenant_id').nullable().index();
      table.string('action', 100).notNullable();
      table.string('module', 100).nullable().index();
      table.integer('entity_id').nullable();
      table.string('entity_type', 100).nullable();
      table.json('details').nullable();
      table.string('ip_address', 50).nullable();
      table.string('user_agent', 255).nullable();
      table.timestamps(true, true);
    });
  }

  const hasDocuments = await knex.schema.hasTable('document_vaults');
  if (!hasDocuments) {
    await knex.schema.createTable('document_vaults', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').nullable().index();
      table.string('entity_type', 100).notNullable();
      table.integer('entity_id').notNullable();
      table.string('document_type', 100).defaultTo('Other');
      table.string('title', 255).notNullable();
      table.string('file_name', 255).notNullable();
      table.string('file_path', 500).notNullable();
      table.bigInteger('file_size').notNullable();
      table.string('mime_type', 100).notNullable();
      table.text('notes').nullable();
      table.string('uploaded_by', 255).nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.timestamps(true, true);
      table.index(['entity_type', 'entity_id']);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('document_vaults');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('notifications');
}
