import * as supplierService from './supplier.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllSuppliers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const result = await supplierService.getAllSuppliers(Number(page), Number(limit), search);
    return ApiResponse.paginated(res, result.suppliers, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    return ApiResponse.success(res, supplier);
  } catch (error) { next(error); }
};

export const createSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'supplier', entityId: supplier._id, entityType: 'Supplier', details: { name: supplier.name }, req });
    return ApiResponse.created(res, supplier, 'Supplier created');
  } catch (error) { next(error); }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'supplier', entityId: supplier._id, entityType: 'Supplier', details: { name: supplier.name }, req });
    return ApiResponse.success(res, supplier, 'Supplier updated');
  } catch (error) { next(error); }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    await supplierService.deleteSupplier(req.params.id);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'supplier', entityId: req.params.id, entityType: 'Supplier', req });
    return ApiResponse.success(res, null, 'Supplier deleted');
  } catch (error) { next(error); }
};

export const getSupplierStats = async (req, res, next) => {
  try {
    const stats = await supplierService.getSupplierStats(req.params.id);
    return ApiResponse.success(res, stats);
  } catch (error) { next(error); }
};
