import * as wholesaleService from './wholesale.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllPrices = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, product, tier } = req.query;
    const tenantId = req.user?.tenantId || null;
    const result = await wholesaleService.getAllPrices(Number(page), Number(limit), { product, tier }, tenantId);
    return ApiResponse.paginated(res, result.prices, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const createPrice = async (req, res, next) => {
  try {
    const priceData = {
      ...req.body,
      tenantId: req.user?.tenantId || null,
    };
    const price = await wholesaleService.createPrice(priceData);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE_PRICE', module: 'wholesale', entityId: price._id, entityType: 'WholesalePrice', details: { product: price.product, tier: price.tier }, req });
    return ApiResponse.created(res, price, 'Wholesale price created');
  } catch (error) { next(error); }
};

export const updatePrice = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const price = await wholesaleService.updatePrice(req.params.id, req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE_PRICE', module: 'wholesale', entityId: price._id, entityType: 'WholesalePrice', req });
    return ApiResponse.success(res, price, 'Wholesale price updated');
  } catch (error) { next(error); }
};

export const deletePrice = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await wholesaleService.deletePrice(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE_PRICE', module: 'wholesale', entityId: req.params.id, entityType: 'WholesalePrice', req });
    return ApiResponse.success(res, null, 'Wholesale price deleted');
  } catch (error) { next(error); }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, customer, status } = req.query;
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const result = await wholesaleService.getAllOrders(Number(page), Number(limit), { customer, status }, tenantId, branchId);
    return ApiResponse.paginated(res, result.orders, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getOrderById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const order = await wholesaleService.getOrderById(req.params.id, tenantId);
    return ApiResponse.success(res, order);
  } catch (error) { next(error); }
};

export const createOrder = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const orderData = {
      ...req.body,
      tenantId: req.user?.tenantId || null,
      branchId: req.selectedBranchId || null,
    };
    const order = await wholesaleService.createOrder(orderData, req.user.userId, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE_ORDER', module: 'wholesale', entityId: order._id, entityType: 'WholesaleOrder', details: { orderNumber: order.orderNumber }, req });
    return ApiResponse.created(res, order, 'Wholesale order created');
  } catch (error) { next(error); }
};

export const updateOrder = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const order = await wholesaleService.updateOrder(req.params.id, req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE_ORDER', module: 'wholesale', entityId: order._id, entityType: 'WholesaleOrder', details: { status: order.status }, req });
    return ApiResponse.success(res, order, 'Order updated');
  } catch (error) { next(error); }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await wholesaleService.deleteOrder(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE_ORDER', module: 'wholesale', entityId: req.params.id, entityType: 'WholesaleOrder', req });
    return ApiResponse.success(res, null, 'Order deleted');
  } catch (error) { next(error); }
};

export const getOrdersStats = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const stats = await wholesaleService.getOrdersStats(tenantId);
    return ApiResponse.success(res, stats);
  } catch (error) { next(error); }
};

export const collectOrderDue = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const result = await wholesaleService.collectOrderDue(req.params.id, req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'COLLECT_DUE', module: 'wholesale', entityId: req.params.id, entityType: 'WholesaleOrder', details: { collected: result.collectedAmount }, req });
    return ApiResponse.success(res, result, `Collected ৳${result.collectedAmount.toLocaleString()} due payment`);
  } catch (error) { next(error); }
};

export const processOrderReturn = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const result = await wholesaleService.processOrderReturn(req.params.id, req.body, req.user?.username || 'system', tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'RETURN', module: 'wholesale', entityId: req.params.id, entityType: 'WholesaleOrder', details: { refundAmount: result.refundAmount }, req });
    return ApiResponse.success(res, result, 'Wholesale return processed successfully');
  } catch (error) { next(error); }
};
