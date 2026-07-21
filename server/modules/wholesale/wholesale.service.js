import { WholesalePrice, WholesaleOrder } from './wholesale.model.js';
import { Transaction } from '../sale/sale.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

const genOrderNumber = async () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await WholesaleOrder.countDocuments({ createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } });
  return `WS-${date}-${String(count + 1).padStart(4, '0')}`;
};

// --- Prices ---
export const getAllPrices = async (page = 1, limit = 50, filters = {}) => {
  const query = { isDeleted: false };
  if (filters.product) query.product = filters.product;
  if (filters.tier) query.tier = { $regex: filters.tier, $options: 'i' };
  const total = await WholesalePrice.countDocuments(query);
  const prices = await paginate(WholesalePrice.find(query).populate('product', 'name sku brand'), page, limit).sort({ createdAt: -1 });
  return { prices, pagination: getPagination(total, page, limit) };
};

export const createPrice = async (data) => {
  return WholesalePrice.create(data);
};

export const updatePrice = async (id, data) => {
  const price = await WholesalePrice.findOne({ _id: id, isDeleted: false });
  if (!price) throw ApiError.notFound('Wholesale price not found');
  Object.assign(price, data);
  await price.save();
  return price;
};

export const deletePrice = async (id) => {
  const price = await WholesalePrice.findOne({ _id: id, isDeleted: false });
  if (!price) throw ApiError.notFound('Wholesale price not found');
  price.isDeleted = true;
  await price.save();
};

// --- Orders ---
export const getAllOrders = async (page = 1, limit = 20, filters = {}) => {
  const query = { isDeleted: false };
  if (filters.customer) query.customer = filters.customer;
  if (filters.status) query.status = filters.status;

  const total = await WholesaleOrder.countDocuments(query);
  const rawOrders = await paginate(WholesaleOrder.find(query).populate('customer', 'name phone companyName').populate('createdBy', 'fullName username'), page, limit).sort({ createdAt: -1 });

  // Also fetch POS sales with saleType: WHOLESALE
  const saleQuery = { txType: 'SALE', saleType: 'WHOLESALE' };
  if (filters.status === 'COMPLETED' || !filters.status) {
    const wholesaleSales = await Transaction.find(saleQuery)
      .populate('customerId', 'name phone companyName')
      .sort({ createdAt: -1 })
      .limit(limit);

    const formattedSales = wholesaleSales.map(s => ({
      _id: s._id,
      orderNumber: s.invoiceNumber,
      customer: s.customerId || { name: s.customerName || 'Walk-in Dealer', phone: s.customerPhone || '' },
      grandTotal: s.netTotal,
      paidAmount: (s.paymentBreakdown?.cash || 0) + (s.paymentBreakdown?.bkash || 0) + (s.paymentBreakdown?.rocket || 0) + (s.paymentBreakdown?.nagad || 0) + (s.paymentBreakdown?.bank || 0),
      dueAmount: s.paymentBreakdown?.dueAmount || 0,
      status: s.status === 'COMPLETED' ? 'DELIVERED' : 'PENDING',
      createdAt: s.createdAt,
      isPosSale: true,
    }));

    const combined = [...formattedSales, ...rawOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { orders: combined.slice(0, limit), pagination: getPagination(total + formattedSales.length, page, limit) };
  }

  return { orders: rawOrders, pagination: getPagination(total, page, limit) };
};

export const getOrderById = async (id) => {
  const order = await WholesaleOrder.findOne({ _id: id, isDeleted: false })
    .populate('customer', 'name phone email companyName')
    .populate('items.product', 'name sku brand')
    .populate('createdBy', 'fullName username');
  if (order) return order;

  // Fallback to POS Sale if ID is a Transaction
  const posSale = await Transaction.findOne({ _id: id, txType: 'SALE' }).populate('customerId', 'name phone email companyName');
  if (posSale) {
    return {
      _id: posSale._id,
      orderNumber: posSale.invoiceNumber,
      customer: posSale.customerId || { name: posSale.customerName, phone: posSale.customerPhone, email: posSale.customerEmail },
      items: (posSale.lineItems || []).map(li => ({
        product: { name: li.description },
        quantity: li.qty,
        unitPrice: li.unitPrice,
        total: li.totalPrice,
      })),
      subTotal: posSale.subTotal,
      discount: posSale.discount,
      grandTotal: posSale.netTotal,
      paidAmount: (posSale.paymentBreakdown?.cash || 0) + (posSale.paymentBreakdown?.bkash || 0) + (posSale.paymentBreakdown?.rocket || 0) + (posSale.paymentBreakdown?.nagad || 0) + (posSale.paymentBreakdown?.bank || 0),
      dueAmount: posSale.paymentBreakdown?.dueAmount || 0,
      status: posSale.status === 'COMPLETED' ? 'DELIVERED' : 'PENDING',
      createdAt: posSale.createdAt,
      isPosSale: true,
    };
  }

  throw ApiError.notFound('Order not found');
};

export const createOrder = async (data, userId) => {
  const orderNumber = await genOrderNumber();
  const items = data.items.map(item => ({ ...item, total: item.quantity * item.unitPrice }));
  const subTotal = items.reduce((sum, i) => sum + i.total, 0);
  const grandTotal = subTotal - (data.discount || 0);
  const dueAmount = grandTotal - (data.paidAmount || 0);

  return WholesaleOrder.create({
    orderNumber,
    customer: data.customer,
    items,
    subTotal,
    discount: data.discount || 0,
    grandTotal,
    paidAmount: data.paidAmount || 0,
    dueAmount,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
    createdBy: userId,
  });
};

export const updateOrder = async (id, data) => {
  const order = await WholesaleOrder.findOne({ _id: id, isDeleted: false });
  if (!order) throw ApiError.notFound('Order not found');
  Object.assign(order, data);
  if (data.paidAmount !== undefined) {
    order.dueAmount = order.grandTotal - data.paidAmount;
  }
  await order.save();
  return order;
};

export const deleteOrder = async (id) => {
  const order = await WholesaleOrder.findOne({ _id: id, isDeleted: false });
  if (!order) throw ApiError.notFound('Order not found');
  order.isDeleted = true;
  await order.save();
};

import { Customer } from '../customer/customer.model.js';
import { processReturn as processSaleReturn } from '../sale/sale.service.js';

export const getOrdersStats = async () => {
  const totalOrders = await WholesaleOrder.countDocuments({ isDeleted: false });
  const totalRevenue = await WholesaleOrder.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: null, total: { $sum: '$grandTotal' }, due: { $sum: '$dueAmount' } } },
  ]);

  const posWholesaleStats = await Transaction.aggregate([
    { $match: { txType: 'SALE', saleType: 'WHOLESALE' } },
    { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$netTotal' }, due: { $sum: '$paymentBreakdown.dueAmount' } } }
  ]);

  const wsCount = (totalOrders || 0) + (posWholesaleStats[0]?.count || 0);
  const wsRevenue = (totalRevenue[0]?.total || 0) + (posWholesaleStats[0]?.total || 0);
  const wsDue = (totalRevenue[0]?.due || 0) + (posWholesaleStats[0]?.due || 0);
  const wsPaid = Math.max(0, wsRevenue - wsDue);

  return { totalOrders: wsCount, totalRevenue: wsRevenue, totalPaid: wsPaid, totalDue: wsDue };
};

