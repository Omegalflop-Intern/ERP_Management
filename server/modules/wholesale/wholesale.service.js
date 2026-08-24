import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';
import emitter, { EVENTS } from '../../events/index.js';
import { createAutomatedReturnJournal } from '../accounting/accounting.service.js';

const genOrderNumber = async (tenantId = null) => {
  const countQuery = db('wholesale_orders');
  if (tenantId) countQuery.where('tenant_id', tenantId);
  const countRes = await countQuery.count({ count: '*' }).first();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `WS-${date}-${String(Number(countRes?.count || 0) + 1).padStart(4, '0')}`;
};

function parseJSON(str) {
  if (typeof str === 'string') {
    try { return JSON.parse(str); } catch { return []; }
  }
  return str || [];
}

export function formatWholesalePrice(row, productRow = null) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    product: productRow ? {
      _id: String(productRow.id),
      id: productRow.id,
      name: productRow.name,
      sku: productRow.sku,
      brand: productRow.brand,
    } : String(row.product_id),
    tier: row.tier,
    minQty: Number(row.min_qty || 1),
    maxQty: row.max_qty ? Number(row.max_qty) : null,
    price: Number(row.price || 0),
    isActive: Boolean(row.is_active),
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function formatWholesaleOrder(row, customerRow = null, userRow = null) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    orderNumber: row.order_number,
    customer: customerRow ? {
      _id: String(customerRow.id),
      id: customerRow.id,
      name: customerRow.name,
      phone: customerRow.phone,
      companyName: customerRow.company_name || '',
    } : String(row.customer_id),
    items: parseJSON(row.items),
    subTotal: Number(row.sub_total || 0),
    discount: Number(row.discount || 0),
    grandTotal: Number(row.grand_total || 0),
    paidAmount: Number(row.paid_amount || 0),
    dueAmount: Number(row.due_amount || 0),
    paymentMethod: row.payment_method || 'CASH',
    status: row.status || 'PENDING',
    notes: row.notes || '',
    createdBy: userRow ? {
      _id: String(userRow.id),
      id: userRow.id,
      username: userRow.username,
    } : (row.created_by ? String(row.created_by) : null),
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId, tablePrefix = 'wholesale_orders') {
  if (tenantId) {
    query.where(`${tablePrefix}.tenant_id`, tenantId);
  }
}

// Prices
export const getAllPrices = async (page = 1, limit = 50, filters = {}, tenantId = null) => {
  const countQuery = db('wholesale_prices').where('wholesale_prices.is_deleted', false);
  applyTenantScope(countQuery, tenantId, 'wholesale_prices');
  if (filters.product) countQuery.where('wholesale_prices.product_id', filters.product);

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('wholesale_prices')
    .leftJoin('products', 'wholesale_prices.product_id', 'products.id')
    .where('wholesale_prices.is_deleted', false)
    .select(
      'wholesale_prices.*',
      'products.id as p_id', 'products.name as p_name', 'products.sku as p_sku', 'products.brand as p_brand'
    );
  applyTenantScope(dataQuery, tenantId, 'wholesale_prices');
  if (filters.product) dataQuery.where('wholesale_prices.product_id', filters.product);

  const rows = await dataQuery.orderBy('wholesale_prices.created_at', 'desc').limit(limit).offset(offset);

  const prices = rows.map((row) => {
    const pRow = row.p_id ? { id: row.p_id, name: row.p_name, sku: row.p_sku, brand: row.p_brand } : null;
    return formatWholesalePrice(row, pRow);
  });

  return { prices, pagination: getPagination(total, page, limit) };
};

export const createPrice = async (data, tenantId = null) => {
  const [insertedId] = await db('wholesale_prices').insert({
    tenant_id: tenantId || data.tenantId || null,
    product_id: data.product || data.productId,
    tier: data.tier,
    min_qty: data.minQty || 1,
    max_qty: data.maxQty || null,
    price: data.price,
    is_active: data.isActive !== undefined ? Boolean(data.isActive) : true,
    is_deleted: false,
  });

  const q = db('wholesale_prices').where({ id: insertedId });
  if (tenantId) q.andWhere('tenant_id', tenantId);
  const row = await q.first();
  return formatWholesalePrice(row);
};

