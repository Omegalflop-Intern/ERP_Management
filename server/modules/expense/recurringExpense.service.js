import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';

export function formatRecurringExpense(row) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    branchId: row.branch_id ? String(row.branch_id) : null,
    title: row.title,
    category: row.category || 'Miscellaneous',
    amount: Number(row.amount || 0),
    paymentMethod: row.payment_method || 'Cash',
    frequency: row.frequency,
    startDate: row.start_date,
    endDate: row.end_date,
    nextDueDate: row.next_due_date,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) query.where('tenant_id', tenantId);
}

export const getAllRecurringExpenses = async (tenantId = null, branchId = null) => {
  const query = db('recurring_expenses').where({ is_deleted: false });
  applyTenantScope(query, tenantId);
  if (branchId && branchId !== 'all') {
    query.where((b) => b.where('branch_id', branchId).orWhereNull('branch_id'));
  }
  const rows = await query.orderBy('next_due_date', 'asc');
  return rows.map(formatRecurringExpense);
};

export const createRecurringExpense = async (data, tenantId = null) => {
  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) throw ApiError.badRequest('Amount must be greater than 0');

  const validFrequencies = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
  const frequency = (data.frequency || 'MONTHLY').toUpperCase();
  if (!validFrequencies.includes(frequency)) {
    throw ApiError.badRequest(`Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`);
  }

  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  const nextDueDate = data.nextDueDate ? new Date(data.nextDueDate) : startDate;

  const [insertedId] = await db('recurring_expenses').insert({
    tenant_id: tenantId || null,
    branch_id: data.branchId || null,
    title: data.title,
    category: data.category || 'Miscellaneous',
    amount,
    payment_method: data.paymentMethod || 'Cash',
    frequency,
    start_date: startDate,
    end_date: data.endDate ? new Date(data.endDate) : null,
    next_due_date: nextDueDate,
    is_active: true,
    is_deleted: false,
  });

  const row = await db('recurring_expenses').where({ id: insertedId }).first();
  return formatRecurringExpense(row);
};

export const updateRecurringExpense = async (id, data, tenantId = null) => {
  const query = db('recurring_expenses').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
  const existing = await query.first();
  if (!existing) throw ApiError.notFound('Recurring expense not found');

  const updateFields = {};
  if (data.title !== undefined) updateFields.title = data.title;
  if (data.category !== undefined) updateFields.category = data.category;
  if (data.amount !== undefined) {
    if (Number(data.amount) <= 0) throw ApiError.badRequest('Amount must be greater than 0');
    updateFields.amount = Number(data.amount);
  }
  if (data.paymentMethod !== undefined) updateFields.payment_method = data.paymentMethod;
  if (data.frequency !== undefined) updateFields.frequency = data.frequency.toUpperCase();
  if (data.startDate !== undefined) updateFields.start_date = new Date(data.startDate);
  if (data.endDate !== undefined) updateFields.end_date = data.endDate ? new Date(data.endDate) : null;
  if (data.nextDueDate !== undefined) updateFields.next_due_date = new Date(data.nextDueDate);
  if (data.isActive !== undefined) updateFields.is_active = data.isActive;

  if (Object.keys(updateFields).length > 0) {
    const q = db('recurring_expenses').where({ id });
    if (tenantId) q.andWhere('tenant_id', tenantId);
    await q.update(updateFields);
  }

  const row = await db('recurring_expenses').where({ id }).first();
  return formatRecurringExpense(row);
};

export const deleteRecurringExpense = async (id, tenantId = null) => {
  const query = db('recurring_expenses').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
  const existing = await query.first();
  if (!existing) throw ApiError.notFound('Recurring expense not found');

  const q = db('recurring_expenses').where({ id });
  if (tenantId) q.andWhere('tenant_id', tenantId);
  await q.update({ is_deleted: true });
};

function addFrequency(date, frequency) {
  const d = new Date(date);
  switch (frequency) {
    case 'WEEKLY': d.setDate(d.getDate() + 7); break;
    case 'MONTHLY': d.setMonth(d.getMonth() + 1); break;
    case 'QUARTERLY': d.setMonth(d.getMonth() + 3); break;
    case 'YEARLY': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

export const processRecurringExpenses = async (tenantId = null) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const query = db('recurring_expenses')
    .where({ is_active: true, is_deleted: false })
    .where('next_due_date', '<=', today);
  applyTenantScope(query, tenantId);

  const dueItems = await query.select('*');
  const created = [];

  for (const item of dueItems) {
    // Import createExpense dynamically to avoid circular dependency
    const { createExpense } = await import('./expense.service.js');

    try {
      await createExpense(
        {
          title: `[Recurring] ${item.title}`,
          category: item.category,
          amount: Number(item.amount),
          paymentMethod: item.payment_method,
          notes: `Auto-created from recurring expense #${item.id}`,
          branchId: item.branch_id,
          tenantId: item.tenant_id,
        },
        'system',
        item.tenant_id
      );

      // Update next due date
      const newNextDue = addFrequency(item.next_due_date, item.frequency);
      const updateData = { next_due_date: newNextDue };

      // Deactivate if past end date
      if (item.end_date && newNextDue > new Date(item.end_date)) {
        updateData.is_active = false;
      }

      const q = db('recurring_expenses').where({ id: item.id });
      if (tenantId) q.andWhere('tenant_id', tenantId);
      await q.update(updateData);

      created.push({ id: item.id, title: item.title, amount: Number(item.amount) });
    } catch (err) {
      console.error(`[RECURRING] Failed to process expense #${item.id}:`, err.message);
    }
  }

  return { processed: created.length, created };
};
