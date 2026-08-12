import * as stockService from './stock.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllTransfers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const result = await stockService.getAllTransfers(Number(page), Number(limit), status, tenantId, branchId);
    return ApiResponse.paginated(res, result.transfers, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getTransferById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const transfer = await stockService.getTransferById(req.params.id, tenantId, branchId);
    return ApiResponse.success(res, transfer);
  } catch (error) { next(error); }
};

export const createTransfer = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const transferData = {
      ...req.body,
      tenantId: req.user?.tenantId || null,
    };
    const transfer = await stockService.createTransfer(transferData, req.user?.username, tenantId, branchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE_TRANSFER', module: 'stock', entityId: transfer._id, entityType: 'StockTransfer', details: { from: transfer.fromBranch, to: transfer.toBranch }, req });
    return ApiResponse.created(res, transfer, 'Transfer created');
  } catch (error) { next(error); }
};

export const updateTransferStatus = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const transfer = await stockService.updateTransferStatus(req.params.id, req.body.status, req.user?.username, tenantId, branchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE_TRANSFER_STATUS', module: 'stock', entityId: transfer._id, entityType: 'StockTransfer', details: { status: req.body.status }, req });
    return ApiResponse.success(res, transfer, 'Transfer status updated');
  } catch (error) { next(error); }
};

export const deleteTransfer = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    await stockService.deleteTransfer(req.params.id, tenantId, branchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE_TRANSFER', module: 'stock', entityId: req.params.id, entityType: 'StockTransfer', req });
    return ApiResponse.success(res, null, 'Transfer deleted');
  } catch (error) { next(error); }
};