export const updatePrice = async (id, data, tenantId = null) => {
  const query = db('wholesale_prices').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId, 'wholesale_prices');
  const price = await query.first();
  if (!price) throw ApiError.notFound('Wholesale price not found');

  const updateFields = {};
  if (data.tier !== undefined) updateFields.tier = data.tier;
  if (data.minQty !== undefined) updateFields.min_qty = data.minQty;
  if (data.maxQty !== undefined) updateFields.max_qty = data.maxQty;
  if (data.price !== undefined) updateFields.price = data.price;
  if (data.isActive !== undefined) updateFields.is_active = Boolean(data.isActive);

  if (Object.keys(updateFields).length > 0) {
    const uq = db('wholesale_prices').where({ id });
    if (tenantId) uq.andWhere('tenant_id', tenantId);
    await uq.update(updateFields);
  }

  const rq = db('wholesale_prices').where({ id });
  if (tenantId) rq.andWhere('tenant_id', tenantId);
  const updated = await rq.first();
  return formatWholesalePrice(updated);
};

export const deletePrice = async (id, tenantId = null) => {
  const query = db('wholesale_prices').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId, 'wholesale_prices');
  const price = await query.first();
  if (!price) throw ApiError.notFound('Wholesale price not found');

  const delQ = db('wholesale_prices').where({ id });
  if (tenantId) delQ.andWhere('tenant_id', tenantId);
  await delQ.update({ is_deleted: true });
  return { id, isDeleted: true };
};

// Orders
export const getAllOrders = async (page = 1, limit = 20, filters = {}, tenantId = null, branchId = null) => {
  // Fetch from wholesale_orders table
  const wsQuery = db('wholesale_orders').where('wholesale_orders.is_deleted', false);
  applyTenantScope(wsQuery, tenantId, 'wholesale_orders');
  if (branchId) wsQuery.where('wholesale_orders.branch_id', branchId);
  if (filters.status) wsQuery.where('wholesale_orders.status', filters.status);
  const wsRows = await wsQuery.select('wholesale_orders.id as _src_id');

  // Fetch wholesale-type sales from transactions table
  const txQuery = db('transactions').where({ is_deleted: false, sale_type: 'WHOLESALE' });
  applyTenantScope(txQuery, tenantId, 'transactions');
  if (branchId) txQuery.where('transactions.branch_id', branchId);
  if (filters.status) txQuery.where('transactions.status', filters.status);
  const txRows = await txQuery.select('transactions.id as _src_id');

  const totalCount = wsRows.length + txRows.length;

  const countQuery = db('wholesale_orders').where('wholesale_orders.is_deleted', false);
  applyTenantScope(countQuery, tenantId, 'wholesale_orders');
  if (branchId) countQuery.where('wholesale_orders.branch_id', branchId);
  if (filters.status) countQuery.where('wholesale_orders.status', filters.status);
  const countRes = await countQuery.count({ total: '*' }).first();
  const wsCount = Number(countRes?.total || 0);

  const txCountQuery = db('transactions').where({ is_deleted: false, sale_type: 'WHOLESALE' });
  applyTenantScope(txCountQuery, tenantId, 'transactions');
  if (branchId) txCountQuery.where('transactions.branch_id', branchId);
  if (filters.status) txCountQuery.where('transactions.status', filters.status);
  const txCountRes = await txCountQuery.count({ total: '*' }).first();
  const txCount = Number(txCountRes?.total || 0);

  const total = wsCount + txCount;

  const offset = (page - 1) * limit;

  // Fetch wholesale_orders
  const dataQuery = db('wholesale_orders')
    .leftJoin('customers', 'wholesale_orders.customer_id', 'customers.id')
    .leftJoin('users', 'wholesale_orders.created_by', 'users.id')
    .where('wholesale_orders.is_deleted', false)
    .select(
      'wholesale_orders.*',
      'customers.id as c_id', 'customers.name as c_name', 'customers.phone as c_phone', 'customers.company_name as c_company',
      'users.id as u_id', 'users.username as u_username'
    );
  applyTenantScope(dataQuery, tenantId, 'wholesale_orders');
  if (branchId) dataQuery.where('wholesale_orders.branch_id', branchId);
  if (filters.status) dataQuery.where('wholesale_orders.status', filters.status);
  const wsOrderRows = await dataQuery.orderBy('wholesale_orders.created_at', 'desc').limit(limit).offset(offset);

  // Fetch wholesale-type transactions
  const txDataQuery = db('transactions')
    .leftJoin('customers', 'transactions.customer_id', 'customers.id')
    .where({ 'transactions.is_deleted': false, 'transactions.sale_type': 'WHOLESALE' })
    .select(
      'transactions.*',
      'customers.id as c_id', 'customers.name as c_name', 'customers.phone as c_phone', 'customers.company_name as c_company'
    );
  applyTenantScope(txDataQuery, tenantId, 'transactions');
  if (branchId) txDataQuery.where('transactions.branch_id', branchId);
  if (filters.status) txDataQuery.where('transactions.status', filters.status);
  const txOrderRows = await txDataQuery.orderBy('transactions.created_at', 'desc').limit(limit).offset(offset);

  const allRows = [...wsOrderRows, ...txOrderRows]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);

  const orders = allRows.map((row) => {
    const cRow = row.c_id ? { id: row.c_id, name: row.c_name, phone: row.c_phone, company_name: row.c_company } : null;
    const uRow = row.u_id ? { id: row.u_id, username: row.u_username } : (row.cashier_username ? { username: row.cashier_username } : null);
    // Check if this is a transactions row (has invoice_number) or wholesale_orders row (has order_number)
    if (row.invoice_number && !row.order_number) {
      // Convert transactions row to wholesale order format
      let pb = {};
      try { pb = typeof row.payment_breakdown === 'string' ? JSON.parse(row.payment_breakdown) : (row.payment_breakdown || {}); } catch { pb = {}; }
      let items = [];
      try { items = typeof row.line_items === 'string' ? JSON.parse(row.line_items) : (row.line_items || []); } catch { items = []; }
      const wsItems = items.map(it => ({
        productId: it.productId,
        name: it.description || it.name || 'Product',
        quantity: it.qty || it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        total: (it.unitPrice || 0) * (it.qty || it.quantity || 1),
      }));
      return {
        _id: String(row.id),
        id: row.id,
        tenantId: row.tenant_id || null,
        orderNumber: row.invoice_number,
        customer: cRow || null,
        items: wsItems,
        subTotal: Number(row.sub_total || 0),
        discount: Number(row.discount || 0),
        grandTotal: Number(row.grand_total || row.net_total || 0),
        paidAmount: Number(row.paid_amount || 0),
        dueAmount: Number(pb.dueAmount || 0),
        paymentMethod: row.payment_method || 'CASH',
        status: row.status || 'COMPLETED',
        notes: row.notes || '',
        createdBy: uRow || null,
        isFromSale: true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }
    return formatWholesaleOrder(row, cRow, uRow);
  });

  return { orders, pagination: getPagination(total, page, limit) };
};

