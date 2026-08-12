import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

const generatePoNumber = () => 'PO-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

function parseJSON(str) {
  if (typeof str === 'string') {
    try { return JSON.parse(str); } catch { return []; }
  }
  return str || [];
}

export function formatPurchaseOrder(row, supplierRow = null) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    branchId: row.branch_id ? String(row.branch_id) : null,
    poNumber: row.po_number,
    supplierId: supplierRow ? {
      _id: String(supplierRow.id),
      id: supplierRow.id,
      name: supplierRow.name,
      phone: supplierRow.phone,
      company: supplierRow.company || '',
      address: supplierRow.address || '',
      dueBalance: Number(supplierRow.due_balance || 0),
      creditBalance: Number(supplierRow.credit_balance || 0),
    } : String(row.supplier_id),
    status: row.status || 'DRAFT',
    lineItems: parseJSON(row.line_items),
    grnEntries: parseJSON(row.grn_entries),
    returnLogs: parseJSON(row.return_logs),
    returnedCount: Number(row.returned_count || 0),
    returnedAmount: Number(row.returned_amount || 0),
    returnedDate: row.returned_date || null,
    subTotal: Number(row.sub_total || 0),
    discount: Number(row.discount || 0),
    tax: Number(row.tax || 0),
    netTotal: Number(row.net_total || 0),
    paidAmount: Number(row.paid_amount || 0),
    dueAmount: Number(row.due_amount || 0),
    paymentMethod: row.payment_method || 'CREDIT',
    expectedDeliveryDate: row.expected_delivery_date || null,
    receivedDate: row.received_date || null,
    notes: row.notes || '',
    createdBy: row.created_by || '',
    approvedBy: row.approved_by || '',
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where('purchase_orders.tenant_id', tenantId);
  }
}

export const getAllPurchaseOrders = async (page = 1, limit = 20, search = '', status = '', tenantId = null, branchId = null) => {
  const countQuery = db('purchase_orders').where('purchase_orders.is_deleted', false);
  applyTenantScope(countQuery, tenantId);
  if (branchId) countQuery.where('purchase_orders.branch_id', branchId);
  if (status && status !== 'ALL') countQuery.where('purchase_orders.status', status);
  if (search) {
    const term = `%${search}%`;
    countQuery.where((b) => {
      b.where('po_number', 'like', term).orWhere('notes', 'like', term);
    });
  }

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('purchase_orders')
    .leftJoin('suppliers', 'purchase_orders.supplier_id', 'suppliers.id')
    .where('purchase_orders.is_deleted', false)
    .select(
      'purchase_orders.*',
      'suppliers.id as s_id',
      'suppliers.name as s_name',
      'suppliers.phone as s_phone',
      'suppliers.company as s_company'
    );
  applyTenantScope(dataQuery, tenantId);
  if (branchId) dataQuery.where('purchase_orders.branch_id', branchId);
  if (status && status !== 'ALL') dataQuery.where('purchase_orders.status', status);
  if (search) {
    const term = `%${search}%`;
    dataQuery.where((b) => {
      b.where('purchase_orders.po_number', 'like', term).orWhere('purchase_orders.notes', 'like', term);
    });
  }

  const rows = await dataQuery.orderBy('purchase_orders.created_at', 'desc').limit(limit).offset(offset);

  const orders = rows.map((row) => {
    const sRow = row.s_id ? { id: row.s_id, name: row.s_name, phone: row.s_phone, company: row.s_company } : null;
    return formatPurchaseOrder(row, sRow);
  });

  return { orders, pagination: getPagination(total, page, limit) };
};

export const getPurchaseOrderById = async (id, tenantId = null, branchId = null) => {
  const dataQuery = db('purchase_orders')
    .leftJoin('suppliers', 'purchase_orders.supplier_id', 'suppliers.id')
    .where({ 'purchase_orders.id': id, 'purchase_orders.is_deleted': false })
    .select(
      'purchase_orders.*',
      'suppliers.id as s_id',
      'suppliers.name as s_name',
      'suppliers.phone as s_phone',
      'suppliers.company as s_company',
      'suppliers.address as s_address',
      'suppliers.due_balance as s_due_balance',
      'suppliers.credit_balance as s_credit_balance'
    );
  applyTenantScope(dataQuery, tenantId);
  if (branchId) dataQuery.where('purchase_orders.branch_id', branchId);

  const row = await dataQuery.first();
  if (!row) throw ApiError.notFound('Purchase order not found');

  const sRow = row.s_id ? {
    id: row.s_id, name: row.s_name, phone: row.s_phone, company: row.s_company,
    address: row.s_address, due_balance: row.s_due_balance, credit_balance: row.s_credit_balance
  } : null;

  return formatPurchaseOrder(row, sRow);
};

export const createPurchaseOrder = async (data, createdBy = 'system') => {
  const tenantId = data.tenantId || null;
  const supQuery = db('suppliers').where({ id: data.supplierId, is_deleted: false });
  if (tenantId) supQuery.where('tenant_id', tenantId);
  const supplier = await supQuery.first();
  if (!supplier) throw ApiError.notFound('Supplier not found');

  const lineItems = (data.lineItems || []).map((item) => ({
    ...item,
    totalCost: item.qty * item.unitCost,
  }));

  const subTotal = lineItems.reduce((sum, item) => sum + item.totalCost, 0);
  const discount = data.discount || 0;
  const tax = data.tax || 0;
  const netTotal = subTotal - discount + tax;
  const paidAmount = data.paidAmount || 0;
  const dueAmount = netTotal - paidAmount;

  const [insertedId] = await db('purchase_orders').insert({
    tenant_id: tenantId,
    branch_id: data.branchId || null,
    po_number: generatePoNumber(),
    supplier_id: data.supplierId,
    status: 'APPROVED',
    approved_by: 'system',
    line_items: JSON.stringify(lineItems),
    grn_entries: JSON.stringify([]),
    return_logs: JSON.stringify([]),
    sub_total: subTotal,
    discount,
    tax,
    net_total: netTotal,
    paid_amount: paidAmount,
    due_amount: dueAmount,
    payment_method: data.paymentMethod || 'CREDIT',
    expected_delivery_date: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
    notes: data.notes || null,
    created_by: createdBy,
    is_deleted: false,
  });

  return getPurchaseOrderById(insertedId, tenantId);
};

