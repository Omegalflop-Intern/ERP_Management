import { PurchaseOrder } from './purchaseOrder.model.js';
import { Supplier } from '../supplier/supplier.model.js';
import { InventoryUnit } from '../imei/imei.model.js';
import { Product } from '../product/product.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

const generatePoNumber = () => 'PO-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

export const getAllPurchaseOrders = async (page = 1, limit = 20, search = '', status = '') => {
  const query = { isDeleted: false };

  if (status && status !== 'ALL') query.status = status;
  if (search) {
    query.$or = [
      { poNumber: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await PurchaseOrder.countDocuments(query);
  const orders = await paginate(
    PurchaseOrder.find(query).populate('supplierId', 'name phone company'),
    page, limit
  ).sort({ createdAt: -1 });

  return { orders, pagination: getPagination(total, page, limit) };
};

export const getPurchaseOrderById = async (id) => {
  const order = await PurchaseOrder.findOne({ _id: id, isDeleted: false })
    .populate('supplierId', 'name phone company address dueBalance')
    .populate('lineItems.productId', 'name brand sku category');
  if (!order) throw ApiError.notFound('Purchase order not found');
  return order;
};

export const createPurchaseOrder = async (data, createdBy = 'system') => {
  const supplier = await Supplier.findOne({ _id: data.supplierId, isDeleted: false });
  if (!supplier) throw ApiError.notFound('Supplier not found');

  const lineItems = data.lineItems.map((item) => ({
    ...item,
    totalCost: item.qty * item.unitCost,
  }));

  const subTotal = lineItems.reduce((sum, item) => sum + item.totalCost, 0);
  const discount = data.discount || 0;
  const tax = data.tax || 0;
  const netTotal = subTotal - discount + tax;
  const paidAmount = data.paidAmount || 0;

  const order = await PurchaseOrder.create({
    poNumber: generatePoNumber(),
    supplierId: data.supplierId,
    lineItems,
    subTotal,
    discount,
    tax,
    netTotal,
    paidAmount,
    dueAmount: netTotal - paidAmount,
    paymentMethod: data.paymentMethod || 'CREDIT',
    expectedDeliveryDate: data.expectedDeliveryDate,
    notes: data.notes,
    createdBy,
  });

  return order;
};

export const updatePurchaseOrder = async (id, data) => {
  const order = await PurchaseOrder.findOne({ _id: id, isDeleted: false });
  if (!order) throw ApiError.notFound('Purchase order not found');

  if (order.status === 'RECEIVED' || order.status === 'CANCELLED') {
    throw ApiError.badRequest('Cannot update a completed or cancelled order');
  }

  if (data.status === 'APPROVED') {
    data.approvedBy = data.approvedBy || 'system';
  }

  Object.assign(order, data);
  await order.save();
  return order;
};

export const receiveGoods = async (id, grnEntries, receivedBy = 'system') => {
  const order = await PurchaseOrder.findOne({ _id: id, isDeleted: false })
    .populate('supplierId', 'name')
    .populate('lineItems.productId', 'name');
  if (!order) throw ApiError.notFound('Purchase order not found');

  if (order.status !== 'APPROVED' && order.status !== 'PARTIALLY_RECEIVED') {
    throw ApiError.badRequest('Order must be approved before receiving goods');
  }

  for (const entry of grnEntries) {
    const existing = await InventoryUnit.findOne({ imeiOrSerial: entry.imeiOrSerial, isDeleted: false });
    if (existing) throw ApiError.conflict(`IMEI ${entry.imeiOrSerial} already exists in inventory`);
  }

  const receivedByLineItem = {};
  for (const entry of grnEntries) {
    const key = entry.productId.toString();
    receivedByLineItem[key] = (receivedByLineItem[key] || 0) + 1;

    await InventoryUnit.create({
      imeiOrSerial: entry.imeiOrSerial,
      productId: entry.productId,
      supplierId: order.supplierId._id || order.supplierId,
      purchasePrice: entry.purchasePrice,
      currentSellingPrice: entry.sellingPrice,
      warrantyMonths: entry.warrantyMonths || 12,
      passportHistory: [{
        event: 'PURCHASED',
        details: `Received via GRN — ${order.poNumber}`,
        performedBy: receivedBy,
        amount: entry.purchasePrice,
      }],
    });
  }

  for (const item of order.lineItems) {
    const key = item.productId._id ? item.productId._id.toString() : item.productId.toString();
    if (receivedByLineItem[key]) {
      item.receivedQty = (item.receivedQty || 0) + receivedByLineItem[key];
    }
  }

  order.grnEntries.push(...grnEntries.map((e) => ({ ...e, receivedAt: new Date(), receivedBy })));
  order.receivedDate = new Date();

  const allReceived = order.lineItems.every((item) => item.receivedQty >= item.qty);
  order.status = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

  await order.save();

  const supplier = await Supplier.findOne({ _id: order.supplierId._id || order.supplierId, isDeleted: false });
  if (supplier) {
    supplier.totalPurchases += grnEntries.length;
    await supplier.save();
  }

  return order;
};

export const deletePurchaseOrder = async (id) => {
  const order = await PurchaseOrder.findOne({ _id: id, isDeleted: false });
  if (!order) throw ApiError.notFound('Purchase order not found');
  if (order.status !== 'DRAFT') throw ApiError.badRequest('Only draft orders can be deleted');
  order.isDeleted = true;
  await order.save();
  return order;
};

export const returnToSupplier = async (id, imeiOrSerials = [], reason = '', returnedBy = 'system') => {
  const order = await PurchaseOrder.findOne({ _id: id, isDeleted: false });
  if (!order) throw ApiError.notFound('Purchase order not found');

  const supplier = await Supplier.findOne({ _id: order.supplierId, isDeleted: false });
  let totalRefund = 0;
  const processedItems = [];

  for (const imei of imeiOrSerials) {
    const item = await InventoryUnit.findOne({ imeiOrSerial: imei, isDeleted: false });
    if (!item) continue;
    if (item.status === 'Returned to Supplier') continue;

    item.status = 'Returned to Supplier';
    item.passportHistory.push({
      event: 'RETURNED_TO_SUPPLIER',
      details: `Returned to supplier — Reason: ${reason || 'N/A'} (PO: ${order.poNumber})`,
      performedBy: returnedBy,
      amount: item.purchasePrice,
    });
    await item.save();

    if (item.productId) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: -1 } }).catch(() => {});
    }

    totalRefund += item.purchasePrice || 0;
    processedItems.push(imei);
  }

  if (supplier && totalRefund > 0) {
    supplier.dueBalance = Math.max(0, (supplier.dueBalance || 0) - totalRefund);
    await supplier.save();
  }

  return { returnedCount: processedItems.length, totalRefund, order };
};
