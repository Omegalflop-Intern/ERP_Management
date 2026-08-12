import * as customerService from './customer.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', branchId } = req.query;
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.selectedBranchId || branchId || null;
    const result = await customerService.getAllCustomers(Number(page), Number(limit), search, tenantId, effectiveBranchId);
    return ApiResponse.paginated(res, result.customers, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const customer = await customerService.getCustomerById(req.params.id, tenantId, branchId);
    return ApiResponse.success(res, customer);
  } catch (error) { next(error); }
};

export const createCustomer = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.body.branchId || req.selectedBranchId || req.user?.branchId || null;
    const customer = await customerService.createCustomer({ ...req.body, branchId }, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'customer', entityId: customer._id, entityType: 'Customer', details: { name: customer.name }, req });
    return ApiResponse.created(res, customer, 'Customer created');
  } catch (error) { next(error); }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const customer = await customerService.updateCustomer(req.params.id, req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'customer', entityId: customer._id, entityType: 'Customer', details: { name: customer.name }, req });
    return ApiResponse.success(res, customer, 'Customer updated');
  } catch (error) { next(error); }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await customerService.deleteCustomer(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'customer', entityId: req.params.id, entityType: 'Customer', req });
    return ApiResponse.success(res, null, 'Customer deleted');
  } catch (error) { next(error); }
};

export const getCustomerHistory = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const result = await customerService.getCustomerHistory(req.params.id, tenantId, branchId);
    return ApiResponse.success(res, result);
  } catch (error) { next(error); }
};

export const collectDue = async (req, res, next) => {
  try {
    const { amount, paymentMethod } = req.body;
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const result = await customerService.collectDue(req.params.id, amount, paymentMethod, req.user._id, tenantId, branchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'COLLECT_DUE', module: 'customer', entityId: req.params.id, entityType: 'Customer', details: { amount, paymentMethod }, req });
    return ApiResponse.success(res, result, `৳${result.collected} collected`);
  } catch (error) { next(error); }
};

export const getCustomerStats = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const stats = await customerService.getCustomerStats(tenantId, branchId);
    return ApiResponse.success(res, stats);
  } catch (error) { next(error); }
};
