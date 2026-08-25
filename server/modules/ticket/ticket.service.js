import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';
import { createBulkNotifications } from '../notification/notification.service.js';
import { sendTicketCreatedAdminEmail } from '../../config/mailer.js';
import emitter, { EVENTS } from '../../events/index.js';
import { formatTicket, ensureTicketsTableExists } from './ticket.model.js';

export const generateTicketNumber = async () => {
  await ensureTicketsTableExists();
  const todayPrefix = `TCK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const latest = await db('tickets')
    .where('ticket_number', 'like', `${todayPrefix}%`)
    .orderBy('id', 'desc')
    .first();

  let seq = 1;
  if (latest && latest.ticket_number) {
    const parts = latest.ticket_number.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }
  return `${todayPrefix}-${String(seq).padStart(4, '0')}`;
};

export const createTicket = async ({ tenantId, userId, subject, category, priority, description, contactPhone, contactEmail }) => {
  if (!tenantId) {
    throw ApiError.badRequest('Ticket must be associated with a shop tenant');
  }
  await ensureTicketsTableExists();

  const ticketNumber = await generateTicketNumber();

  const [insertedId] = await db('tickets').insert({
    ticket_number: ticketNumber,
    tenant_id: tenantId,
    user_id: userId,
    subject,
    category: category || 'General',
    priority: priority || 'MEDIUM',
    description,
    contact_phone: contactPhone || null,
    contact_email: contactEmail || null,
    status: 'OPEN',
  });

  const rawTicket = await db('tickets').where({ id: insertedId }).first();
  const ticket = formatTicket(rawTicket);

  // Fetch shop details & user details for notification & email
  const tenant = await db('tenants').where({ id: tenantId }).first();
  const creator = await db('users').where({ id: userId }).first();

  const ticketMeta = {
    ...ticket,
    shopName: tenant?.shop_name || 'Shop',
    shopSubdomain: tenant?.subdomain || '',
    createdByName: creator?.full_name || creator?.username || 'Shop Staff',
    createdByEmail: creator?.email || '',
  };

  // 1. Send In-App Notifications to Super Admin users (users where tenant_id is null and role_name = 'ADMIN' or System Administrator)
  try {
    const adminUsers = await db('users')
      .where({ is_deleted: false, is_active: true })
      .whereNull('tenant_id')
      .select('id');

    if (adminUsers.length > 0) {
      await createBulkNotifications(
        adminUsers.map((u) => ({ userId: u.id, tenantId: null })),
        {
          type: 'TICKET_CREATED',
          title: `New Support Ticket #${ticketNumber}`,
          message: `Shop "${tenant?.shop_name || 'Shop'}" created a ticket: "${subject}"`,
          link: '/super-admin/tickets',
          meta: { ticketId: ticket.id, ticketNumber, tenantId },
        }
      );
    }
  } catch (err) {
    console.error('[Ticket Notification Error]:', err.message);
  }

  // 2. Emit Real-time SSE Event
  emitter.emit(EVENTS.TICKET_CREATED || 'ticket:created', ticketMeta);

  // 3. Send Email Notification to Admin
  sendTicketCreatedAdminEmail(ticketMeta).catch((err) =>
    console.error('[Ticket Admin Email Error]:', err.message)
  );

  return ticketMeta;
};

export const getShopTickets = async (tenantId, page = 1, limit = 20, status = null, search = null) => {
  await ensureTicketsTableExists();

  const countQ = db('tickets').where({ tenant_id: tenantId });
  const dataQ = db('tickets').where({ tenant_id: tenantId });

  if (status && status !== 'ALL') {
    countQ.where({ status });
    dataQ.where({ status });
  }

  if (search) {
    const s = `%${search}%`;
    countQ.where(function () {
      this.where('subject', 'like', s)
        .orWhere('ticket_number', 'like', s)
        .orWhere('category', 'like', s);
    });
    dataQ.where(function () {
      this.where('subject', 'like', s)
        .orWhere('ticket_number', 'like', s)
        .orWhere('category', 'like', s);
    });
  }

  const countRes = await countQ.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const rows = await dataQ.orderBy('created_at', 'desc').limit(limit).offset(offset);

  const tickets = rows.map(formatTicket);
  return { tickets, pagination: getPagination(total, page, limit) };
};

