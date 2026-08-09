import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

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
export const getAllOrders = async (page = 1, limit = 20, filters = {}, tenantId = null) => {
  const countQuery = db('wholesale_orders').where('wholesale_orders.is_deleted', false);
  applyTenantScope(countQuery, tenantId, 'wholesale_orders');
  if (filters.status) countQuery.where('wholesale_orders.status', filters.status);

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
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
  if (filters.status) dataQuery.where('wholesale_orders.status', filters.status);

  const rows = await dataQuery.orderBy('wholesale_orders.created_at', 'desc').limit(limit).offset(offset);

  const orders = rows.map((row) => {
    const cRow = row.c_id ? { id: row.c_id, name: row.c_name, phone: row.c_phone, company_name: row.c_company } : null;
    const uRow = row.u_id ? { id: row.u_id, username: row.u_username } : null;
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
