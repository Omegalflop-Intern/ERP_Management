import { db } from '../../config/db.knex.js';
import { getPagination } from '../../utils/http/pagination.js';
import emitter, { EVENTS } from '../../events/index.js';

export function formatNotification(row) {
  if (!row) return null;
  let meta = row.meta;
  if (typeof meta === 'string') {
    try { meta = JSON.parse(meta); } catch { meta = {}; }
  }

  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    userId: String(row.user_id),
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: Boolean(row.is_read),
    link: row.link || null,
    meta: meta || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where('tenant_id', tenantId);
  }
}

export const createNotification = async ({ userId, type, title, message, link, meta, tenantId }) => {
  const [insertedId] = await db('notifications').insert({
    tenant_id: tenantId || null,
    user_id: userId,
    type,
    title,
    message,
    is_read: false,
    link: link || null,
    meta: meta ? JSON.stringify(meta) : null,
  });

  const nrq = db('notifications').where({ id: insertedId });
  if (tenantId) nrq.andWhere('tenant_id', tenantId);
  const row = await nrq.first();
  const notif = formatNotification(row);
  emitter.emit(EVENTS.NOTIFICATION_NEW, { ...notif, tenantId });
  return notif;
};

export const createBulkNotifications = async (users, { type, title, message, link, meta }) => {
  const docs = users.map((u) => ({
    tenant_id: u.tenantId || null,
    user_id: u.userId,
    type,
    title,
    message,
    is_read: false,
    link: link || null,
    meta: meta ? JSON.stringify(meta) : null,
  }));
  if (docs.length > 0) {
    await db('notifications').insert(docs);
    for (const u of users) {
      emitter.emit(EVENTS.NOTIFICATION_NEW, {
        type,
        title,
        message,
        link,
        tenantId: u.tenantId || null,
        userId: u.userId,
      });
    }
  }
  return true;
};

export const getMyNotifications = async (userId, page = 1, limit = 20, unreadOnly = false, tenantId = null) => {
  const countQuery = db('notifications').where({ user_id: userId });
  applyTenantScope(countQuery, tenantId);
  if (unreadOnly) countQuery.where({ is_read: false });

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('notifications').where({ user_id: userId });
  applyTenantScope(dataQuery, tenantId);
  if (unreadOnly) dataQuery.where({ is_read: false });

  const rows = await dataQuery.orderBy('created_at', 'desc').limit(limit).offset(offset);
  const notifications = rows.map(formatNotification);

  const unreadQuery = db('notifications').where({ user_id: userId, is_read: false });
  applyTenantScope(unreadQuery, tenantId);
  const unreadRes = await unreadQuery.count({ count: '*' }).first();
  const unreadCount = Number(unreadRes?.count || 0);

  return { notifications, unreadCount, pagination: getPagination(total, page, limit) };
};

export const markAsRead = async (id, userId, tenantId = null) => {
  const updateQ = db('notifications').where({ id, user_id: userId });
  if (tenantId) updateQ.andWhere('tenant_id', tenantId);
  await updateQ.update({ is_read: true });
  const rq = db('notifications').where({ id, user_id: userId });
  if (tenantId) rq.andWhere('tenant_id', tenantId);
  const row = await rq.first();
  return formatNotification(row);
};

export const markAllAsRead = async (userId, tenantId = null) => {
  const query = db('notifications').where({ user_id: userId, is_read: false });
  applyTenantScope(query, tenantId);
  await query.update({ is_read: true });
  return true;
};

export const deleteNotification = async (id, userId, tenantId = null) => {
  await db('notifications').where({ id, user_id: userId }).delete();
  return { id };
};
