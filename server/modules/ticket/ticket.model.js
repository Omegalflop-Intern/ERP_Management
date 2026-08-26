import { db } from '../../config/db.knex.js';

export function formatTicket(row) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    ticketNumber: row.ticket_number,
    tenantId: row.tenant_id,
    userId: row.user_id,
    subject: row.subject,
    category: row.category || 'General',
    priority: row.priority || 'MEDIUM',
    description: row.description,
    contactPhone: row.contact_phone || null,
    contactEmail: row.contact_email || null,
    status: row.status || 'OPEN',
    resolutionNotes: row.resolution_notes || null,
    resolvedBy: row.resolved_by || null,
    resolvedAt: row.resolved_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    // Joined tenant/user info if present
    shopName: row.shop_name || null,
    shopSubdomain: row.shop_subdomain || null,
    createdByName: row.created_by_name || null,
    createdByEmail: row.created_by_email || null,
  };
}

export async function ensureTicketsTableExists() {
  const exists = await db.schema.hasTable('tickets');
  if (!exists) {
    await db.schema.createTable('tickets', (table) => {
      table.increments('id').primary();
      table.string('ticket_number', 50).notNullable().unique();
      table.integer('tenant_id').notNullable().index();
      table.integer('user_id').notNullable().index();
      table.string('subject', 255).notNullable();
      table.string('category', 50).defaultTo('General');
      table.string('priority', 20).defaultTo('MEDIUM');
      table.text('description').notNullable();
      table.string('contact_phone', 50).nullable();
      table.string('contact_email', 150).nullable();
      table.string('status', 20).defaultTo('OPEN').index();
      table.text('resolution_notes').nullable();
      table.integer('resolved_by').nullable();
      table.timestamp('resolved_at').nullable();
      table.boolean('is_deleted').defaultTo(false).index();
      table.timestamps(true, true);
    });
  } else {
    const hasDeleted = await db.schema.hasColumn('tickets', 'is_deleted');
    if (!hasDeleted) {
      await db.schema.alterTable('tickets', (table) => {
        table.boolean('is_deleted').defaultTo(false).index();
      });
    }
  }
}
