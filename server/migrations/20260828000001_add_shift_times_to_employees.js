/**
 * Migration 29: Add shift_start and shift_end columns to employees table
 * These columns are used by the auto-checkout cron job to determine
 * when to automatically check out employees who forgot to check out.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('employees');
  if (hasTable) {
    const hasShiftStart = await knex.schema.hasColumn('employees', 'shift_start');
    if (!hasShiftStart) {
      await knex.schema.alterTable('employees', (table) => {
        table.time('shift_start').defaultTo('09:00:00').nullable().after('is_active');
      });
    }

    const hasShiftEnd = await knex.schema.hasColumn('employees', 'shift_end');
    if (!hasShiftEnd) {
      await knex.schema.alterTable('employees', (table) => {
        table.time('shift_end').defaultTo('22:00:00').nullable().after('shift_start');
      });
    }
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasTable = await knex.schema.hasTable('employees');
  if (hasTable) {
    const hasShiftEnd = await knex.schema.hasColumn('employees', 'shift_end');
    if (hasShiftEnd) {
      await knex.schema.alterTable('employees', (table) => {
        table.dropColumn('shift_end');
      });
    }

    const hasShiftStart = await knex.schema.hasColumn('employees', 'shift_start');
    if (hasShiftStart) {
      await knex.schema.alterTable('employees', (table) => {
        table.dropColumn('shift_start');
      });
    }
  }
}
