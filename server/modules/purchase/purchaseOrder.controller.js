import * as purchaseOrderService from './purchaseOrder.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllPurchaseOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const result = await purchaseOrderService.getAllPurchaseOrders(Number(page), Number(limit), search, status);
    return ApiResponse.paginated(res, result.orders, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const order = await purchaseOrderService.getPurchaseOrderById(req.params.id);
    return ApiResponse.success(res, order);
  } catch (error) { next(error); }
};

export const createPurchaseOrder = async (req, res, next) => {
  try {
    const order = await purchaseOrderService.createPurchaseOrder(req.body, req.user?.username || 'system');
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'purchase', entityId: order._id, entityType: 'PurchaseOrder', details: { orderNumber: order.orderNumber }, req });
    return ApiResponse.created(res, order, 'Purchase order created');
  } catch (error) { next(error); }
};

export const updatePurchaseOrder = async (req, res, next) => {
  try {
    const order = await purchaseOrderService.updatePurchaseOrder(req.params.id, req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'purchase', entityId: order._id, entityType: 'PurchaseOrder', details: { orderNumber: order.orderNumber }, req });
    return ApiResponse.success(res, order, 'Purchase order updated');
  } catch (error) { next(error); }
};

export const receiveGoods = async (req, res, next) => {
  try {
    const order = await purchaseOrderService.receiveGoods(req.params.id, req.body.grnEntries, req.user?.username || 'system');
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'RECEIVE_GOODS', module: 'purchase', entityId: order._id, entityType: 'PurchaseOrder', details: { orderNumber: order.orderNumber }, req });
    return ApiResponse.success(res, order, 'Goods received successfully');
  } catch (error) { next(error); }
};

export const deletePurchaseOrder = async (req, res, next) => {
  try {
    await purchaseOrderService.deletePurchaseOrder(req.params.id);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'purchase', entityId: req.params.id, entityType: 'PurchaseOrder', req });
    return ApiResponse.success(res, null, 'Purchase order deleted');
  } catch (error) { next(error); }
};