export const getAllTicketsAdmin = async (page = 1, limit = 20, filters = {}) => {
  await ensureTicketsTableExists();

  const { tenantId, status, priority, search } = filters;

  let query = db('tickets as t')
    .leftJoin('tenants as tn', 't.tenant_id', 'tn.id')
    .leftJoin('users as u', 't.user_id', 'u.id')
    .select(
      't.*',
      'tn.shop_name as shop_name',
      'tn.subdomain as shop_subdomain',
      'u.full_name as created_by_name',
      'u.email as created_by_email'
    );

  let countQuery = db('tickets as t');

  if (tenantId) {
    query.where('t.tenant_id', tenantId);
    countQuery.where('t.tenant_id', tenantId);
  }

  if (status && status !== 'ALL') {
    query.where('t.status', status);
    countQuery.where('t.status', status);
  }

  if (priority && priority !== 'ALL') {
    query.where('t.priority', priority);
    countQuery.where('t.priority', priority);
  }

  if (search) {
    const s = `%${search}%`;
    query.where(function () {
      this.where('t.subject', 'like', s)
        .orWhere('t.ticket_number', 'like', s)
        .orWhere('t.category', 'like', s)
        .orWhere('tn.shop_name', 'like', s);
    });
    countQuery.where(function () {
      this.where('t.subject', 'like', s)
        .orWhere('t.ticket_number', 'like', s)
        .orWhere('t.category', 'like', s);
    });
  }

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const rows = await query.orderBy('t.created_at', 'desc').limit(limit).offset(offset);

  const tickets = rows.map(formatTicket);
  return { tickets, pagination: getPagination(total, page, limit) };
};

export const getTicketById = async (id, tenantId = null) => {
  await ensureTicketsTableExists();

  let query = db('tickets as t')
    .leftJoin('tenants as tn', 't.tenant_id', 'tn.id')
    .leftJoin('users as u', 't.user_id', 'u.id')
    .select(
      't.*',
      'tn.shop_name as shop_name',
      'tn.subdomain as shop_subdomain',
      'u.full_name as created_by_name',
      'u.email as created_by_email'
    )
    .where('t.id', id);

  if (tenantId) {
    query.andWhere('t.tenant_id', tenantId);
  }

  const row = await query.first();
  if (!row) throw ApiError.notFound('Support ticket not found');

  return formatTicket(row);
};

export const updateTicketStatus = async (id, { status, resolutionNotes }, adminUserId) => {
  await ensureTicketsTableExists();

  const ticket = await db('tickets').where({ id }).first();
  if (!ticket) throw ApiError.notFound('Support ticket not found');

  const updateFields = {
    status,
    updated_at: new Date(),
  };

  if (status === 'RESOLVED' || status === 'CLOSED') {
    updateFields.resolution_notes = resolutionNotes || ticket.resolution_notes || 'Resolved by Administrator';
    updateFields.resolved_by = adminUserId || null;
    updateFields.resolved_at = new Date();
  } else if (resolutionNotes !== undefined) {
    updateFields.resolution_notes = resolutionNotes;
  }

  await db('tickets').where({ id }).update(updateFields);

  const updatedRaw = await db('tickets as t')
    .leftJoin('tenants as tn', 't.tenant_id', 'tn.id')
    .leftJoin('users as u', 't.user_id', 'u.id')
    .select(
      't.*',
      'tn.shop_name as shop_name',
      'tn.subdomain as shop_subdomain',
      'u.full_name as created_by_name',
      'u.email as created_by_email'
    )
    .where('t.id', id)
    .first();

  const updatedTicket = formatTicket(updatedRaw);

  // Notify the shop user that their ticket status was updated
  try {
    const shopUsers = await db('users')
      .where({ tenant_id: ticket.tenant_id, is_deleted: false, is_active: true })
      .select('id');

    if (shopUsers.length > 0) {
      await createBulkNotifications(
        shopUsers.map((u) => ({ userId: u.id, tenantId: ticket.tenant_id })),
        {
          type: 'TICKET_RESOLVED',
          title: `Ticket #${ticket.ticket_number} Updated`,
          message: `Your support ticket status is now "${status}".`,
          link: '/support',
          meta: { ticketId: id, status },
        }
      );
    }
  } catch (err) {
    console.error('[Ticket Resolved Notification Error]:', err.message);
  }

  emitter.emit(EVENTS.TICKET_RESOLVED || 'ticket:resolved', updatedTicket);

  return updatedTicket;
};

export const deleteTicket = async (id, tenantId = null) => {
  await ensureTicketsTableExists();
  const query = db('tickets').where({ id });
  if (tenantId) query.andWhere('tenant_id', tenantId);
  const ticket = await query.first();
  if (!ticket) throw ApiError.notFound('Support ticket not found');
  // Bug #11 fixed: Use soft-delete to preserve audit trail.
  // Hard .del() breaks reporting and is inconsistent with all other 33 modules.
  await db('tickets').where({ id }).update({ is_deleted: true, updated_at: new Date() });
  return { success: true };
};

export const bulkDeleteTickets = async (ticketIds = [], tenantId = null) => {
  await ensureTicketsTableExists();
  if (!Array.isArray(ticketIds) || ticketIds.length === 0) return { deletedCount: 0 };
  const query = db('tickets').whereIn('id', ticketIds);
  if (tenantId) query.andWhere('tenant_id', tenantId);
  // Bug #11 fixed: Use soft-delete for bulk operations as well.
  const deletedCount = await query.update({ is_deleted: true, updated_at: new Date() });
  return { deletedCount };
};