export const getOrderById = async (id, tenantId = null) => {
  const dataQuery = db('wholesale_orders')
    .leftJoin('customers', 'wholesale_orders.customer_id', 'customers.id')
    .leftJoin('users', 'wholesale_orders.created_by', 'users.id')
    .where({ 'wholesale_orders.id': id, 'wholesale_orders.is_deleted': false })
    .select(
      'wholesale_orders.*',
      'customers.id as c_id', 'customers.name as c_name', 'customers.phone as c_phone', 'customers.company_name as c_company',
      'users.id as u_id', 'users.username as u_username'
    );
  applyTenantScope(dataQuery, tenantId, 'wholesale_orders');

  const row = await dataQuery.first();
  if (!row) throw ApiError.notFound('Order not found');

  const cRow = row.c_id ? { id: row.c_id, name: row.c_name, phone: row.c_phone, company_name: row.c_company } : null;
  const uRow = row.u_id ? { id: row.u_id, username: row.u_username } : null;

  return formatWholesaleOrder(row, cRow, uRow);
};

export const createOrder = async (data, userId, tenantId = null) => {
  const orderNumber = await genOrderNumber(tenantId);
  const items = (data.items || []).map(item => ({ ...item, total: item.quantity * item.unitPrice }));
  const subTotal = items.reduce((sum, i) => sum + i.total, 0);
  const grandTotal = subTotal - (data.discount || 0);
  const paidAmount = data.paidAmount || 0;
  const dueAmount = grandTotal - paidAmount;

  const [insertedId] = await db('wholesale_orders').insert({
    tenant_id: tenantId || data.tenantId || null,
    branch_id: data.branchId || null,
    order_number: orderNumber,
    customer_id: data.customer || data.customerId,
    items: JSON.stringify(items),
    sub_total: subTotal,
    discount: data.discount || 0,
    grand_total: grandTotal,
    paid_amount: paidAmount,
    due_amount: dueAmount,
    payment_method: data.paymentMethod || 'CASH',
    status: data.status || 'PENDING',
    notes: data.notes || null,
    created_by: userId || null,
    is_deleted: false,
  });

  return getOrderById(insertedId, tenantId);
};

