import * as leaveService from './leave.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllLeaves = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', employee: employeeId = '', branchId } = req.query;
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.selectedBranchId || branchId || null;
    const result = await leaveService.getAllLeaves(Number(page), Number(limit), search, status, employeeId, req.user, tenantId, effectiveBranchId);
    return ApiResponse.paginated(res, result.leaves, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const createLeave = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.body.branchId || req.selectedBranchId || req.user?.branchId || null;
    const leaveData = { ...req.body, branchId: effectiveBranchId };
    const leave = await leaveService.applyForLeave(leaveData, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'leave', entityId: leave._id, entityType: 'Leave', details: { employeeId: leave.employeeId, type: leave.type }, req });
    return ApiResponse.created(res, leave, 'Leave request submitted');
  } catch (error) { next(error); }
};

export const updateLeaveStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.selectedBranchId || null;
    const leave = await leaveService.updateLeaveStatus(req.params.id, status, req.user._id, rejectionReason, tenantId, effectiveBranchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE_STATUS', module: 'leave', entityId: leave._id, entityType: 'Leave', details: { status }, req });
    return ApiResponse.success(res, leave, `Leave ${status}`);
  } catch (error) { next(error); }
};

export const getEmployeeLeaves = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.selectedBranchId || null;
    const result = await leaveService.getEmployeeLeaves(employeeId, year, tenantId, effectiveBranchId);
    return ApiResponse.success(res, result);
  } catch (error) { next(error); }
};

export const deleteLeave = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.selectedBranchId || null;
    await leaveService.deleteLeave(req.params.id, tenantId, effectiveBranchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'leave', entityId: req.params.id, entityType: 'Leave', req });
    return ApiResponse.success(res, null, 'Leave deleted');
  } catch (error) { next(error); }
};
