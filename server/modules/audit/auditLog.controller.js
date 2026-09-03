import * as auditService from './auditLog.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';

export const getSuperAdminAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, tenantId, module, userId, action, username, from, to } = req.query;
    const filters = { tenantId, module, userId, action, username, from, to };
    const result = await auditService.getSuperAdminAuditLogs(Number(page), Number(limit), filters);
    return ApiResponse.paginated(res, result.logs, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getAuditLogStats = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const stats = await auditService.getAuditLogStats(tenantId);
    return ApiResponse.success(res, stats);
  } catch (error) { next(error); }
};
