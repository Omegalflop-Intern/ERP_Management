import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';
import { hashText } from '../../utils/crypto.utils.js';
import { formatTransaction } from '../sale/sale.service.js';

export function formatCustomer(row) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    branchId: row.branch_id ? String(row.branch_id) : null,
    name: row.name,
    phone: row.phone,
    phoneHash: row.phone_hash || null,
    email: row.email || '',
    address: row.address || '',
    customerType: row.customer_type || 'INDIVIDUAL',
    companyName: row.company_name || '',
    binOrTaxId: row.bin_or_tax_id || '',
    dueBalance: Number(row.due_balance || 0),
    totalPurchases: Number(row.total_purchases || 0),
    notes: row.notes || '',
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where('tenant_id', tenantId);
  }
}

export const getAllCustomers = async (page = 1, limit = 20, search = '', tenantId = null, branchId = null) => {
  const countQuery = db('customers').where('is_deleted', false);
  applyTenantScope(countQuery, tenantId);
  if (branchId && branchId !== 'all') {
    countQuery.where('branch_id', branchId);
  }

  if (search) {
    const term = `%${search}%`;
    const pHash = hashText(search);
    countQuery.where((b) => {
      b.where('name', 'like', term)
        .orWhere('email', 'like', term)
        .orWhere('phone', 'like', term)
        .orWhere('phone_hash', pHash);
    });
  }

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('customers').where('is_deleted', false);
  applyTenantScope(dataQuery, tenantId);
  if (branchId && branchId !== 'all') {
    dataQuery.where('branch_id', branchId);
  }

  if (search) {
    const term = `%${search}%`;
    const pHash = hashText(search);
    dataQuery.where((b) => {
      b.where('name', 'like', term)
        .orWhere('email', 'like', term)
        .orWhere('phone', 'like', term)
        .orWhere('phone_hash', pHash);
    });
  }

  const rows = await dataQuery.orderBy('created_at', 'desc').limit(limit).offset(offset);
  const customers = rows.map(formatCustomer);

  return { customers, pagination: getPagination(total, page, limit) };
};

export const getCustomerById = async (id, tenantId = null, branchId = null) => {
  const query = db('customers').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
  if (branchId && branchId !== 'all') {
    query.where((b) => b.where('branch_id', branchId).orWhereNull('branch_id'));
  }
  const row = await query.first();
  if (!row) throw ApiError.notFound('Customer not found');
  return formatCustomer(row);
};

export const createCustomer = async (data, tenantId = null) => {
  const pHash = hashText(data.phone);
  const existingQuery = db('customers').where({ phone_hash: pHash, is_deleted: false });
  applyTenantScope(existingQuery, tenantId);
  const existing = await existingQuery.first();
  if (existing) throw ApiError.conflict('Customer with this phone already exists');

  const [insertedId] = await db('customers').insert({
    tenant_id: tenantId || data.tenantId || null,
    branch_id: data.branchId || null,
    name: data.name,
    phone: data.phone,
    phone_hash: pHash,
    email: data.email || null,
    address: data.address || null,
    customer_type: data.customerType || 'INDIVIDUAL',
    company_name: data.companyName || null,
    bin_or_tax_id: data.binOrTaxId || null,
    due_balance: data.dueBalance || 0,
    total_purchases: data.totalPurchases || 0,
    notes: data.notes || null,
    is_deleted: false,
  });

  return getCustomerById(insertedId, tenantId || data.tenantId || null);
};