export const updatePurchaseOrder = async (id, data, tenantId = null, branchId = null) => {
  const order = await getPurchaseOrderById(id, tenantId, branchId);
  if (!order) throw ApiError.notFound('Purchase order not found');

  if (order.status === 'RECEIVED' || order.status === 'CANCELLED') {
    throw ApiError.badRequest('Cannot update a completed or cancelled order');
  }

  const updateFields = {};
  if (data.status) updateFields.status = data.status;
  if (data.notes !== undefined) updateFields.notes = data.notes;
  if (data.expectedDeliveryDate !== undefined) updateFields.expected_delivery_date = data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null;

  if (Object.keys(updateFields).length > 0) {
    const poUpdate = db('purchase_orders').where({ id });
    if (tenantId) poUpdate.andWhere('tenant_id', tenantId);
    if (branchId) poUpdate.andWhere('branch_id', branchId);
    await poUpdate.update(updateFields);
  }

  return getPurchaseOrderById(id, tenantId, branchId);
};

export const receiveGoods = async (id, grnEntries, receivedBy = 'system', tenantId = null, branchId = null) => {
  const order = await getPurchaseOrderById(id, tenantId, branchId);
  if (!order) throw ApiError.notFound('Purchase order not found');

  if (order.status !== 'APPROVED' && order.status !== 'PARTIALLY_RECEIVED') {
    throw ApiError.badRequest('Order must be approved before receiving goods');
  }

  for (const entry of grnEntries) {
    const imeiQuery = db('inventory_units').where({ imei_or_serial: entry.imeiOrSerial, is_deleted: false });
    if (tenantId) imeiQuery.where('tenant_id', tenantId);
    const existing = await imeiQuery.first();
    if (existing) throw ApiError.conflict(`IMEI ${entry.imeiOrSerial} already exists in inventory`);
  }

  const receivedByLineItem = {};
  for (const entry of grnEntries) {
    const key = String(entry.productId);
    receivedByLineItem[key] = (receivedByLineItem[key] || 0) + 1;

    const history = [{
      event: 'PURCHASED',
      details: `Received via GRN — ${order.poNumber}`,
      performedBy: receivedBy,
      amount: entry.purchasePrice,
      timestamp: new Date().toISOString(),
    }];

    await db('inventory_units').insert({
      tenant_id: tenantId || order.tenantId || null,
      imei_or_serial: entry.imeiOrSerial,
      product_id: entry.productId,
      supplier_id: order.supplierId?.id || order.supplierId,
      purchase_price: entry.purchasePrice,
      current_selling_price: entry.sellingPrice,
      warranty_months: entry.warrantyMonths || 12,
      passport_history: JSON.stringify(history),
      status: 'Available',
      is_deleted: false,
    });
  }

  const currentLineItems = order.lineItems || [];
  for (const item of currentLineItems) {
    const key = String(item.productId?._id || item.productId?.id || item.productId);
    if (receivedByLineItem[key]) {
      item.receivedQty = (item.receivedQty || 0) + receivedByLineItem[key];
    }
  }

  const currentGrnEntries = order.grnEntries || [];
  const newGrnEntries = grnEntries.map((e) => ({ ...e, receivedAt: new Date().toISOString(), receivedBy }));
  currentGrnEntries.push(...newGrnEntries);

  const allReceived = currentLineItems.every((item) => (item.receivedQty || 0) >= item.qty);
  const status = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

  const poReceiveUpdate = db('purchase_orders').where({ id });
  if (tenantId) poReceiveUpdate.andWhere('tenant_id', tenantId);
  if (branchId) poReceiveUpdate.andWhere('branch_id', branchId);
  await poReceiveUpdate.update({
    status,
    line_items: JSON.stringify(currentLineItems),
    grn_entries: JSON.stringify(currentGrnEntries),
    received_date: new Date(),
  });

  const supplierId = order.supplierId?.id || order.supplierId;
  const supQuery = db('suppliers').where({ id: supplierId, is_deleted: false });
  if (tenantId) supQuery.where('tenant_id', tenantId);
  const supplier = await supQuery.first();
  if (supplier) {
    const supUpdate = db('suppliers').where({ id: supplierId });
    if (tenantId) supUpdate.andWhere('tenant_id', tenantId);
    await supUpdate.update({
      total_purchases: Number(supplier.total_purchases || 0) + grnEntries.length,
    });
  }

  return getPurchaseOrderById(id, tenantId, branchId);
};

export const deletePurchaseOrder = async (id, tenantId = null, branchId = null) => {
  const order = await getPurchaseOrderById(id, tenantId, branchId);
  if (!order) throw ApiError.notFound('Purchase order not found');
  if (order.status === 'RECEIVED' || order.status === 'PARTIALLY_RECEIVED' || order.status === 'CANCELLED') {
    throw ApiError.badRequest('Only un-received orders can be deleted');
  }

  const poDel = db('purchase_orders').where({ id });
  if (tenantId) poDel.andWhere('tenant_id', tenantId);
  if (branchId) poDel.andWhere('branch_id', branchId);
  await poDel.update({ is_deleted: true });
  return { ...order, isDeleted: true };
};
