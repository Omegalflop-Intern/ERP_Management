import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';
import emitter, { EVENTS } from '../../events/index.js';
import crypto from 'crypto';

const generateInvoiceNumber = async (tenantId = null) => {
  const query = db('transactions').where({ tx_type: 'SALE' });
  if (tenantId) query.where('tenant_id', tenantId);
  const countRes = await query.count({ count: '*' }).first();
  const num = (Number(countRes?.count || 0) + 1).toString().padStart(5, '0');
  return `INV-${new Date().getFullYear()}-${num}`;
};

function parseJSON(str) {
  if (typeof str === 'string') {
    try { return JSON.parse(str); } catch { return []; }
  }
  return str || [];
}

export function formatTransaction(row, customerRow = null) {
  if (!row) return null;
  const breakdown = typeof row.payment_breakdown === 'string' ? JSON.parse(row.payment_breakdown) : (row.payment_breakdown || {});

  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    branchId: row.branch_id ? String(row.branch_id) : null,
    invoiceNumber: row.invoice_number,
    txType: row.tx_type,
    saleType: row.sale_type || 'RETAIL',
    status: row.status || 'COMPLETED',
    customerId: customerRow ? {
      _id: String(customerRow.id),
      id: customerRow.id,
      name: customerRow.name,
      phone: customerRow.phone,
      email: customerRow.email || '',
      address: customerRow.address || '',
    } : (row.customer_id ? String(row.customer_id) : null),
    supplierId: row.supplier_id ? String(row.supplier_id) : null,
    lineItems: parseJSON(row.line_items),
    returnLogs: parseJSON(row.return_logs),
    customerName: row.customer_name || '',
    customerPhone: row.customer_phone || '',
    customerEmail: row.customer_email || '',
    customerAddress: row.customer_address || '',
    subTotal: Number(row.sub_total || 0),
    discount: Number(row.discount || 0),
    tax: Number(row.tax || 0),
    netTotal: Number(row.net_total || 0),
    returnedAmount: Number(row.returned_amount || 0),
    paymentBreakdown: {
      cash: Number(breakdown.cash || 0),
      bkash: Number(breakdown.bkash || 0),
      rocket: Number(breakdown.rocket || 0),
      nagad: Number(breakdown.nagad || 0),
      bank: Number(breakdown.bank || 0),
      dueAmount: Number(breakdown.dueAmount || 0),
    },
    cashierUsername: row.cashier_username || '',
    sellerName: row.seller_name || '',
    sellerId: row.seller_id || null,
    publicToken: row.public_token || null,
    tokenExpiresAt: row.token_expires_at || null,
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId, tablePrefix = 'transactions') {
  if (tenantId) {
    query.where(`${tablePrefix}.tenant_id`, tenantId);
  }
}