export const updateOrder = async (id, data, tenantId = null) => {
  const order = await getOrderById(id, tenantId);
  if (!order) throw ApiError.notFound('Order not found');

  const updateFields = {};
  if (data.status !== undefined) updateFields.status = data.status;
  if (data.paidAmount !== undefined) {
    updateFields.paid_amount = data.paidAmount;
    updateFields.due_amount = Math.max(0, order.grandTotal - data.paidAmount);
  }

  if (Object.keys(updateFields).length > 0) {
    const oq = db('wholesale_orders').where({ id });
    if (tenantId) oq.andWhere('tenant_id', tenantId);
    await oq.update(updateFields);
  }

  return getOrderById(id, tenantId);
};

export const deleteOrder = async (id, tenantId = null) => {
  const order = await getOrderById(id, tenantId);
  if (!order) throw ApiError.notFound('Order not found');

  const delQ = db('wholesale_orders').where({ id });
  if (tenantId) delQ.andWhere('tenant_id', tenantId);
  await delQ.update({ is_deleted: true });
  return { ...order, isDeleted: true };
};

export const getOrdersStats = async (tenantId = null) => {
  const query = db('wholesale_orders').where({ is_deleted: false });
  applyTenantScope(query, tenantId, 'wholesale_orders');

  const countRes = await query.count({ totalOrders: '*' }).sum({ totalRevenue: 'grand_total' }).sum({ totalDue: 'due_amount' }).first();

  const totalOrders = Number(countRes?.totalOrders || 0);
  const totalRevenue = Number(countRes?.totalRevenue || 0);
  const totalDue = Number(countRes?.totalDue || 0);
  const totalPaid = Math.max(0, totalRevenue - totalDue);

  return { totalOrders, totalRevenue, totalPaid, totalDue };
};

export const collectOrderDue = async (id, data, tenantId = null) => {
  const amount = Number(data.amount || 0);
  if (isNaN(amount) || amount <= 0) throw ApiError.badRequest('Please enter a valid payment amount');

  // 1. Check wholesale_orders table
  const wsQ = db('wholesale_orders').where({ id, is_deleted: false });
  applyTenantScope(wsQ, tenantId, 'wholesale_orders');
  const wsOrder = await wsQ.first();

  if (wsOrder) {
    const oldDue = Number(wsOrder.due_amount || 0);
    const pay = Math.min(amount, oldDue);
    const newPaid = Number(wsOrder.paid_amount || 0) + pay;
    const newDue = Math.max(0, oldDue - pay);
    const newStatus = newDue === 0 ? 'COMPLETED' : wsOrder.status;

    await db('wholesale_orders').where({ id }).update({
      paid_amount: newPaid,
      due_amount: newDue,
      status: newStatus,
      updated_at: new Date(),
    });

    // Recalculate customer due
    if (wsOrder.customer_id) {
      await recalculateCustomerBalance(wsOrder.customer_id, tenantId);
    }

    const updated = await getOrderById(id, tenantId);
    return { success: true, collectedAmount: pay, order: updated };
  }

  // 2. Fallback: check transactions table
  const txQ = db('transactions').where({ id, is_deleted: false });
  applyTenantScope(txQ, tenantId, 'transactions');
  const tx = await txQ.first();
  if (!tx) throw ApiError.notFound('Wholesale order not found');

  let pb = {};
  try { pb = typeof tx.payment_breakdown === 'string' ? JSON.parse(tx.payment_breakdown) : (tx.payment_breakdown || {}); } catch { pb = {}; }
  const oldDue = Number(pb.dueAmount || 0);
  const pay = Math.min(amount, oldDue);
  pb.dueAmount = Math.max(0, oldDue - pay);
  const pMethod = (data.paymentMethod || 'cash').toLowerCase();
  pb[pMethod] = (Number(pb[pMethod]) || 0) + pay;

  await db('transactions').where({ id }).update({
    payment_breakdown: JSON.stringify(pb),
    updated_at: new Date(),
  });

  if (tx.customer_id) {
    await recalculateCustomerBalance(tx.customer_id, tenantId);
  }

  return { success: true, collectedAmount: pay };
};

