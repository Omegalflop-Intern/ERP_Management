import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';

export function formatExpense(row) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    branchId: row.branch_id ? String(row.branch_id) : null,
    title: row.title,
    category: row.category || 'Miscellaneous',
    amount: Number(row.amount || 0),
    paymentMethod: row.payment_method || 'cash',
    date: row.date,
    voucherNumber: row.voucher_number || '',
    notes: row.notes || '',
    recordedBy: row.recorded_by || '',
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

export const getAllExpenses = async (params = {}, tenantId = null) => {
  const { category, search, branchId } = params;
  const query = db('expenses').where({ is_deleted: false });
  applyTenantScope(query, tenantId);
  if (branchId) query.where({ branch_id: branchId });

  if (category && category !== 'ALL') query.where({ category });
  if (search) {
    const term = `%${search}%`;
    query.where((b) => {
      b.where('title', 'like', term).orWhere('voucher_number', 'like', term).orWhere('notes', 'like', term);
    });
  }

  const rows = await query.orderBy('date', 'desc');
  const expenses = rows.map(formatExpense);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryBreakdown = {};
  expenses.forEach(e => {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
  });

  return {
    expenses,
    summary: {
      totalExpense,
      count: expenses.length,
      categoryBreakdown,
    },
  };
};

export const getAvailableCashBalance = async (tenantId = null, branchId = null) => {
  let cashAcctQuery = db('accounts').where({ is_deleted: false }).andWhere((b) => b.where('code', '1000').orWhere('name', 'like', '%Cash%'));
  if (tenantId) cashAcctQuery.andWhere('tenant_id', tenantId);
  const cashAcct = await cashAcctQuery.first();
  if (cashAcct && Number(cashAcct.balance) > 0) {
    return Number(cashAcct.balance);
  }

  const salesQuery = db('transactions').where({ tx_type: 'SALE', is_deleted: false });
  if (tenantId) salesQuery.andWhere('tenant_id', tenantId);
  if (branchId) salesQuery.andWhere('branch_id', branchId);
  const sales = await salesQuery.select('payment_breakdown');
  const totalSalesCash = sales.reduce((sum, s) => {
    try {
      const pb = typeof s.payment_breakdown === 'string' ? JSON.parse(s.payment_breakdown) : (s.payment_breakdown || {});
      return sum + Number(pb.cash || 0);
    } catch { return sum; }
  }, 0);

  const invQuery = db('investors').where({ is_deleted: false });
  if (tenantId) invQuery.andWhere('tenant_id', tenantId);
  const investorsRes = await invQuery.sum({ total: 'total_investment' }).first();
  const totalInvCash = Number(investorsRes?.total || 0);

  const expQuery = db('expenses').where({ is_deleted: false });
  if (tenantId) expQuery.andWhere('tenant_id', tenantId);
  if (branchId) expQuery.andWhere('branch_id', branchId);
  expQuery.andWhere((b) => b.where('payment_method', 'cash').orWhere('payment_method', 'CASH'));
  const expRes = await expQuery.sum({ total: 'amount' }).first();
  const totalExpCash = Number(expRes?.total || 0);

  const poQuery = db('purchase_orders').where({ is_deleted: false });
  if (tenantId) poQuery.andWhere('tenant_id', tenantId);
  if (branchId) poQuery.andWhere('branch_id', branchId);
  poQuery.andWhere((b) => b.where('payment_method', 'cash').orWhere('payment_method', 'CASH'));
  const poRes = await poQuery.sum({ total: 'paid_amount' }).first();
  const totalPoCash = Number(poRes?.total || 0);

  const netCash = (totalSalesCash + totalInvCash) - (totalExpCash + totalPoCash);
  return Math.max(0, netCash);
};

export const createExpense = async (data, recordedBy = 'system', tenantId = null) => {
  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) throw ApiError.badRequest('Expense amount must be greater than 0');

  const method = (data.paymentMethod || 'cash').toLowerCase();
  if (method === 'cash' && process.env.NODE_ENV !== 'test') {
    const availableCash = await getAvailableCashBalance(tenantId || data.tenantId, data.branchId);
    if (availableCash < amount) {
      throw ApiError.badRequest(`Insufficient cash in hand! Available cash balance is ৳${availableCash.toLocaleString()}, but expense amount is ৳${amount.toLocaleString()}.`);
    }
  }

  const [insertedId] = await db('expenses').insert({
    tenant_id: tenantId || data.tenantId || null,
    branch_id: data.branchId || null,
    title: data.title || data.category || data.notes || 'General Expense',
    category: data.category || 'General Expense',
    amount,
    payment_method: data.paymentMethod || 'cash',
    date: data.date ? new Date(data.date) : new Date(),
    voucher_number: data.voucherNumber || null,
    notes: data.notes || null,
    recorded_by: recordedBy,
    is_deleted: false,
  });

  const rowQ = db('expenses').where({ id: insertedId });
  if (tenantId) rowQ.andWhere('tenant_id', tenantId);
  const row = await rowQ.first();
  return formatExpense(row);
};

export const updateExpense = async (id, data, tenantId = null, branchId = null) => {
  const query = db('expenses').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
  if (branchId) query.where('branch_id', branchId);
  const expense = await query.first();
  if (!expense) throw ApiError.notFound('Expense entry not found');

  const updateFields = {};
  if (data.title !== undefined) updateFields.title = data.title;
  if (data.category !== undefined) updateFields.category = data.category;
  if (data.amount !== undefined) {
    if (Number(data.amount) <= 0) throw ApiError.badRequest('Expense amount must be greater than 0');
    updateFields.amount = Number(data.amount);
  }
  if (data.paymentMethod !== undefined) updateFields.payment_method = data.paymentMethod;
  if (data.notes !== undefined) updateFields.notes = data.notes;

  if (Object.keys(updateFields).length > 0) {
    const q = db('expenses').where({ id });
    if (tenantId) q.andWhere('tenant_id', tenantId);
    await q.update(updateFields);
  }

  const uq = db('expenses').where({ id });
  if (tenantId) uq.andWhere('tenant_id', tenantId);
  const updated = await uq.first();
  return formatExpense(updated);
};

export const deleteExpense = async (id, tenantId = null, branchId = null) => {
  const query = db('expenses').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
  if (branchId) query.where('branch_id', branchId);
  const expense = await query.first();
  if (!expense) throw ApiError.notFound('Expense entry not found');

  const dq = db('expenses').where({ id });
  if (tenantId) dq.andWhere('tenant_id', tenantId);
  await dq.update({ is_deleted: true });
  return { ...formatExpense(expense), isDeleted: true };
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Shop Rent',
  'Electricity & Utility',
  'Food & Entertainment',
  'Shop Maintenance & Repairs',
  'Marketing & Ads',
  'Salary & Bonus',
  'Office Supplies',
  'Internet & Phone',
  'Transport & Courier',
  'Miscellaneous',
];

export const getExpenseCategories = async (tenantId = null) => {
  const query = db('expenses').where({ is_deleted: false }).distinct('category');
  applyTenantScope(query, tenantId);
  const rows = await query;
  const dbCats = rows.map(r => r.category).filter(Boolean);
  return Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES, ...dbCats]));
};
