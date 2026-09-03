import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';
import { createAutomatedReturnJournal } from '../accounting/accounting.service.js';
import emitter, { EVENTS } from '../../events/index.js';
import crypto from 'crypto';

const generateInvoiceNumber = async (tenantId = null) => {
  // Bug #2 fixed: Use timestamp + random suffix instead of COUNT(*)+1 to avoid race conditions
  // with concurrent sales producing duplicate invoice numbers.
  const year = new Date().getFullYear();
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `INV-${year}-${ts}-${rand}`;
};

function parseJSON(str) {
  if (typeof str === 'string') {
    try { return JSON.parse(str); } catch { return []; }
  }
  return str || [];
}

export function formatTransaction(row, customerRow = null) {
  if (!row) return null;
  // Bug #16 fixed: wrap JSON.parse in try/catch to prevent 500 on malformed payment_breakdown
  let breakdown = {};
  try {
    breakdown = typeof row.payment_breakdown === 'string' ? JSON.parse(row.payment_breakdown) : (row.payment_breakdown || {});
  } catch {
    breakdown = {};
  }

  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
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
    customerName: row.customer_name || customerRow?.name || 'Walk-in Customer',
    customerPhone: row.customer_phone || customerRow?.phone || 'N/A',
    customerEmail: row.customer_email || customerRow?.email || '',
    customerAddress: row.customer_address || customerRow?.address || '',
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
      changeAmount: Number(breakdown.changeAmount || 0),
      totalTendered: Number(
        breakdown.totalTendered ||
          (Number(breakdown.cash || 0) +
            Number(breakdown.bkash || 0) +
            Number(breakdown.rocket || 0) +
            Number(breakdown.nagad || 0) +
            Number(breakdown.bank || 0))
      ),
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

    const itemTotal = item.unitPrice * item.qty;
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

  const netTotal = Math.max(0, subTotal - (data.discount || 0) + (data.tax || 0));
  const rawCash = Number(data.paymentBreakdown?.cash || 0);
  const rawBkash = Number(data.paymentBreakdown?.bkash || 0);
  const rawRocket = Number(data.paymentBreakdown?.rocket || 0);
  const rawNagad = Number(data.paymentBreakdown?.nagad || 0);
  const rawBank = Number(data.paymentBreakdown?.bank || 0);
  const totalPaidRaw = rawCash + rawBkash + rawRocket + rawNagad + rawBank;

  const changeAmount = Math.max(0, totalPaidRaw - netTotal);
  const dueAmount = Math.max(0, netTotal - totalPaidRaw);

  let customerId = data.customerId || null;
  let customerObj = null;

  const invoiceNumber = await generateInvoiceNumber(tenantId);
  const soldDate = new Date();

  const paymentBreakdown = {
    cash: rawCash,
    bkash: rawBkash,
    rocket: rawRocket,
    nagad: rawNagad,
    bank: rawBank,
    totalTendered: totalPaidRaw,
    paidAmount: Math.min(totalPaidRaw, netTotal),
    dueAmount,
    changeAmount,
  };

  // Bug #1 fixed: Wrap all mutation steps in a DB transaction.
  // Previously: if the customer.update() at the end threw, the IMEI status was already
  // marked 'Sold' and stock_quantity was already decremented — leaving the DB corrupted.
  let insertedId;
  await db.transaction(async (trx) => {
    if (customerId) {
      const custQuery = trx('customers').where({ id: customerId, is_deleted: false });
      if (tenantId) custQuery.where('tenant_id', tenantId);
      customerObj = await custQuery.first();
    } else if (data.customerPhone && data.customerPhone.trim() && data.customerPhone !== 'N/A') {
      const { hashText } = await import('../../utils/crypto.utils.js');
      const phoneHash = hashText(data.customerPhone.trim());
      const existingCustQ = trx('customers').where({ phone_hash: phoneHash, is_deleted: false });
      if (tenantId) existingCustQ.where('tenant_id', tenantId);
      customerObj = await existingCustQ.first();

      if (customerObj) {
        customerId = customerObj.id;
      } else if (data.customerName && data.customerName.trim() && data.customerName !== 'Walk-in Customer') {
        const [newCustId] = await trx('customers').insert({
          tenant_id: tenantId,
          name: data.customerName.trim(),
          phone: data.customerPhone.trim(),
          phone_hash: phoneHash,
          email: data.customerEmail || null,
          address: data.customerAddress || null,
          customer_type: 'INDIVIDUAL',
          due_balance: 0,
          total_purchases: 0,
          is_deleted: false,
          created_at: new Date(),
          updated_at: new Date(),
        });
        customerId = newCustId;
        customerObj = {
          id: newCustId,
          name: data.customerName.trim(),
          phone: data.customerPhone.trim(),
          due_balance: 0,
          total_purchases: 0,
        };
      }
    }
    for (const item of data.items) {
      if (item.imeiOrSerial) {
        const unitQuery = trx('inventory_units').where({ imei_or_serial: item.imeiOrSerial, status: 'Available', is_deleted: false });
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

          const unitUpdate = trx('inventory_units').where({ id: unit.id });
          if (tenantId) unitUpdate.andWhere('tenant_id', tenantId);
          await unitUpdate.update({
            status: 'Sold',
            sold_invoice_number: invoiceNumber,
            sold_at: soldDate,
            sold_to_customer_id: customerId,
            passport_history: JSON.stringify(history),
          });

          const prodCountQuery = trx('inventory_units').where({ product_id: item.productId, status: 'Available', is_deleted: false });
          if (tenantId) prodCountQuery.andWhere('tenant_id', tenantId);
          const availCountRes = await prodCountQuery.count({ count: '*' }).first();
          const prodUpdate = trx('products').where({ id: item.productId });
          if (tenantId) prodUpdate.andWhere('tenant_id', tenantId);
          await prodUpdate.update({ stock_quantity: Number(availCountRes?.count || 0) });
        }
      } else {
        const requestedQty = Math.abs(item.qty || 1);
        const prodDecrQuery = trx('products').where({ id: item.productId });
        if (tenantId) prodDecrQuery.andWhere('tenant_id', tenantId);
        await prodDecrQuery.decrement('stock_quantity', requestedQty);
      }
    }

    [insertedId] = await trx('transactions').insert({
      tenant_id: tenantId,
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
      notes: data.notes || null,
      public_token: crypto.randomBytes(24).toString('hex'),
      token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      is_deleted: false,
    });

    if (customerObj) {
      const custUpdate = trx('customers').where({ id: customerObj.id });
      if (tenantId) custUpdate.andWhere('tenant_id', tenantId);
      await custUpdate.update({
        total_purchases: Number(customerObj.total_purchases || 0) + netTotal,
        due_balance: Number(customerObj.due_balance || 0) + dueAmount,
      });
    }
  });

  const sale = await getSaleById(insertedId, tenantId);
  emitter.emit(EVENTS.SALE_COMPLETED, { ...sale, tenantId });
  return sale;
};

