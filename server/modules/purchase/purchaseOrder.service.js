import { PurchaseOrder } from './purchaseOrder.model.js';
import { Supplier } from '../supplier/supplier.model.js';
import { InventoryUnit } from '../imei/imei.model.js';
import { Product } from '../product/product.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';
import { createAutomatedPurchaseReturnJournal, createAutomatedPurchaseJournal } from '../accounting/accounting.service.js';

const generatePoNumber = () => 'PO-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

const withTenant = (query, tenantId) => {
  if (tenantId) query.tenantId = tenantId;
  return query;
};

export const getAllPurchaseOrders = async (page = 1, limit = 20, search = '', status = '', tenantId = null) => {
  const query = { isDeleted: false };
  withTenant(query, tenantId);
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

export const getPurchaseOrderById = async (id, tenantId = null) => {
  const query = withTenant({ _id: id, isDeleted: false }, tenantId);
  const order = await PurchaseOrder.findOne(query)
    .populate('supplierId', 'name phone company address dueBalance creditBalance')
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
    tenantId: data.tenantId || null,
    supplierId: data.supplierId,
    status: 'APPROVED',
    approvedBy: 'system',
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

export const updatePurchaseOrder = async (id, data, tenantId = null) => {
  const query = withTenant({ _id: id, isDeleted: false }, tenantId);
  const order = await PurchaseOrder.findOne(query);
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

export const receiveGoods = async (id, grnEntries, receivedBy = 'system', tenantId = null) => {
  const query = withTenant({ _id: id, isDeleted: false }, tenantId);
  const order = await PurchaseOrder.findOne(query)
    .populate('supplierId', 'name')
    .populate('lineItems.productId', 'name');
  if (!order) throw ApiError.notFound('Purchase order not found');

  if (order.status !== 'APPROVED' && order.status !== 'PARTIALLY_RECEIVED') {
    throw ApiError.badRequest('Order must be approved before receiving goods');
  }

  for (const entry of grnEntries) {
    const existing = await InventoryUnit.findOne({
      imeiOrSerial: entry.imeiOrSerial,
      isDeleted: false,
      ...(tenantId ? { tenantId } : {}),
    });
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
      tenantId: tenantId || null,
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

  await createAutomatedPurchaseJournal(order, grnEntries).catch((err) => {
    console.error('Purchase journal failed:', order.poNumber, err);
  });

  const supplier = await Supplier.findOne({
    _id: order.supplierId._id || order.supplierId,
    isDeleted: false,
  });
  if (supplier) {
    supplier.totalPurchases += grnEntries.length;
    await supplier.save();
  }

  return order;
};

export const deletePurchaseOrder = async (id, tenantId = null) => {
  const query = withTenant({ _id: id, isDeleted: false }, tenantId);
  const order = await PurchaseOrder.findOne(query);
  if (!order) throw ApiError.notFound('Purchase order not found');
  if (order.status === 'RECEIVED' || order.status === 'PARTIALLY_RECEIVED' || order.status === 'CANCELLED') {
    throw ApiError.badRequest('Only un-received orders can be deleted');
  }
  order.isDeleted = true;
  await order.save();
  return order;
};

export const returnToSupplier = async (id, imeiOrSerials = [], reason = '', returnedBy = 'system', tenantId = null) => {
  const query = withTenant({ _id: id, isDeleted: false }, tenantId);
  const order = await PurchaseOrder.findOne(query)
    .populate('supplierId', '_id name dueBalance creditBalance');
  if (!order) throw ApiError.notFound('Purchase order not found');

  if (order.status !== 'RECEIVED' && order.status !== 'PARTIALLY_RECEIVED') {
    throw ApiError.badRequest('Only received orders can be returned to supplier');
  }
  if (!imeiOrSerials.length) {
    throw ApiError.badRequest('Select at least one IMEI/serial to return');
  }

  const receivedImeiSet = new Set((order.grnEntries || []).map((e) => e.imeiOrSerial).filter(Boolean));
  const alreadyReturnedSet = new Set((order.returnLogs || []).map((r) => r.imeiOrSerial));

  let totalRefund = 0;
  const processedItems = [];
  const skippedItems = [];
  const newReturnLogs = [];

  for (const imei of imeiOrSerials) {
    if (!receivedImeiSet.has(imei)) {
      skippedItems.push(imei);
      continue;
    }
    if (alreadyReturnedSet.has(imei)) {
      skippedItems.push(imei);
      continue;
    }

    const item = await InventoryUnit.findOne({
      imeiOrSerial: imei,
      isDeleted: false,
      ...(tenantId ? { tenantId } : {}),
    });
    if (!item || item.status === 'Returned to Supplier') {
      skippedItems.push(imei);
      continue;
    }
    if (!['Available', 'Reserved'].includes(item.status)) {
      skippedItems.push(imei);
      continue;
    }

    item.status = 'Returned to Supplier';
    item.passportHistory.push({
      event: 'RETURNED_TO_SUPPLIER',
      details: `Returned to supplier — Reason: ${reason || 'N/A'} (PO: ${order.poNumber})`,
      performedBy: returnedBy,
      amount: item.purchasePrice,
    });
    await item.save();

    if (item.productId) {
      await Product.updateOne({ _id: item.productId }, { $inc: { stockQuantity: -1 } }).catch(() => {});
    }

    const lineItem = order.lineItems.find((li) =>
      (li.productId?._id ? li.productId._id.toString() : li.productId.toString()) === item.productId.toString()
    );
    if (lineItem) {
      lineItem.returnedQty = (lineItem.returnedQty || 0) + 1;
    }

    newReturnLogs.push({
      imeiOrSerial: imei,
      productId: item.productId,
      purchasePrice: item.purchasePrice,
      reason: reason || '',
      returnedBy,
      returnedAt: new Date(),
    });

    totalRefund += item.purchasePrice || 0;
    processedItems.push(imei);
  }

  if (processedItems.length === 0) {
    throw ApiError.badRequest('No valid items to return. Items must belong to this order and not already be returned.');
  }

  order.returnLogs.push(...newReturnLogs);
  order.returnedCount = (order.returnedCount || 0) + processedItems.length;
  order.returnedAmount = (order.returnedAmount || 0) + totalRefund;
  order.returnedDate = new Date();

  // Reconcile money: returns first cancel outstanding due on this PO, then any
  // remainder is cash the supplier owes the shop (reduces effective paid).
  const refundFromDue = Math.min(order.dueAmount || 0, totalRefund);
  order.dueAmount = Math.max(0, (order.dueAmount || 0) - refundFromDue);
  const cashBack = totalRefund - refundFromDue;
  if (cashBack > 0) {
    order.paidAmount = Math.max(0, (order.paidAmount || 0) - cashBack);
  }
  await order.save();

  if (order.supplierId && totalRefund > 0) {
    const supplier = order.supplierId._id
      ? await Supplier.findOne({ _id: order.supplierId._id, isDeleted: false })
      : order.supplierId;
    if (supplier) {
      const appliedToDue = Math.min(supplier.dueBalance || 0, refundFromDue);
      supplier.dueBalance = (supplier.dueBalance || 0) - appliedToDue;
      if (cashBack > 0) {
        supplier.creditBalance = (supplier.creditBalance || 0) + cashBack;
      }
      await supplier.save();
    }
  }

  await createAutomatedPurchaseReturnJournal(order, totalRefund)
    .catch((err) => console.error('Purchase return journal failed:', err));

  return { returnedCount: processedItems.length, skippedCount: skippedItems.length, totalRefund, order };
};
