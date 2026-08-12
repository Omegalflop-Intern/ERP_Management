import { db } from '../../config/db.knex.js';
import { getPagination } from '../http/pagination.js';

export const logAction = async ({ userId, username, fullName, roleName, phone, action, module, entityId, entityType, details, req }) => {
  try {
    const u = req?.user;
    await db('audit_logs').insert({
      user_id: userId || u?.userId || u?.id || null,
      username: username || u?.username || null,
      full_name: fullName || u?.fullName || null,
      role_name: roleName || u?.roleName || null,
      phone: phone || u?.phone || null,
      tenant_id: u?.tenantId || null,
      action: action || 'ACTION',
      module: module || null,
      entity_id: entityId || null,
      entity_type: entityType || null,
      details: details ? JSON.stringify(details) : null,
      ip_address: req?.ip || req?.headers?.['x-forwarded-for'] || '',
      user_agent: req?.headers?.['user-agent'] || '',
    });
  } catch (e) {
    console.error('Audit log failed:', e.message);
  }
};

export const getAuditLogs = async (page = 1, limit = 50, filters = {}, tenantId = null) => {
  const countQuery = db('audit_logs');
  if (tenantId) countQuery.where('tenant_id', tenantId);
  if (filters.module) countQuery.where('module', filters.module);
  if (filters.userId) countQuery.where('user_id', filters.userId);
  if (filters.action) countQuery.where('action', 'like', `%${filters.action}%`);
  if (filters.from) countQuery.where('created_at', '>=', new Date(filters.from));
  if (filters.to) countQuery.where('created_at', '<=', new Date(filters.to + 'T23:59:59'));

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .select(
      'audit_logs.*',
      'users.id as u_id', 'users.username as u_username', 'users.full_name as u_full_name', 'users.phone as u_phone'
    );
  if (tenantId) dataQuery.where('audit_logs.tenant_id', tenantId);
  if (filters.module) dataQuery.where('audit_logs.module', filters.module);
  if (filters.userId) dataQuery.where('audit_logs.user_id', filters.userId);
  if (filters.action) dataQuery.where('audit_logs.action', 'like', `%${filters.action}%`);
  if (filters.from) dataQuery.where('audit_logs.created_at', '>=', new Date(filters.from));
  if (filters.to) dataQuery.where('audit_logs.created_at', '<=', new Date(filters.to + 'T23:59:59'));

  const rows = await dataQuery.orderBy('audit_logs.created_at', 'desc').limit(limit).offset(offset);

  const logs = rows.map((row) => {
    let details = row.details;
    if (typeof details === 'string') {
      try { details = JSON.parse(details); } catch { details = {}; }
    }
    return {
      _id: String(row.id),
      id: row.id,
      userId: row.u_id ? { _id: String(row.u_id), id: row.u_id, username: row.u_username, fullName: row.u_full_name || '', phone: row.u_phone || '' } : (row.user_id ? String(row.user_id) : null),
      username: row.username || '',
      fullName: row.full_name || '',
      roleName: row.role_name || '',
      phone: row.phone || '',
      tenantId: row.tenant_id || null,
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
  });

  return { logs, pagination: getPagination(total, page, limit) };
};

export const logSecurityEvent = async ({ action, userId, username, ipAddress, userAgent, details, severity = 'medium' }) => {
  try {
    await db('audit_logs').insert({
      user_id: userId || null,
      username: username || null,
      action: action || 'SECURITY_EVENT',
      module: 'security',
      entity_type: 'SecurityEvent',
      details: JSON.stringify({ ...details, severity }),
      ip_address: ipAddress || '',
      user_agent: userAgent || '',
    });
  } catch (e) {
    console.error('Security log failed:', e.message);
  }
};