export const getAllSales = async (page = 1, limit = 20, filters = {}) => {
  const buildQuery = (query) => {
    applyTenantScope(query, filters.tenantId, 'transactions');
    if (filters.status && filters.status !== 'ALL') query.where('transactions.status', filters.status);
    if (filters.saleType) query.where('transactions.sale_type', filters.saleType);
    if (filters.from) query.where('transactions.created_at', '>=', new Date(filters.from));
    if (filters.to) {
      const toDate = new Date(filters.to);
      toDate.setHours(23, 59, 59, 999);
      query.where('transactions.created_at', '<=', toDate);
    }
    if (filters.customer || filters.search) {
      const term = `%${filters.customer || filters.search}%`;
      query.andWhere((b) => {
        b.where('transactions.invoice_number', 'like', term)
          .orWhere('transactions.customer_name', 'like', term)
          .orWhere('transactions.customer_phone', 'like', term)
          .orWhere('customers.name', 'like', term)
          .orWhere('customers.phone', 'like', term);
      });
    }
    if (filters.returnable === 'true' || filters.returnable === true) {
      query.whereNot('transactions.status', 'RETURNED').whereNot('transactions.status', 'CANCELLED');
    }
    if (filters.paymentMethod) {
      const pMethod = filters.paymentMethod.toLowerCase();
      if (pMethod === 'due') {
        query.where('transactions.payment_breakdown', 'like', '%"dueAmount":%').andWhereNot('transactions.payment_breakdown', 'like', '%"dueAmount":0%');
      } else {
        query.where('transactions.payment_breakdown', 'like', `%"${pMethod}":%`).andWhereNot('transactions.payment_breakdown', 'like', `%"${pMethod}":0%`);
      }
    }
  };

  const countQuery = db('transactions')
    .leftJoin('customers', 'transactions.customer_id', 'customers.id')
    .where({ 'transactions.is_deleted': false, 'transactions.tx_type': 'SALE' });
  buildQuery(countQuery);

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
  buildQuery(dataQuery);

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
      'customers.id as c_id', 'customers.name as c_name', 'customers.phone as c_phone',
      'customers.email as c_email', 'customers.address as c_address'
    );
  applyTenantScope(dataQuery, tenantId, 'transactions');

  const row = await dataQuery.first();
  if (!row) throw ApiError.notFound(`No sale found matching "${invoiceQuery}"`);

  const cRow = row.c_id ? { id: row.c_id, name: row.c_name, phone: row.c_phone } : null;
  return formatTransaction(row, cRow);
};

