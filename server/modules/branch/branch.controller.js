import * as branchService from './branch.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllBranches = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const tenantId = req.user?.tenantId || null;
    const result = await branchService.getAllBranches(Number(page), Number(limit), tenantId);
    return ApiResponse.paginated(res, result.branches, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getAllBranchesFlat = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branches = await branchService.getAllBranchesFlat(tenantId);
    return ApiResponse.success(res, branches);
  } catch (error) { next(error); }
};

export const getBranchById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branch = await branchService.getBranchById(req.params.id, tenantId);
    return ApiResponse.success(res, branch);
  } catch (error) { next(error); }
};

export const createBranch = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branch = await branchService.createBranch(req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'branch', entityId: branch._id, entityType: 'Branch', details: { name: branch.name }, req });
    return ApiResponse.created(res, branch, 'Branch created');
  } catch (error) { next(error); }
};

export const updateBranch = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branch = await branchService.updateBranch(req.params.id, req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'branch', entityId: branch._id, entityType: 'Branch', details: { name: branch.name }, req });
    return ApiResponse.success(res, branch, 'Branch updated');
  } catch (error) { next(error); }
};

export const deleteBranch = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await branchService.deleteBranch(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'branch', entityId: req.params.id, entityType: 'Branch', req });
    return ApiResponse.success(res, null, 'Branch deleted');
  } catch (error) { next(error); }
};