export const collectOrderDue = async (id, { amount, paymentMethod = 'cash', reference, notes }) => {
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) throw ApiError.badRequest('Invalid due collection amount');

  // Try POS Sale Transaction first
  const sale = await Transaction.findOne({ _id: id, txType: 'SALE' });
  if (sale) {
    const currentDue = sale.paymentBreakdown?.dueAmount || 0;
    if (currentDue <= 0) throw ApiError.badRequest('This wholesale sale has no pending due balance');
    const collectAmt = Math.min(numAmount, currentDue);

    sale.paymentBreakdown[paymentMethod] = (sale.paymentBreakdown[paymentMethod] || 0) + collectAmt;
    sale.paymentBreakdown.dueAmount = currentDue - collectAmt;
    await sale.save();

    if (sale.customerId) {
      await Customer.updateOne({ _id: sale.customerId }, { $inc: { dueBalance: -collectAmt } }).catch(() => {});
    }
    return { orderId: sale._id, collectedAmount: collectAmt, remainingDue: sale.paymentBreakdown.dueAmount };
  }

  // Fallback to WholesaleOrder collection
  const order = await WholesaleOrder.findOne({ _id: id, isDeleted: false });
  if (!order) throw ApiError.notFound('Wholesale order not found');

  if (order.dueAmount <= 0) throw ApiError.badRequest('This wholesale order has no pending due balance');
  const collectAmt = Math.min(numAmount, order.dueAmount);

  order.paidAmount = (order.paidAmount || 0) + collectAmt;
  order.dueAmount = Math.max(0, order.dueAmount - collectAmt);
  await order.save();

  if (order.customer) {
    await Customer.updateOne({ _id: order.customer }, { $inc: { dueBalance: -collectAmt } }).catch(() => {});
  }
  return { orderId: order._id, collectedAmount: collectAmt, remainingDue: order.dueAmount };
};

export const processOrderReturn = async (id, returnData, username) => {
  const sale = await Transaction.findOne({ _id: id, txType: 'SALE' });
  if (sale) {
    return processSaleReturn(id, returnData, username);
  }
  throw ApiError.notFound('Wholesale sale transaction not found for return processing');
};
