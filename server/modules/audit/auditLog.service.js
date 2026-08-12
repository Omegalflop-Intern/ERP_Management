import { db } from '../../config/db.knex.js';
import { getPagination } from '../../utils/http/pagination.js';

export function formatAuditLog(row, userRow = null, tenantRow = null) {
  if (!row) return null;
  let details = row.details;
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch { details = {}; }
  }

  return {
    _id: String(row.id),
    id: row.id,
    userId: userRow ? {
      _id: String(userRow.id),
      id: userRow.id,
      username: userRow.username,
      fullName: userRow.full_name || '',
      phone: userRow.phone || '',
    } : (row.user_id ? String(row.user_id) : null),
    username: row.username || '',
    fullName: row.full_name || '',
    roleName: row.role_name || '',
    phone: row.phone || '',
    tenantId: tenantRow ? {
      _id: String(tenantRow.id),
      id: tenantRow.id,
      shopName: tenantRow.shop_name,
    } : (row.tenant_id ? String(row.tenant_id) : null),
    action: row.action,
    module: row.module || '',
    entityId: row.entity_id || null,
    entityType: row.entity_type || null,
    details: details || {},
    ipAddress: row.ip_address || '',
    userAgent: row.user_agent || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const getSuperAdminAuditLogs = async (page = 1, limit = 50, filters = {}) => {
  const countQuery = db('audit_logs');
  if (filters.tenantId) countQuery.where('tenant_id', filters.tenantId);
  if (filters.module) countQuery.where('module', filters.module);
  if (filters.userId) countQuery.where('user_id', filters.userId);
  if (filters.action) countQuery.where('action', 'like', `%${filters.action}%`);
  if (filters.username) countQuery.where('username', 'like', `%${filters.username}%`);
  if (filters.from) countQuery.where('created_at', '>=', new Date(filters.from));
  if (filters.to) countQuery.where('created_at', '<=', new Date(filters.to + 'T23:59:59'));

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .leftJoin('tenants', 'audit_logs.tenant_id', 'tenants.id')
    .select(
      'audit_logs.*',
      'users.id as u_id', 'users.username as u_username', 'users.full_name as u_full_name', 'users.phone as u_phone',
      'tenants.id as t_id', 'tenants.shop_name as t_shop_name'
    );

  if (filters.tenantId) dataQuery.where('audit_logs.tenant_id', filters.tenantId);
  if (filters.module) dataQuery.where('audit_logs.module', filters.module);
  if (filters.userId) dataQuery.where('audit_logs.user_id', filters.userId);
  if (filters.action) dataQuery.where('audit_logs.action', 'like', `%${filters.action}%`);
  if (filters.username) dataQuery.where('audit_logs.username', 'like', `%${filters.username}%`);
  if (filters.from) dataQuery.where('audit_logs.created_at', '>=', new Date(filters.from));
  if (filters.to) dataQuery.where('audit_logs.created_at', '<=', new Date(filters.to + 'T23:59:59'));

  const rows = await dataQuery.orderBy('audit_logs.created_at', 'desc').limit(limit).offset(offset);

  const logs = rows.map((row) => {
    const uRow = row.u_id ? { id: row.u_id, username: row.u_username, full_name: row.u_full_name, phone: row.u_phone } : null;
    const tRow = row.t_id ? { id: row.t_id, shop_name: row.t_shop_name } : null;
    return formatAuditLog(row, uRow, tRow);
  });

  return { logs, pagination: getPagination(total, page, limit) };
};

export const getAuditLogStats = async () => {
  const totalRes = await db('audit_logs').count({ count: '*' }).first();
  const totalLogs = Number(totalRes?.count || 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayRes = await db('audit_logs').where('created_at', '>=', todayStart).count({ count: '*' }).first();
  const todayLogs = Number(todayRes?.count || 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekRes = await db('audit_logs').where('created_at', '>=', weekStart).count({ count: '*' }).first();
  const weekLogs = Number(weekRes?.count || 0);

  const loginRes = await db('audit_logs').where('action', 'like', '%LOGIN%').count({ count: '*' }).first();
  const loginAttempts = Number(loginRes?.count || 0);

  const actionRows = await db('audit_logs').select('action').count({ count: '*' }).groupBy('action').orderBy('count', 'desc').limit(10);
  const moduleRows = await db('audit_logs').select('module').count({ count: '*' }).groupBy('module').orderBy('count', 'desc').limit(10);

  return {
    totalLogs,
    todayLogs,
    weekLogs,
    actionBreakdown: actionRows.map(r => ({ _id: r.action, count: Number(r.count) })),
    moduleBreakdown: moduleRows.map(r => ({ _id: r.module, count: Number(r.count) })),
    loginAttempts,
  };
};