export const getSaleByPublicToken = async (token) => {
  const query = db('transactions')
    .leftJoin('customers', 'transactions.customer_id', 'customers.id')
    .where({ 'transactions.public_token': token, 'transactions.is_deleted': false })
    .select(
      'transactions.*',
      'customers.id as c_id', 'customers.name as c_name', 'customers.phone as c_phone',
      'customers.email as c_email', 'customers.address as c_address'
    );

  // Optional expiry check if token_expires_at is populated
  query.andWhere((builder) => {
    builder.whereNull('transactions.token_expires_at').orWhere('transactions.token_expires_at', '>=', new Date());
  });

  const row = await query.first();
  if (!row) throw ApiError.notFound('Invoice not found or link has expired');
  const cRow = row.c_id ? { id: row.c_id, name: row.c_name, phone: row.c_phone } : null;
  return formatTransaction(row, cRow);
};

export const updateSale = async (id, data, tenantId = null, updatedBy = 'system') => {
  const cleanId = (id && typeof id === 'object') ? (id.id || id._id || null) : id;
  const cleanTenantId = (tenantId && typeof tenantId === 'object') ? (tenantId.id || tenantId._id || null) : tenantId;

  const existing = await getSaleById(cleanId, cleanTenantId);
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

  let netTotal = existing.netTotal;
  if (data.items !== undefined || data.discount !== undefined || data.tax !== undefined) {
    netTotal = Math.max(0, subTotal - newDiscount + newTax);
    updateFields.sub_total = subTotal;
    updateFields.net_total = netTotal;
  }

  if (data.paymentBreakdown !== undefined) {
    const paidAmount = (data.paymentBreakdown.cash || 0) +
      (data.paymentBreakdown.bkash || 0) +
      (data.paymentBreakdown.rocket || 0) +
      (data.paymentBreakdown.nagad || 0) +
      (data.paymentBreakdown.bank || 0);
    const effectiveNet = Math.max(0, netTotal - (existing.returnedAmount || 0));
    const dueAmount = Math.max(0, effectiveNet - paidAmount);

    updateFields.payment_breakdown = JSON.stringify({
      cash: data.paymentBreakdown.cash || 0,
      bkash: data.paymentBreakdown.bkash || 0,
      rocket: data.paymentBreakdown.rocket || 0,
      nagad: data.paymentBreakdown.nagad || 0,
      bank: data.paymentBreakdown.bank || 0,
      dueAmount,
    });

    const oldDue = existing.paymentBreakdown?.dueAmount || 0;
    const dueDiff = dueAmount - oldDue;
    if (dueDiff !== 0) {
      let custId = null;
      if (existing.customerId && typeof existing.customerId === 'object') {
        custId = existing.customerId.id || existing.customerId._id || null;
      } else if (existing.customerId) {
        custId = existing.customerId;
      }

      // If due amount has decreased (due collected), create an automated journal entry
      if (dueDiff < 0) {
        const cashDiff = (data.paymentBreakdown.cash || 0) - (existing.paymentBreakdown?.cash || 0);
        const bkashDiff = (data.paymentBreakdown.bkash || 0) - (existing.paymentBreakdown?.bkash || 0);
        const rocketDiff = (data.paymentBreakdown.rocket || 0) - (existing.paymentBreakdown?.rocket || 0);
        const nagadDiff = (data.paymentBreakdown.nagad || 0) - (existing.paymentBreakdown?.nagad || 0);
        const bankDiff = (data.paymentBreakdown.bank || 0) - (existing.paymentBreakdown?.bank || 0);

        let method = 'cash';
        let collectedAmount = Math.abs(dueDiff);
        if (bkashDiff > 0) { method = 'bkash'; collectedAmount = bkashDiff; }
        else if (rocketDiff > 0) { method = 'rocket'; collectedAmount = rocketDiff; }
        else if (nagadDiff > 0) { method = 'nagad'; collectedAmount = nagadDiff; }
        else if (bankDiff > 0) { method = 'bank'; collectedAmount = bankDiff; }
        else if (cashDiff > 0) { method = 'cash'; collectedAmount = cashDiff; }

        try {
          const { createAutomatedDueCollectionJournal } = await import('../accounting/accounting.service.js');
          await createAutomatedDueCollectionJournal(existing, collectedAmount, method, updatedBy);
        } catch (err) {
          console.error('[Accounting Auto-Journal Due Collection Error]:', err.message);
        }
      }

      // Bug #30 fixed: Recalculate customer due_balance from scratch instead of
      // incrementing/decrementing (stale-read lost-update pattern under concurrent updates).
      if (custId && !isNaN(Number(custId))) {
        const freshSalesQ = db('transactions').where({ customer_id: Number(custId), is_deleted: false, tx_type: 'SALE' });
        if (cleanTenantId) freshSalesQ.andWhere('tenant_id', cleanTenantId);
        const allSales = await freshSalesQ.select('payment_breakdown');
        const freshDue = allSales.reduce((sum, s) => {
          let pb = {};
          try { pb = typeof s.payment_breakdown === 'string' ? JSON.parse(s.payment_breakdown) : (s.payment_breakdown || {}); } catch { pb = {}; }
          return sum + Number(pb.dueAmount || 0);
        }, 0);
        // Adjust for the current sale's new due (not yet saved to DB)
        const adjustedDue = Math.max(0, freshDue - oldDue + dueAmount);
        const custUpdateQ = db('customers').where({ id: Number(custId) });
        if (cleanTenantId) custUpdateQ.andWhere('tenant_id', cleanTenantId);
        await custUpdateQ.update({ due_balance: adjustedDue });
      }
    }
  }

  if (Object.keys(updateFields).length === 0) return existing;

  updateFields.updated_at = new Date();
  const txUpdate = db('transactions').where({ id: cleanId });
  if (cleanTenantId) txUpdate.andWhere('tenant_id', cleanTenantId);
  await txUpdate.update(updateFields);

  return getSaleById(cleanId, cleanTenantId);
};

