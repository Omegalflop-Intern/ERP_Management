import * as warrantyService from './warranty.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllClaims = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = '', search = '', branchId } = req.query;
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.selectedBranchId || branchId || null;
    const result = await warrantyService.getAllClaims(Number(page), Number(limit), status, search, tenantId, effectiveBranchId);
    return ApiResponse.paginated(res, result.claims, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getClaimById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const claim = await warrantyService.getClaimById(req.params.id, tenantId);
    return ApiResponse.success(res, claim);
  } catch (error) { next(error); }
};

export const createClaim = async (req, res, next) => {
  try {
    const effectiveBranchId = req.body.branchId || req.selectedBranchId || req.user?.branchId || null;
    const claimData = {
      ...req.body,
      tenantId: req.user?.tenantId || null,
      branchId: effectiveBranchId,
    };
    const claim = await warrantyService.createClaim(claimData);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'warranty', entityId: claim._id, entityType: 'WarrantyClaim', details: { imeiOrSerial: claim.imeiOrSerial }, req });
    return ApiResponse.created(res, claim, 'Warranty claim created');
  } catch (error) { next(error); }
};

export const updateClaim = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const claim = await warrantyService.updateClaim(req.params.id, req.body, req.user._id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'warranty', entityId: claim._id, entityType: 'WarrantyClaim', details: { status: claim.status }, req });
    return ApiResponse.success(res, claim, 'Warranty claim updated');
  } catch (error) { next(error); }
};

export const getClaimsByIMEI = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const claims = await warrantyService.getClaimsByIMEI(req.params.imeiId, tenantId);
    return ApiResponse.success(res, claims);
  } catch (error) { next(error); }
};

export const getWarrantyReport = async (req, res, next) => {
  try {
    const { type = 'expiring', search = '', status = 'Sold' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const report = await warrantyService.getWarrantyReport({ type, search, status }, tenantId);
    return ApiResponse.success(res, report);
  } catch (error) { next(error); }
};