export const processOrderReturn = async (id, data, username = 'system', tenantId = null) => {
  const returnItems = data.items || [];
  if (!returnItems.length) throw ApiError.badRequest('Please specify items to return');

  let refundAmount = 0;
  const returnInvoiceNumber = `RET-WS-${id}-${Date.now().toString(36).toUpperCase().slice(-4)}`;

  // 1. Restock products in inventory
  for (const ri of returnItems) {
    const pId = ri.productId?._id || ri.productId?.id || ri.productId;
    const qty = Math.abs(Number(ri.quantity || ri.qty || 1));
    const uPrice = Number(ri.unitPrice || ri.price || 0);
    refundAmount += (uPrice * qty);

    if (pId) {
      await db('products').where({ id: pId }).increment('stock_quantity', qty);
      emitter.emit(EVENTS.STOCK_UPDATED, { id: pId, name: ri.name || 'Wholesale Product', tenantId });
      emitter.emit(EVENTS.PRODUCT_MUTATED, { id: pId, tenantId });
    }

    if (ri.imeiOrSerial) {
      await db('imei_records').where({ imei: ri.imeiOrSerial }).update({ status: 'AVAILABLE', updated_at: new Date() });
    }
  }

  refundAmount = Number(refundAmount.toFixed(2));

  // 2. Check wholesale_orders table
  const wsQ = db('wholesale_orders').where({ id, is_deleted: false });
  applyTenantScope(wsQ, tenantId, 'wholesale_orders');
  const wsOrder = await wsQ.first();

  let customerId = null;
  let customerName = null;
  let customerPhone = null;

  if (wsOrder) {
    customerId = wsOrder.customer_id;
    const oldDue = Number(wsOrder.due_amount || 0);
    const dueReduction = Math.min(oldDue, refundAmount);
    const newDue = Math.max(0, oldDue - dueReduction);
    const cashRefund = refundAmount - dueReduction;
    const newPaid = Math.max(0, Number(wsOrder.paid_amount || 0) - cashRefund);
    const newGrandTotal = Math.max(0, Number(wsOrder.grand_total || 0) - refundAmount);

    let existingItems = [];
    try { existingItems = typeof wsOrder.items === 'string' ? JSON.parse(wsOrder.items) : (wsOrder.items || []); } catch { existingItems = []; }

    const returnLog = {
      date: new Date().toISOString(),
      returnInvoiceNumber,
      items: returnItems,
      refundAmount,
      reason: data.reason || 'Wholesale Customer Return',
      notes: data.notes || '',
    };

    let existingLogs = [];
    try { existingLogs = typeof wsOrder.return_logs === 'string' ? JSON.parse(wsOrder.return_logs) : (wsOrder.return_logs || []); } catch { existingLogs = []; }

    await db('wholesale_orders').where({ id }).update({
      grand_total: newGrandTotal,
      due_amount: newDue,
      paid_amount: newPaid,
      status: newGrandTotal === 0 ? 'RETURNED' : (newDue === 0 ? 'COMPLETED' : 'PARTIAL_RETURN'),
      updated_at: new Date(),
    });

    if (customerId) {
      const cRow = await db('customers').where({ id: customerId }).first();
      if (cRow) {
        customerName = cRow.name;
        customerPhone = cRow.phone;
      }
    }
  } else {
    // Check transactions table
    const txQ = db('transactions').where({ id, is_deleted: false });
    applyTenantScope(txQ, tenantId, 'transactions');
    const tx = await txQ.first();
    if (!tx) throw ApiError.notFound('Wholesale order or transaction not found');

    customerId = tx.customer_id;
    customerName = tx.customer_name;
    customerPhone = tx.customer_phone;

    let pb = {};
    try { pb = typeof tx.payment_breakdown === 'string' ? JSON.parse(tx.payment_breakdown) : (tx.payment_breakdown || {}); } catch { pb = {}; }
    const oldDue = Number(pb.dueAmount || 0);
    const newDue = Math.max(0, oldDue - refundAmount);
    pb.dueAmount = newDue;

    const newReturnedAmount = Number(tx.returned_amount || 0) + refundAmount;
    let existingLogs = [];
    try { existingLogs = typeof tx.return_logs === 'string' ? JSON.parse(tx.return_logs) : (tx.return_logs || []); } catch { existingLogs = []; }

    existingLogs.push({
      date: new Date().toISOString(),
      returnInvoiceNumber,
      items: returnItems,
      refundAmount,
      reason: data.reason || 'Wholesale Customer Return',
    });

    await db('transactions').where({ id }).update({
      returned_amount: newReturnedAmount,
      return_logs: JSON.stringify(existingLogs),
      payment_breakdown: JSON.stringify(pb),
      status: newReturnedAmount >= Number(tx.net_total || 0) ? 'RETURNED' : 'PARTIAL_RETURN',
      updated_at: new Date(),
    });
  }

  // 3. Record official RETURN transaction row for Customer Ledger & CRM
  try {
    await db('transactions').insert({
      tenant_id: tenantId || null,
      invoice_number: returnInvoiceNumber,
      tx_type: 'RETURN',
      sale_type: 'WHOLESALE',
      status: 'COMPLETED',
      customer_id: customerId || null,
      customer_name: customerName || 'Wholesale Customer',
      customer_phone: customerPhone || null,
      line_items: JSON.stringify(returnItems),
      sub_total: -refundAmount,
      discount: 0,
      tax: 0,
      net_total: -refundAmount,
      returned_amount: refundAmount,
      payment_breakdown: JSON.stringify({ refundAmount, wholesaleOrderId: id }),
      cashier_username: username || 'system',
      created_at: new Date(),
      updated_at: new Date(),
    });
  } catch (err) {
    console.error('[Wholesale Return Tx Insert Error]:', err.message);
  }

  // 4. Recalculate customer due balance & total purchases
  if (customerId) {
    await recalculateCustomerBalance(customerId, tenantId);
    emitter.emit(EVENTS.CUSTOMER_MUTATED, { id: customerId, tenantId });
  }

  // 5. Automated Accounting Journal Entry
  createAutomatedReturnJournal({
    id,
    tenant_id: tenantId,
    invoice_number: returnInvoiceNumber,
    customer_name: customerName,
    payment_breakdown: { dueAmount: refundAmount },
    line_items: returnItems,
  }, refundAmount, returnInvoiceNumber).catch((err) =>
    console.error('[Wholesale Return Accounting Error]:', err.message)
  );

  return { success: true, refundAmount, returnInvoiceNumber };
};