export const updateCustomer = async (id, data, tenantId = null) => {
  const customer = await getCustomerById(id, tenantId);
  if (!customer) throw ApiError.notFound('Customer not found');

  const updateFields = {};

  if (data.phone && data.phone !== customer.phone) {
    const pHash = hashText(data.phone);
    const existingQuery = db('customers').where({ phone_hash: pHash, is_deleted: false }).whereNot({ id });
    applyTenantScope(existingQuery, tenantId);
    const existing = await existingQuery.first();
    if (existing) throw ApiError.conflict('Customer with this phone already exists');
    updateFields.phone = data.phone;
    updateFields.phone_hash = pHash;
  }

  if (data.name !== undefined) updateFields.name = data.name;
  if (data.email !== undefined) updateFields.email = data.email;
  if (data.address !== undefined) updateFields.address = data.address;
  if (data.customerType !== undefined) updateFields.customer_type = data.customerType;
  if (data.companyName !== undefined) updateFields.company_name = data.companyName;
  if (data.binOrTaxId !== undefined) updateFields.bin_or_tax_id = data.binOrTaxId;
  if (data.dueBalance !== undefined) updateFields.due_balance = data.dueBalance;
  if (data.totalPurchases !== undefined) updateFields.total_purchases = data.totalPurchases;
  if (data.notes !== undefined) updateFields.notes = data.notes;

  if (Object.keys(updateFields).length > 0) {
    const q = db('customers').where({ id });
    if (tenantId) q.andWhere('tenant_id', tenantId);
    await q.update(updateFields);
  }

  return getCustomerById(id, tenantId);
};

export const deleteCustomer = async (id, tenantId = null) => {
  const customer = await getCustomerById(id, tenantId);
  if (!customer) throw ApiError.notFound('Customer not found');

  const q1 = db('customers').where({ id });
  if (tenantId) q1.andWhere('tenant_id', tenantId);
  await q1.update({ is_deleted: true });
  return { ...customer, isDeleted: true };
};

export const getCustomerHistory = async (id, tenantId = null, branchId = null) => {
  const customer = await getCustomerById(id, tenantId, branchId);
  if (!customer) throw ApiError.notFound('Customer not found');

  const salesQuery = db('transactions').where({ is_deleted: false, tx_type: 'SALE' });
  applyTenantScope(salesQuery, tenantId);
  if (branchId) salesQuery.where({ branch_id: branchId });
  salesQuery.andWhere((b) => {
    b.where('customer_id', id);
    if (customer.phone) b.orWhere('customer_phone', customer.phone);
  });
  const salesRows = await salesQuery.orderBy('created_at', 'desc');

  const returnsQuery = db('transactions').where({ is_deleted: false, tx_type: 'RETURN' });
  applyTenantScope(returnsQuery, tenantId);
  if (branchId) returnsQuery.where({ branch_id: branchId });
  returnsQuery.andWhere((b) => {
    b.where('customer_id', id);
    if (customer.phone) b.orWhere('customer_phone', customer.phone);
  });
  const returnRows = await returnsQuery.orderBy('created_at', 'desc');

  const formattedSales = salesRows.map((r) => formatTransaction(r, customer));
  const formattedReturns = returnRows.map((r) => formatTransaction(r, customer));

  const totalPurchased = formattedSales.reduce((sum, s) => sum + (s.netTotal || 0), 0);
  const totalReturns = formattedReturns.reduce((sum, r) => sum + Math.abs(r.netTotal || 0), 0);
  const calculatedDue = formattedSales.reduce((sum, s) => sum + (s.paymentBreakdown?.dueAmount || 0), 0);

  return {
    customer: {
      ...customer,
      dueBalance: calculatedDue,
      totalPurchases: totalPurchased,
    },
    sales: formattedSales,
    returns: formattedReturns,
    summary: {
      totalPurchased,
      totalReturns,
      totalDue: calculatedDue,
      totalTransactions: formattedSales.length + formattedReturns.length,
    },
  };
};

