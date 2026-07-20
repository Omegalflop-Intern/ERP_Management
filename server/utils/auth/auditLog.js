import { AuditLog } from '../../models/AuditLog.js';
import { paginate, getPagination } from '../http/pagination.js';

export const logAction = async ({ userId, username, fullName, roleName, phone, action, module, entityId, entityType, details, req }) => {
  try {
    const u = req?.user;
    await AuditLog.create({
      userId: userId || u?.userId,
      username: username || u?.username,
      fullName: fullName || u?.fullName,
      roleName: roleName || u?.roleName,
      phone: phone || u?.phone,
      action,
      module,
      entityId,
      entityType,
      details,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'],
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (e) {
    console.error('Audit log failed:', e.message);
  }
};

export const getAuditLogs = async (page = 1, limit = 50, filters = {}) => {
  const query = {};
  if (filters.module) query.module = filters.module;
  if (filters.userId) query.userId = filters.userId;
  if (filters.action) query.action = { $regex: filters.action, $options: 'i' };
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }

  const total = await AuditLog.countDocuments(query);
  const logs = await paginate(
    AuditLog.find(query).populate('userId', 'username fullName phone roleName role'),
    page, limit
  ).sort({ createdAt: -1 });

  return { logs, pagination: getPagination(total, page, limit) };
};

export const logSecurityEvent = async ({ action, userId, username, ipAddress, userAgent, details, severity = 'medium' }) => {
  try {
    await AuditLog.create({
      userId,
      username,
      action,
      module: 'security',
      entityType: 'SecurityEvent',
      details: { ...details, severity },
      ipAddress: ipAddress || '',
      userAgent: userAgent || '',
    });
  } catch (e) {
    console.error('Security log failed:', e.message);
  }
};