export const deleteSale = async (id, tenantId = null) => {
  const sale = await getSaleById(id, tenantId);
  if (!sale) throw ApiError.notFound('Sale not found');

  // 1. Restore product stock & inventory units (IMEIs)
  for (const item of sale.lineItems || []) {
    if (item.imeiOrSerial) {
      // IMEI items: restore inventory_unit status and recalculate stock from count
      const unitQuery = db('inventory_units').where({ imei_or_serial: item.imeiOrSerial });
      if (tenantId) unitQuery.andWhere('tenant_id', tenantId);
      await unitQuery.update({ status: 'Available', sold_invoice_number: null, sold_at: null, sold_to_customer_id: null, updated_at: new Date() });

      // Recalculate stock_quantity for this product from live Available count
      if (item.productId) {
        const availCountQ = db('inventory_units').where({ product_id: item.productId, status: 'Available', is_deleted: false });
        if (tenantId) availCountQ.andWhere('tenant_id', tenantId);
        const availRes = await availCountQ.count({ count: '*' }).first();
        const prodUpdQ = db('products').where({ id: item.productId });
        if (tenantId) prodUpdQ.andWhere('tenant_id', tenantId);
        await prodUpdQ.update({ stock_quantity: Number(availRes?.count || 0) });
      }
    } else if (item.productId) {
      // Non-IMEI items: simple increment with tenant scope
      const prodQuery = db('products').where({ id: item.productId });
      if (tenantId) prodQuery.andWhere('tenant_id', tenantId);
      await prodQuery.increment('stock_quantity', Math.abs(item.qty || 1));
    }
  }

  // 2. Restore customer due balance and total_purchases
  const custId = typeof sale.customerId === 'object' ? (sale.customerId?.id || sale.customerId?._id) : sale.customerId;
  if (custId) {
    const custQuery = db('customers').where({ id: custId });
    if (tenantId) custQuery.andWhere('tenant_id', tenantId);
    const dueAmount = sale.paymentBreakdown?.dueAmount || 0;
    if (dueAmount > 0) {
      await custQuery.clone().decrement('due_balance', dueAmount);
    }
    // Bug #15 fixed: also decrement total_purchases by the sale net total
    await custQuery.clone().decrement('total_purchases', Math.max(0, sale.netTotal || 0));
  }

  // Bug #26 fixed: soft-delete related RETURN transactions for this sale invoice
  try {
    const retDelQ = db('transactions').where({ tx_type: 'RETURN', is_deleted: false });
    if (tenantId) retDelQ.andWhere('tenant_id', tenantId);
    retDelQ.where('invoice_number', 'like', `RET-${sale.invoiceNumber}%`);
    await retDelQ.update({ is_deleted: true, status: 'CANCELLED', updated_at: new Date() });
  } catch (err) {
    console.error('[deleteSale] Failed to soft-delete RETURN transactions:', err.message);
  }

  const txDel = db('transactions').where({ id });
  if (tenantId) txDel.andWhere('tenant_id', tenantId);
  await txDel.update({ is_deleted: true, status: 'CANCELLED', updated_at: new Date() });

  return { ...sale, isDeleted: true, status: 'CANCELLED' };
};

