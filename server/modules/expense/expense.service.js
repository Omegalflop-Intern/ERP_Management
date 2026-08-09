import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';

export function formatExpense(row) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
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
  const { category, search } = params;
  const query = db('expenses').where({ is_deleted: false });
  applyTenantScope(query, tenantId);

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

export const createExpense = async (data, recordedBy = 'system', tenantId = null) => {
  if (!data.amount || Number(data.amount) <= 0) throw ApiError.badRequest('Expense amount must be greater than 0');

  const [insertedId] = await db('expenses').insert({
    tenant_id: tenantId || data.tenantId || null,
    title: data.title,
    category: data.category || 'Miscellaneous',
    amount: Number(data.amount),
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

export const updateExpense = async (id, data, tenantId = null) => {
  const query = db('expenses').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
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

export const deleteExpense = async (id, tenantId = null) => {
  const query = db('expenses').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
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