export const createSale = async (data, createdBy = 'system') => {
  const tenantId = data.tenantId || null;
  let subTotal = 0;
  const lineItems = [];

  for (const item of data.items) {
    const prodQuery = db('products').where({ id: item.productId, is_deleted: false });
    if (tenantId) prodQuery.where('tenant_id', tenantId);
    const product = await prodQuery.first();
    if (!product) throw ApiError.notFound(`Product not found: ${item.productId}`);

    let unitCost = Number(product.cost_price || 0);

    if (item.imeiOrSerial) {
      const unitQuery = db('inventory_units').where({ imei_or_serial: item.imeiOrSerial, status: 'Available', is_deleted: false });
      if (tenantId) unitQuery.where('tenant_id', tenantId);
      const unit = await unitQuery.first();
      if (!unit) throw ApiError.badRequest(`IMEI ${item.imeiOrSerial} is not available for sale`);
      unitCost = Number(unit.purchase_price || product.cost_price || 0);
    } else {
      const requestedQty = Math.abs(item.qty || 1);
      if (Number(product.stock_quantity || 0) < requestedQty) {
        throw ApiError.badRequest(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity} pcs`);
      }
    }

    const itemTotal = (item.unitPrice * item.qty) - (item.discount || 0);
    subTotal += itemTotal;
    lineItems.push({
      productId: item.productId,
      imeiOrSerial: item.imeiOrSerial || null,
      description: item.description || product.name,
      qty: item.qty,
      unitPrice: item.unitPrice,
      unitCost,
      totalPrice: itemTotal,
    });
  }

  const netTotal = subTotal - (data.discount || 0) + (data.tax || 0);
  const paidAmount = (data.paymentBreakdown?.cash || 0) +
    (data.paymentBreakdown?.bkash || 0) +
    (data.paymentBreakdown?.rocket || 0) +
    (data.paymentBreakdown?.nagad || 0) +
    (data.paymentBreakdown?.bank || 0);

  if (paidAmount > netTotal + 0.01) {
    throw ApiError.badRequest(`Paid amount (৳${paidAmount}) exceeds sale total (৳${netTotal})`);
  }
  const dueAmount = netTotal - paidAmount;

  let customerId = data.customerId || null;
  let customerObj = null;
  if (customerId) {
    const custQuery = db('customers').where({ id: customerId, is_deleted: false });
    if (tenantId) custQuery.where('tenant_id', tenantId);
    customerObj = await custQuery.first();
  }

  const invoiceNumber = await generateInvoiceNumber(tenantId);
  const soldDate = new Date();

  for (const item of data.items) {
    if (item.imeiOrSerial) {
      const unitQuery = db('inventory_units').where({ imei_or_serial: item.imeiOrSerial, status: 'Available', is_deleted: false });
      if (tenantId) unitQuery.where('tenant_id', tenantId);
      const unit = await unitQuery.first();
      if (unit) {
        let history = [];
        try { history = typeof unit.passport_history === 'string' ? JSON.parse(unit.passport_history) : (unit.passport_history || []); } catch { history = []; }
        history.push({
          event: 'SOLD',
          details: `Sold on ${invoiceNumber}`,
          amount: item.unitPrice,
          performedBy: createdBy,
          timestamp: soldDate.toISOString(),
        });

        const unitUpdate = db('inventory_units').where({ id: unit.id });
        if (tenantId) unitUpdate.andWhere('tenant_id', tenantId);
        await unitUpdate.update({
          status: 'Sold',
          sold_invoice_number: invoiceNumber,
          sold_at: soldDate,
          sold_to_customer_id: customerId,
          passport_history: JSON.stringify(history),
        });

        const prodCountQuery = db('inventory_units').where({ product_id: item.productId, status: 'Available', is_deleted: false });
        if (tenantId) prodCountQuery.andWhere('tenant_id', tenantId);
        const availCountRes = await prodCountQuery.count({ count: '*' }).first();
        const prodUpdate = db('products').where({ id: item.productId });
        if (tenantId) prodUpdate.andWhere('tenant_id', tenantId);
        await prodUpdate.update({ stock_quantity: Number(availCountRes?.count || 0) });
      }
    } else {
      const requestedQty = Math.abs(item.qty || 1);
      await db('products').where({ id: item.productId }).decrement('stock_quantity', requestedQty);
    }
  }

  const paymentBreakdown = {
    cash: data.paymentBreakdown?.cash || 0,
    bkash: data.paymentBreakdown?.bkash || 0,
    rocket: data.paymentBreakdown?.rocket || 0,
    nagad: data.paymentBreakdown?.nagad || 0,
    bank: data.paymentBreakdown?.bank || 0,
    dueAmount,
  };

  const [insertedId] = await db('transactions').insert({
    tenant_id: tenantId,
    branch_id: data.branchId || null,
    invoice_number: invoiceNumber,
    tx_type: 'SALE',
    sale_type: data.saleType || 'RETAIL',
    status: 'COMPLETED',
    customer_id: customerId,
    line_items: JSON.stringify(lineItems),
    return_logs: JSON.stringify([]),
    customer_name: data.customerName || customerObj?.name || 'Walk-in Customer',
    customer_phone: data.customerPhone || customerObj?.phone || 'N/A',
    customer_email: data.customerEmail || customerObj?.email || null,
    customer_address: data.customerAddress || customerObj?.address || null,
    sub_total: subTotal,
    discount: data.discount || 0,
    tax: data.tax || 0,
    net_total: netTotal,
    returned_amount: 0,
    payment_breakdown: JSON.stringify(paymentBreakdown),
    cashier_username: createdBy,
    seller_name: data.sellerName || createdBy,
    seller_id: data.sellerId || null,
    public_token: crypto.randomBytes(24).toString('hex'),
    token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    is_deleted: false,
  });

  if (customerObj) {
    const custUpdate = db('customers').where({ id: customerObj.id });
    if (tenantId) custUpdate.andWhere('tenant_id', tenantId);
    await custUpdate.update({
      total_purchases: Number(customerObj.total_purchases || 0) + netTotal,
      due_balance: Number(customerObj.due_balance || 0) + dueAmount,
    });
  }

  const sale = await getSaleById(insertedId, tenantId);
  emitter.emit(EVENTS.SALE_COMPLETED, { ...sale, tenantId });
  return sale;
};

export const getAllSales = async (page = 1, limit = 20, filters = {}) => {
  const countQuery = db('transactions').where({ 'transactions.is_deleted': false, 'transactions.tx_type': 'SALE' });
  applyTenantScope(countQuery, filters.tenantId, 'transactions');
  if (filters.status) countQuery.where('transactions.status', filters.status);
  if (filters.branchId) countQuery.where('transactions.branch_id', filters.branchId);

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('transactions')
    .leftJoin('customers', 'transactions.customer_id', 'customers.id')
    .where({ 'transactions.is_deleted': false, 'transactions.tx_type': 'SALE' })
    .select(
      'transactions.*',
      'customers.id as c_id', 'customers.name as c_name', 'customers.phone as c_phone',
      'customers.email as c_email', 'customers.address as c_address'
    );
  applyTenantScope(dataQuery, filters.tenantId, 'transactions');
  if (filters.status) dataQuery.where('transactions.status', filters.status);
  if (filters.branchId) dataQuery.where('transactions.branch_id', filters.branchId);

  const rows = await dataQuery.orderBy('transactions.created_at', 'desc').limit(limit).offset(offset);

  const sales = rows.map((row) => {
    const cRow = row.c_id ? { id: row.c_id, name: row.c_name, phone: row.c_phone, email: row.c_email, address: row.c_address } : null;
    return formatTransaction(row, cRow);
  });

  return { sales, pagination: getPagination(total, page, limit) };
};

export const getSaleById = async (id, tenantId = null) => {
  const dataQuery = db('transactions')
    .leftJoin('customers', 'transactions.customer_id', 'customers.id')
    .where({ 'transactions.id': id, 'transactions.is_deleted': false })
    .select(
      'transactions.*',
      'customers.id as c_id', 'customers.name as c_name', 'customers.phone as c_phone',
      'customers.email as c_email', 'customers.address as c_address'
    );
  applyTenantScope(dataQuery, tenantId, 'transactions');

  const row = await dataQuery.first();
  if (!row) throw ApiError.notFound('Sale not found');

  const cRow = row.c_id ? { id: row.c_id, name: row.c_name, phone: row.c_phone, email: row.c_email, address: row.c_address } : null;
  return formatTransaction(row, cRow);
};

export const getSaleByInvoice = async (invoiceQuery, tenantId = null) => {
  const dataQuery = db('transactions')
    .leftJoin('customers', 'transactions.customer_id', 'customers.id')
    .where({ 'transactions.invoice_number': invoiceQuery, 'transactions.is_deleted': false })
    .select(
      'transactions.*',
      'customers.id as c_id', 'customers.name as c_name', 'customers.phone as c_phone'
    );
  applyTenantScope(dataQuery, tenantId, 'transactions');

  const row = await dataQuery.first();
  if (!row) throw ApiError.notFound(`No sale found matching "${invoiceQuery}"`);

  const cRow = row.c_id ? { id: row.c_id, name: row.c_name, phone: row.c_phone } : null;
  return formatTransaction(row, cRow);
};

export const getSaleByPublicToken = async (token) => {
  const row = await db('transactions').where({ public_token: token, is_deleted: false }).first();
  if (!row) throw ApiError.notFound('Invoice not found or link has expired');
  return formatTransaction(row);
};

export const updateSale = async (id, data, tenantId = null) => {
  const existing = await getSaleById(id, tenantId);
  if (!existing) throw ApiError.notFound('Sale not found');

  const updateFields = {};
  if (data.customerName !== undefined) updateFields.customer_name = data.customerName;
  if (data.customerPhone !== undefined) updateFields.customer_phone = data.customerPhone;
  if (data.customerEmail !== undefined) updateFields.customer_email = data.customerEmail;
  if (data.customerAddress !== undefined) updateFields.customer_address = data.customerAddress;
  if (data.saleType !== undefined) updateFields.sale_type = data.saleType;

  const newDiscount = data.discount !== undefined ? Number(data.discount) : existing.discount;
  const newTax = data.tax !== undefined ? Number(data.tax) : existing.tax;

  if (data.discount !== undefined) updateFields.discount = data.discount;
  if (data.tax !== undefined) updateFields.tax = data.tax;

  let lineItems = existing.lineItems;
  let subTotal = existing.subTotal;

  if (data.items !== undefined) {
    lineItems = data.items.map((item) => ({
      productId: item.productId,
      imeiOrSerial: item.imeiOrSerial || null,
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
      unitCost: item.unitCost || 0,
      totalPrice: item.unitPrice * item.qty,
    }));
    subTotal = lineItems.reduce((sum, li) => sum + li.totalPrice, 0);
    updateFields.line_items = JSON.stringify(lineItems);
  }

  const netTotal = subTotal - newDiscount + newTax;
  updateFields.sub_total = subTotal;
  updateFields.net_total = netTotal;

  if (data.paymentBreakdown !== undefined) {
    const paidAmount = (data.paymentBreakdown.cash || 0) +
      (data.paymentBreakdown.bkash || 0) +
      (data.paymentBreakdown.rocket || 0) +
      (data.paymentBreakdown.nagad || 0) +
      (data.paymentBreakdown.bank || 0);
    const dueAmount = Math.max(0, netTotal - paidAmount);

    updateFields.payment_breakdown = JSON.stringify({
      cash: data.paymentBreakdown.cash || 0,
      bkash: data.paymentBreakdown.bkash || 0,
      rocket: data.paymentBreakdown.rocket || 0,
      nagad: data.paymentBreakdown.nagad || 0,
      bank: data.paymentBreakdown.bank || 0,
      dueAmount,
    });

    if (existing.customerId) {
      const oldDue = existing.paymentBreakdown?.dueAmount || 0;
      const dueDiff = dueAmount - oldDue;
      if (dueDiff !== 0) {
        const custDueQuery = db('customers').where({ id: existing.customerId });
        if (tenantId) custDueQuery.andWhere('tenant_id', tenantId);
        await custDueQuery.increment('due_balance', dueDiff);
      }
    }
  }

  if (Object.keys(updateFields).length === 0) return existing;

  updateFields.updated_at = new Date();
  const txUpdate = db('transactions').where({ id });
  if (tenantId) txUpdate.andWhere('tenant_id', tenantId);
  await txUpdate.update(updateFields);

  return getSaleById(id, tenantId);
};

export const deleteSale = async (id, tenantId = null) => {
  const sale = await getSaleById(id, tenantId);
  if (!sale) throw ApiError.notFound('Sale not found');

  // 1. Restore product stock & inventory units (IMEIs)
  for (const item of sale.lineItems || []) {
    if (item.productId) {
      const prodQuery = db('products').where({ id: item.productId });
      if (tenantId) prodQuery.andWhere('tenant_id', tenantId);
      await prodQuery.increment('stock_quantity', Math.abs(item.qty || 1));
    }
    if (item.imeiOrSerial) {
      const unitQuery = db('inventory_units').where({ imei_or_serial: item.imeiOrSerial });
      if (tenantId) unitQuery.andWhere('tenant_id', tenantId);
      await unitQuery.update({ status: 'Available', sale_price: null, updated_at: new Date() });
    }
  }

  // 2. Restore customer due balance if any
  const dueAmount = sale.paymentBreakdown?.dueAmount || 0;
  if (sale.customerId && dueAmount > 0) {
    const custId = typeof sale.customerId === 'object' ? sale.customerId.id : sale.customerId;
    const custQuery = db('customers').where({ id: custId });
    if (tenantId) custQuery.andWhere('tenant_id', tenantId);
    await custQuery.decrement('due_balance', dueAmount);
  }

  // 3. Mark transaction as deleted & cancelled
  const txDel = db('transactions').where({ id });
  if (tenantId) txDel.andWhere('tenant_id', tenantId);
  await txDel.update({ is_deleted: true, status: 'CANCELLED', updated_at: new Date() });

  return { ...sale, isDeleted: true, status: 'CANCELLED' };
};