export const collectDue = async (id, amount, paymentMethod, userId, tenantId = null, branchId = null) => {
  const customer = await getCustomerById(id, tenantId, branchId);
  if (!customer) throw ApiError.notFound('Customer not found');

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) throw ApiError.badRequest('Please enter a valid collection amount');

  const resolvedTenant = tenantId || customer.tenantId || null;
  const { validatePaymentMethodActive } = await import('../accounting/accounting.service.js');
  await validatePaymentMethodActive(paymentMethod, resolvedTenant);

  // 1. Fetch all unpaid sales transactions for this customer
  const salesQuery = db('transactions').where({ is_deleted: false, tx_type: 'SALE' });
  applyTenantScope(salesQuery, tenantId);
  if (branchId) salesQuery.where({ branch_id: branchId });
  salesQuery.andWhere((b) => {
    b.where('customer_id', id);
    if (customer.phone) b.orWhere('customer_phone', customer.phone);
  });
  const salesRows = await salesQuery.orderBy('created_at', 'asc');

  let remainingToApply = numAmount;

  for (const row of salesRows) {
    if (remainingToApply <= 0) break;
    let pb = {};
    try {
      pb = typeof row.payment_breakdown === 'string' ? JSON.parse(row.payment_breakdown) : (row.payment_breakdown || {});
    } catch { pb = {}; }

    const invoiceDue = Number(pb.dueAmount || 0);

    if (invoiceDue > 0) {
      const payThis = Math.min(remainingToApply, invoiceDue);
      pb.dueAmount = Math.max(0, invoiceDue - payThis);

      const pMethod = (paymentMethod || 'cash').toLowerCase();
      pb[pMethod] = (Number(pb[pMethod]) || 0) + payThis;
      remainingToApply -= payThis;

      const qTx = db('transactions').where({ id: row.id });
      if (tenantId) qTx.andWhere('tenant_id', tenantId);
      await qTx.update({
        payment_breakdown: JSON.stringify(pb),
        updated_at: new Date(),
      });
    }
  }

  // 2. Recalculate remaining due balance from transactions
  const remainingDueQuery = db('transactions').where({ is_deleted: false, tx_type: 'SALE' });
  applyTenantScope(remainingDueQuery, tenantId);
  remainingDueQuery.andWhere((b) => {
    b.where('customer_id', id);
    if (customer.phone) b.orWhere('customer_phone', customer.phone);
  });
  const allSales = await remainingDueQuery.select('payment_breakdown');
  const freshDueBalance = allSales.reduce((sum, s) => {
    try {
      const pb = typeof s.payment_breakdown === 'string' ? JSON.parse(s.payment_breakdown) : (s.payment_breakdown || {});
      return sum + Number(pb.dueAmount || 0);
    } catch { return sum; }
  }, 0);

  // 3. Update customer's due_balance in customers table
  const qCust = db('customers').where({ id });
  if (tenantId) qCust.andWhere('tenant_id', tenantId);
  await qCust.update({ due_balance: freshDueBalance });

  const updated = await getCustomerById(id, tenantId, branchId);
  return { customer: updated, collected: numAmount, remainingDue: freshDueBalance };
};

export const getCustomerStats = async (tenantId = null, branchId = null) => {
  const query = db('customers').where({ is_deleted: false });
  applyTenantScope(query, tenantId);
  if (branchId) query.where('branch_id', branchId);
  const countRes = await query.count({ count: '*' }).first();
  const total = Number(countRes?.count || 0);

  const dueQuery = db('customers').where({ is_deleted: false }).where('due_balance', '>', 0);
  applyTenantScope(dueQuery, tenantId);
  if (branchId) dueQuery.where('branch_id', branchId);
  const dueRes = await dueQuery.count({ count: '*' }).sum({ totalDue: 'due_balance' }).first();

  const purchaseQuery = db('customers').where({ is_deleted: false });
  applyTenantScope(purchaseQuery, tenantId);
  if (branchId) purchaseQuery.where('branch_id', branchId);
  const purchaseRes = await purchaseQuery.sum({ totalPurchases: 'total_purchases' }).first();

  return {
    total,
    withDue: Number(dueRes?.count || 0),
    totalDue: Number(dueRes?.totalDue || 0),
    totalPurchases: Number(purchaseRes?.totalPurchases || 0),
  };
};