const recalculateCustomerBalance = async (customerId, tenantId = null) => {
  // Sales Due
  const salesQuery = db('transactions').where({ customer_id: customerId, is_deleted: false, tx_type: 'SALE' });
  if (tenantId) salesQuery.andWhere('tenant_id', tenantId);
  const allSales = await salesQuery.select('payment_breakdown', 'net_total', 'returned_amount');

  let totalDue = allSales.reduce((sum, s) => {
    const spb = typeof s.payment_breakdown === 'string' ? (() => { try { return JSON.parse(s.payment_breakdown); } catch { return {}; } })() : (s.payment_breakdown || {});
    return sum + Number(spb.dueAmount || 0);
  }, 0);

  let totalPurchases = allSales.reduce((sum, s) => {
    return sum + Math.max(0, Number(s.net_total || 0) - Number(s.returned_amount || 0));
  }, 0);

  // Wholesale Orders Due
  const wsQuery = db('wholesale_orders').where({ customer_id: customerId, is_deleted: false });
  if (tenantId) wsQuery.andWhere('tenant_id', tenantId);
  const wsOrders = await wsQuery.select('due_amount', 'grand_total');

  totalDue += wsOrders.reduce((sum, o) => sum + Number(o.due_amount || 0), 0);
  totalPurchases += wsOrders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);

  const custUpdate = db('customers').where({ id: customerId });
  if (tenantId) custUpdate.andWhere('tenant_id', tenantId);
  await custUpdate.update({
    due_balance: Math.max(0, totalDue),
    total_purchases: Math.max(0, totalPurchases),
  });
};
