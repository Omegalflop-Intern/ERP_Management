import * as purchaseOrderService from './purchaseOrder.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllPurchaseOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', branchId } = req.query;
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.selectedBranchId || branchId || null;
    const result = await purchaseOrderService.getAllPurchaseOrders(Number(page), Number(limit), search, status, tenantId, effectiveBranchId);
    return ApiResponse.paginated(res, result.orders, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const order = await purchaseOrderService.getPurchaseOrderById(req.params.id, tenantId, branchId);
    return ApiResponse.success(res, order);
  } catch (error) { next(error); }
};

export const createPurchaseOrder = async (req, res, next) => {
  try {
    const effectiveBranchId = req.body.branchId || req.selectedBranchId || req.user?.branchId || null;
    const poData = {
      ...req.body,
      tenantId: req.user?.tenantId || null,
      branchId: effectiveBranchId,
    };
    const order = await purchaseOrderService.createPurchaseOrder(poData, req.user?.username || 'system');
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'purchase', entityId: order._id, entityType: 'PurchaseOrder', details: { orderNumber: order.orderNumber }, req });
    return ApiResponse.created(res, order, 'Purchase order created');
  } catch (error) { next(error); }
};

export const updatePurchaseOrder = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const order = await purchaseOrderService.updatePurchaseOrder(req.params.id, req.body, tenantId, branchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'purchase', entityId: order._id, entityType: 'PurchaseOrder', details: { orderNumber: order.orderNumber }, req });
    return ApiResponse.success(res, order, 'Purchase order updated');
  } catch (error) { next(error); }
};

export const receiveGoods = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const order = await purchaseOrderService.receiveGoods(req.params.id, req.body.grnEntries, req.user?.username || 'system', tenantId, branchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'RECEIVE_GOODS', module: 'purchase', entityId: order._id, entityType: 'PurchaseOrder', details: { orderNumber: order.orderNumber }, req });
    return ApiResponse.success(res, order, 'Goods received successfully');
  } catch (error) { next(error); }
};

export const deletePurchaseOrder = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    await purchaseOrderService.deletePurchaseOrder(req.params.id, tenantId, branchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'purchase', entityId: req.params.id, entityType: 'PurchaseOrder', req });
    return ApiResponse.success(res, null, 'Purchase order deleted');
  } catch (error) { next(error); }
};

export const returnToSupplier = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const { reason } = req.body;
    const result = await purchaseOrderService.returnToSupplier(req.params.id, req.body, reason, req.user?.username || 'system', tenantId, branchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'RETURN_TO_SUPPLIER', module: 'purchase', entityId: req.params.id, entityType: 'PurchaseOrder', details: { returnedCount: result.returnedCount, totalRefund: result.totalRefund }, req });
    return ApiResponse.success(res, result, 'Product(s) returned to supplier successfully');
  } catch (error) { next(error); }
};

export const payPurchaseOrderDue = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const order = await purchaseOrderService.payPurchaseOrderDue(req.params.id, req.body, tenantId, branchId, req.user);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'PAY_PURCHASE_DUE', module: 'purchase', entityId: order._id, entityType: 'PurchaseOrder', details: { amount: req.body.amount, poNumber: order.poNumber }, req });
    return ApiResponse.success(res, order, 'Supplier payment recorded successfully');
  } catch (error) { next(error); }
};