export const processReturn = async (id, data, tenantId = null) => {
  const sale = await getSaleById(id, tenantId);

  const returnItems = data.items || [];
  let refundAmount = 0;
  const returnInvoiceNumber = `RET-${sale.invoiceNumber || sale.invoice_number || id}-${Date.now().toString(36).toUpperCase().slice(-4)}`;

  for (const ri of returnItems) {
    let pId = ri.productId?._id || ri.productId?.id || ri.productId;
    let lineItem;
    if (pId) {
      lineItem = (sale.lineItems || []).find(li => String(li.productId?._id || li.productId?.id || li.productId) === String(pId));
    }
    if (!lineItem && ri.imeiOrSerial) {
      lineItem = (sale.lineItems || []).find(li => String(li.imeiOrSerial) === String(ri.imeiOrSerial));
      if (lineItem) {
        pId = lineItem.productId?._id || lineItem.productId?.id || lineItem.productId;
      }
    }
    if (!lineItem) throw ApiError.badRequest(`Line item not found for product ${pId || ri.imeiOrSerial}`);
    const qty = Math.abs(ri.quantity || ri.qty || 1);
    refundAmount += (lineItem.unitPrice * qty);

    // 1. Restock Product in inventory (Catalog)
    if (pId) {
      const stockIncrQ = db('products').where({ id: pId });
      if (tenantId) stockIncrQ.andWhere('tenant_id', tenantId);
      await stockIncrQ.increment('stock_quantity', qty);

      emitter.emit(EVENTS.STOCK_UPDATED, { id: pId, name: lineItem.description || lineItem.name, tenantId });
      emitter.emit(EVENTS.PRODUCT_MUTATED, { id: pId, tenantId });
    }

    // 2. If IMEI item, mark IMEI back to Available in inventory_units
    const imeiVal = ri.imeiOrSerial || lineItem.imeiOrSerial;
    if (imeiVal) {
      const imeiRetQ = db('inventory_units').where({ imei_or_serial: imeiVal });
      if (tenantId) imeiRetQ.andWhere('tenant_id', tenantId);
      await imeiRetQ.update({
        status: 'Available',
        sold_invoice_number: null,
        sold_at: null,
        sold_to_customer_id: null,
        updated_at: new Date(),
      });
    }
  }

  refundAmount = Number(refundAmount.toFixed(2));

  // Handle optional Product Replacement / Exchange
  const returnAction = data.returnAction || 'REFUND'; // 'REFUND' or 'REPLACEMENT'
  let replacementItem = data.replacementItem || null;
  let replacementCost = 0;
  let priceDifference = 0; // Positive = Customer pays extra, Negative = Shop refunds extra

  if (returnAction === 'REPLACEMENT' && replacementItem && replacementItem.productId) {
    const replPId = replacementItem.productId;
    const replQty = Number(replacementItem.quantity || 1);
    const replPrice = Number(replacementItem.unitPrice || 0);
    replacementCost = replPrice * replQty;
    priceDifference = Number((replacementCost - refundAmount).toFixed(2));

    // Deduct stock for replacement product
    const replStockQ = db('products').where({ id: replPId });
    if (tenantId) replStockQ.andWhere('tenant_id', tenantId);
    await replStockQ.decrement('stock_quantity', replQty);

    if (replacementItem.imeiOrSerial) {
      const replImeiQ = db('inventory_units').where({ imei_or_serial: replacementItem.imeiOrSerial });
      if (tenantId) replImeiQ.andWhere('tenant_id', tenantId);
      await replImeiQ.update({
        status: 'Sold',
        sold_invoice_number: returnInvoiceNumber,
        sold_at: new Date(),
        sold_to_customer_id: typeof sale.customerId === 'object' ? (sale.customerId?.id || sale.customerId?._id) : sale.customerId,
        updated_at: new Date(),
      });
    }

    emitter.emit(EVENTS.STOCK_UPDATED, { id: replPId, tenantId });
    emitter.emit(EVENTS.PRODUCT_MUTATED, { id: replPId, tenantId });
  }

  const newReturnedAmount = (sale.returnedAmount || 0) + refundAmount;

  const returnLog = {
    date: new Date().toISOString(),
    returnInvoiceNumber,
    items: returnItems,
    refundAmount,
    returnAction,
    replacementItem,
    priceDifference,
    reason: data.reason || 'Customer / Wholesale Return',
  };

  const existingLogs = sale.returnLogs || [];
  const txUpdate = db('transactions').where({ id });
  if (tenantId) txUpdate.andWhere('tenant_id', tenantId);

  // Update payment_breakdown.dueAmount to reflect the return / replacement
  let pb = {};
  try { pb = typeof sale.payment_breakdown === 'string' ? JSON.parse(sale.payment_breakdown) : (sale.paymentBreakdown || sale.payment_breakdown || {}); } catch { pb = {}; }
  const oldDue = Number(pb.dueAmount || 0);

  if (returnAction === 'REPLACEMENT') {
    if (priceDifference > 0) {
      // Customer has additional due or pays difference
      pb.dueAmount = oldDue + (data.paymentMethod === 'due' ? priceDifference : 0);
    } else {
      pb.dueAmount = Math.max(0, oldDue - Math.abs(priceDifference));
    }
  } else {
    pb.dueAmount = Math.max(0, oldDue - refundAmount);
    if (refundAmount > 0 && pb.cash !== undefined) {
      pb.changeAmount = 0;
    }
  }

  await txUpdate.update({
    returned_amount: newReturnedAmount,
    return_logs: JSON.stringify([...existingLogs, returnLog]),
    payment_breakdown: JSON.stringify(pb),
    status: newReturnedAmount >= sale.netTotal ? 'RETURNED' : 'PARTIAL_RETURN',
    updated_at: new Date(),
  });

  // Insert a RETURN / EXCHANGE transaction row for Customer Ledger & Reports
  try {
    const netTxTotal = returnAction === 'REPLACEMENT' ? priceDifference : -refundAmount;
    await db('transactions').insert({
      tenant_id: tenantId || sale.tenantId || null,
      invoice_number: returnInvoiceNumber,
      tx_type: returnAction === 'REPLACEMENT' ? 'EXCHANGE' : 'RETURN',
      sale_type: sale.saleType || 'RETAIL',
      status: 'COMPLETED',
      customer_id: typeof sale.customerId === 'object' ? (sale.customerId?.id || sale.customerId?._id) : sale.customerId,
      customer_name: sale.customerName || sale.customer?.name || null,
      customer_phone: sale.customerPhone || sale.customer?.phone || null,
      customer_email: sale.customerEmail || sale.customer?.email || null,
      customer_address: sale.customerAddress || sale.customer?.address || null,
      line_items: JSON.stringify(returnItems),
      sub_total: netTxTotal,
      discount: 0,
      tax: 0,
      net_total: netTxTotal,
      returned_amount: refundAmount,
      payment_breakdown: JSON.stringify({
        refundAmount,
        returnAction,
        replacementItem,
        priceDifference,
        originalInvoice: sale.invoiceNumber,
      }),
      cashier_username: sale.cashierUsername || 'system',
      created_at: new Date(),
      updated_at: new Date(),
    });
  } catch (err) {
    console.error('[Sale Return Tx Insert Error]:', err.message);
  }

  // Recalculate customer due_balance & total_purchases from ALL their transactions
  if (sale.customerId) {
    const custId = typeof sale.customerId === 'object' ? (sale.customerId?.id || sale.customerId?._id) : sale.customerId;
    if (custId) {
      const allSalesQuery = db('transactions').where({ customer_id: custId, is_deleted: false, tx_type: 'SALE' });
      if (tenantId) allSalesQuery.andWhere('tenant_id', tenantId);
      const allSales = await allSalesQuery.select('payment_breakdown', 'net_total', 'returned_amount');
      
      const freshDueBalance = allSales.reduce((sum, s) => {
        const spb = typeof s.payment_breakdown === 'string' ? (() => { try { return JSON.parse(s.payment_breakdown); } catch { return {}; } })() : (s.payment_breakdown || {});
        return sum + Number(spb.dueAmount || 0);
      }, 0);

      const freshPurchases = allSales.reduce((sum, s) => {
        return sum + Math.max(0, Number(s.net_total || 0) - Number(s.returned_amount || 0));
      }, 0);

      const custUpdate = db('customers').where({ id: custId });
      if (tenantId) custUpdate.andWhere('tenant_id', tenantId);
      await custUpdate.update({
        due_balance: Math.max(0, freshDueBalance),
        total_purchases: Math.max(0, freshPurchases),
      });

      emitter.emit(EVENTS.CUSTOMER_MUTATED, { id: custId, tenantId });
    }
  }

  // Create Double-Entry Accounting Journal for Return
  createAutomatedReturnJournal(sale, refundAmount, returnInvoiceNumber).catch((err) =>
    console.error('[Sale Return Accounting Error]:', err.message)
  );

  return { ...sale, returnedAmount: newReturnedAmount, refundAmount, returnInvoiceNumber, paymentBreakdown: pb };
};
