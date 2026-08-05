import { AuditLog } from './auditLog.model.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

export const getSuperAdminAuditLogs = async (page = 1, limit = 50, filters = {}) => {
  const query = {};

  if (filters.tenantId) query.tenantId = filters.tenantId;
  if (filters.module) query.module = filters.module;
  if (filters.userId) query.userId = filters.userId;
  if (filters.action) query.action = { $regex: filters.action, $options: 'i' };
  if (filters.username) query.username = { $regex: filters.username, $options: 'i' };
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }

  const total = await AuditLog.countDocuments(query);
  const logs = await paginate(
    AuditLog.find(query)
      .populate('userId', 'username fullName phone roleName')
      .populate('tenantId', 'shopName'),
    page, limit
  ).sort({ createdAt: -1 });

  return { logs, pagination: getPagination(total, page, limit) };
};

export const getAuditLogStats = async () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalLogs, todayLogs, weekLogs, actionBreakdown, moduleBreakdown, loginAttempts] = await Promise.all([
    AuditLog.countDocuments(),
    AuditLog.countDocuments({ createdAt: { $gte: today } }),
    AuditLog.countDocuments({ createdAt: { $gte: weekAgo } }),
    AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    AuditLog.aggregate([
      { $group: { _id: '$module', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    AuditLog.countDocuments({ action: { $in: ['LOGIN', 'LOGIN_FAILED', 'LOGOUT'] } }),
  ]);

  return {
    totalLogs,
    todayLogs,
    weekLogs,
    actionBreakdown,
    moduleBreakdown,
    loginAttempts,
  };
};
