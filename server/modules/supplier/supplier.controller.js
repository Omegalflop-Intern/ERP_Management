import * as supplierService from './supplier.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllSuppliers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const result = await supplierService.getAllSuppliers(Number(page), Number(limit), search, tenantId);
    return ApiResponse.paginated(res, result.suppliers, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getSupplierById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const supplier = await supplierService.getSupplierById(req.params.id, tenantId);
    return ApiResponse.success(res, supplier);
  } catch (error) { next(error); }
};

export const createSupplier = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const supplier = await supplierService.createSupplier(req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'supplier', entityId: supplier._id, entityType: 'Supplier', details: { name: supplier.name }, req });
    return ApiResponse.created(res, supplier, 'Supplier created');
  } catch (error) { next(error); }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const supplier = await supplierService.updateSupplier(req.params.id, req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'supplier', entityId: supplier._id, entityType: 'Supplier', details: { name: supplier.name }, req });
    return ApiResponse.success(res, supplier, 'Supplier updated');
  } catch (error) { next(error); }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await supplierService.deleteSupplier(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'supplier', entityId: req.params.id, entityType: 'Supplier', req });
    return ApiResponse.success(res, null, 'Supplier deleted');
  } catch (error) { next(error); }
};

export const getSupplierStats = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const stats = await supplierService.getSupplierStats(req.params.id, tenantId);
    return ApiResponse.success(res, stats);
  } catch (error) { next(error); }
};

export const paySupplierDue = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const supplier = await supplierService.paySupplierDue(req.params.id, req.body, tenantId, branchId, req.user);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'PAY_SUPPLIER_DUE', module: 'supplier', entityId: supplier._id, entityType: 'Supplier', details: { amount: req.body.amount, supplierName: supplier.name }, req });
    return ApiResponse.success(res, supplier, 'Supplier due payment recorded successfully');
  } catch (error) { next(error); }
};
