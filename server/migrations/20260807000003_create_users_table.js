/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('users');
  if (!exists) {
    await knex.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('username', 100).notNullable();
      table.string('email', 255).notNullable();
      table.string('phone', 50).nullable();
      table.string('password_hash', 255).notNullable();
      table.integer('role_id').notNullable().index();
      table.string('role_name', 50).notNullable();
      table.string('full_name', 255).nullable();
      table.string('avatar', 255).nullable();
      table.boolean('is_active').defaultTo(true);
      table.boolean('is_verified').defaultTo(false);
      table.integer('branch_id').nullable().index();
      table.integer('tenant_id').nullable().index();
      table.decimal('commission_rate', 5, 2).defaultTo(0);
      table.string('otp_code', 20).nullable();
      table.dateTime('otp_expires_at').nullable();
      table.integer('otp_attempts').defaultTo(0);
      table.dateTime('otp_locked_until').nullable();
      table.string('mfa_secret', 255).nullable();
      table.boolean('is_mfa_enabled').defaultTo(false);
      table.integer('failed_login_attempts').defaultTo(0);
      table.dateTime('lock_until').nullable();
      table.dateTime('last_login_at').nullable();
      table.string('password_reset_token', 255).nullable();
      table.dateTime('password_reset_expires').nullable();
      table.boolean('is_deleted').defaultTo(false);
      table.boolean('is_temp_admin').defaultTo(false);
      table.timestamps(true, true);

      table.unique(['tenant_id', 'username']);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('users');
}
