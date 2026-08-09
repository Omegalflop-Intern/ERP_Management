/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasTenants = await knex.schema.hasTable('tenants');
  if (!hasTenants) {
    await knex.schema.createTable('tenants', (table) => {
      table.increments('id').primary();
      table.string('shop_name', 255).notNullable();
      table.string('logo', 255).nullable();
      table.string('owner_name', 255).notNullable();
      table.string('email', 255).notNullable().unique();
      table.string('phone', 50).notNullable();
      table.string('plan', 50).defaultTo('STARTER');
      table.string('status', 50).defaultTo('PENDING_KYC');
      table.integer('max_branches').defaultTo(2);
      table.integer('max_users').defaultTo(5);
      table.dateTime('expires_at').nullable();
      table.string('nid_number', 100).nullable();
      table.string('nid_front', 255).nullable();
      table.string('nid_back', 255).nullable();
      table.string('trade_license_number', 100).nullable();
      table.string('trade_license_file', 255).nullable();
      table.string('tin_certificate', 255).nullable();
      table.string('owner_photo', 255).nullable();
      table.string('kyc_status', 50).defaultTo('PENDING');
      table.text('rejection_reason').nullable();
      table.dateTime('reviewed_at').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.text('paused_reason').nullable();
      table.dateTime('paused_at').nullable();
      table.integer('grace_period_days').defaultTo(0);
      table.dateTime('last_warning_sent').nullable();
      table.string('subdomain', 100).nullable().unique();
      table.string('custom_domain', 255).nullable().unique();
      table.timestamps(true, true);
    });
  }

  const hasSubPlans = await knex.schema.hasTable('subscription_plans');
  if (!hasSubPlans) {
    await knex.schema.createTable('subscription_plans', (table) => {
      table.increments('id').primary();
      table.string('name', 100).notNullable().unique();
      table.string('display_name', 255).notNullable();
      table.text('description').nullable();
      table.decimal('monthly_price', 12, 2).defaultTo(0);
      table.decimal('yearly_price', 12, 2).defaultTo(0);
      table.integer('trial_days').defaultTo(0);
      table.integer('max_branches').defaultTo(1);
      table.integer('max_users').defaultTo(3);
      table.integer('max_products').defaultTo(-1);
      table.integer('max_customers').defaultTo(-1);
      table.integer('max_storage_mb').defaultTo(-1);
      table.json('features').nullable();
      table.boolean('is_public').defaultTo(true);
      table.integer('sort_order').defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });
  }

  const hasTempAdmins = await knex.schema.hasTable('temp_admins');
  if (!hasTempAdmins) {
    await knex.schema.createTable('temp_admins', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').notNullable().index();
      table.integer('user_id').notNullable().index();
      table.integer('created_by').notNullable().index();
      table.text('reason').nullable();
      table.bigInteger('duration').notNullable();
      table.dateTime('expires_at').notNullable();
      table.string('status', 50).defaultTo('ACTIVE');
      table.dateTime('last_login_at').nullable();
      table.dateTime('revoked_at').nullable();
      table.integer('revoked_by').nullable();
      table.timestamps(true, true);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('temp_admins');
  await knex.schema.dropTableIfExists('subscription_plans');
  await knex.schema.dropTableIfExists('tenants');
}
