import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

const generateEntryNumber = async (tenantId = null) => {
  const prefix = 'JE-';
  return prefix + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
};

function parseJSON(str) {
  if (typeof str === 'string') {
    try { return JSON.parse(str); } catch { return []; }
  }
  return str || [];
}

export function formatAccount(row, parentRow = null) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    code: row.code,
    name: row.name,
    type: row.type,
    subType: row.sub_type,
    parentId: parentRow ? { _id: String(parentRow.id), id: parentRow.id, code: parentRow.code, name: parentRow.name } : (row.parent_id ? String(row.parent_id) : null),
    description: row.description || '',
    isActive: Boolean(row.is_active),
    balance: Number(row.balance || 0),
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function formatJournalEntry(row) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    entryNumber: row.entry_number,
    date: row.date,
    description: row.description,
    reference: row.reference || '',
    lines: parseJSON(row.lines),
    totalDebit: Number(row.total_debit || 0),
    totalCredit: Number(row.total_credit || 0),
    status: row.status || 'DRAFT',
    postedBy: row.posted_by || '',
    voidedBy: row.voided_by || '',
    voidedAt: row.voided_at || null,
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId, tablePrefix = 'accounts') {
  if (tenantId) {
    query.where((b) => {
      b.where(`${tablePrefix}.tenant_id`, tenantId).orWhereNull(`${tablePrefix}.tenant_id`);
    });
  }
}

export const getAllAccounts = async (page = 1, limit = 100, search = '', type = '', tenantId = null, branchId = null) => {
  const countQuery = db('accounts').where('accounts.is_deleted', false);
  applyTenantScope(countQuery, tenantId, 'accounts');
  if (branchId && branchId !== 'all') {
    countQuery.where((b) => b.where('accounts.branch_id', branchId).orWhereNull('accounts.branch_id'));
  }
  if (type && type !== 'ALL') countQuery.where('accounts.type', type);
  if (search) {
    const term = `%${search}%`;
    countQuery.where((b) => {
      b.where('name', 'like', term).orWhere('code', 'like', term);
    });
  }

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('accounts')
    .leftJoin('accounts as p', 'accounts.parent_id', 'p.id')
    .where('accounts.is_deleted', false)
    .select(
      'accounts.*',
      'p.id as p_id', 'p.code as p_code', 'p.name as p_name'
    );
  applyTenantScope(dataQuery, tenantId, 'accounts');
  if (branchId && branchId !== 'all') {
    dataQuery.where((b) => b.where('accounts.branch_id', branchId).orWhereNull('accounts.branch_id'));
  }
  if (type && type !== 'ALL') dataQuery.where('accounts.type', type);
  if (search) {
    const term = `%${search}%`;
    dataQuery.where((b) => {
      b.where('accounts.name', 'like', term).orWhere('accounts.code', 'like', term);
    });
  }

  const rows = await dataQuery.orderBy('accounts.code', 'asc').limit(limit).offset(offset);

  const accounts = rows.map((row) => {
    const parentRow = row.p_id ? { id: row.p_id, code: row.p_code, name: row.p_name } : null;
    return formatAccount(row, parentRow);
  });

  return { accounts, pagination: getPagination(total, page, limit) };
};

export const getAccountById = async (id, tenantId = null) => {
  const query = db('accounts')
    .leftJoin('accounts as p', 'accounts.parent_id', 'p.id')
    .where({ 'accounts.id': id, 'accounts.is_deleted': false })
    .select(
      'accounts.*',
      'p.id as p_id', 'p.code as p_code', 'p.name as p_name'
    );
  applyTenantScope(query, tenantId, 'accounts');
  const row = await query.first();
  if (!row) throw ApiError.notFound('Account not found');
  const parentRow = row.p_id ? { id: row.p_id, code: row.p_code, name: row.p_name } : null;
  return formatAccount(row, parentRow);
};

export const createAccount = async (data) => {
  const tenantId = data.tenantId || null;
  const branchId = data.branchId || null;
  const existingQuery = db('accounts').where({ code: data.code, is_deleted: false });
  applyTenantScope(existingQuery, tenantId, 'accounts');
  if (await existingQuery.first()) throw ApiError.conflict('Account code already exists');

  const [insertedId] = await db('accounts').insert({
    tenant_id: tenantId,
    branch_id: branchId,
    code: data.code,
    name: data.name,
    type: data.type,
    sub_type: data.subType,
    parent_id: data.parentId || null,
    description: data.description || null,
    balance: data.balance || 0,
    is_active: data.isActive !== undefined ? Boolean(data.isActive) : true,
    is_deleted: false,
  });

  return getAccountById(insertedId, tenantId);
};

export const updateAccount = async (id, data, tenantId = null) => {
  const account = await getAccountById(id, tenantId);
  if (!account) throw ApiError.notFound('Account not found');

  const updateFields = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.isActive !== undefined) updateFields.is_active = Boolean(data.isActive);
  if (data.balance !== undefined) updateFields.balance = data.balance;

  if (Object.keys(updateFields).length > 0) {
    const acctUpdate = db('accounts').where({ id });
    if (tenantId) acctUpdate.andWhere('tenant_id', tenantId);
    await acctUpdate.update(updateFields);
  }

  return getAccountById(id, tenantId);
};

export const deleteAccount = async (id, tenantId = null) => {
  const account = await getAccountById(id, tenantId);
  if (!account) throw ApiError.notFound('Account not found');

  const acctDel = db('accounts').where({ id });
  if (tenantId) acctDel.andWhere('tenant_id', tenantId);
  await acctDel.update({ is_deleted: true });
  return { ...account, isDeleted: true };
};

export const seedDefaultAccounts = async (tenantId = null) => {
  const defaults = [
    { code: '1000', name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Cash on hand' },
    { code: '1010', name: 'Bank Account', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Bank account balance' },
    { code: '1020', name: 'Accounts Receivable', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Money owed by customers' },
    { code: '1030', name: 'Inventory', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Product inventory value' },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', subType: 'CURRENT_LIABILITY', description: 'Money owed to suppliers' },
    { code: '3000', name: 'Owner\'s Capital', type: 'EQUITY', subType: 'OWNERS_EQUITY', description: 'Owner investment' },
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE', subType: 'SALES_REVENUE', description: 'Revenue from product sales' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', subType: 'COST_OF_GOODS', description: 'Cost of products sold' },
    { code: '6000', name: 'Operating Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', description: 'General shop operating expense' },
  ];

  let count = 0;
  for (const def of defaults) {
    const existing = await db('accounts').where({ code: def.code, is_deleted: false }).first();
    if (!existing) {
      await db('accounts').insert({
        tenant_id: tenantId,
        code: def.code,
        name: def.name,
        type: def.type,
        sub_type: def.subType,
        description: def.description,
        is_deleted: false,
      });
      count++;
    }
  }

  return { message: 'Default accounts seeded', count };
};

// Journal Entries
export const getAllJournalEntries = async (page = 1, limit = 20, search = '', status = '', from = '', to = '', tenantId = null, branchId = null) => {
  const countQuery = db('journal_entries').where({ is_deleted: false });
  applyTenantScope(countQuery, tenantId, 'journal_entries');
  if (status && status !== 'ALL') countQuery.where({ status });
  if (branchId) countQuery.where('branch_id', branchId);

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('journal_entries').where({ is_deleted: false });
  applyTenantScope(dataQuery, tenantId, 'journal_entries');
  if (status && status !== 'ALL') dataQuery.where({ status });
  if (branchId) dataQuery.where('branch_id', branchId);

  const rows = await dataQuery.orderBy('created_at', 'desc').limit(limit).offset(offset);
  const entries = rows.map(formatJournalEntry);

  return { entries, pagination: getPagination(total, page, limit) };
};

export const getJournalEntryById = async (id, tenantId = null) => {
  const query = db('journal_entries').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId, 'journal_entries');
  const row = await query.first();
  if (!row) throw ApiError.notFound('Journal entry not found');
  return formatJournalEntry(row);
};

export const createJournalEntry = async (data) => {
  const tenantId = data.tenantId || null;
  const totalDebit = (data.lines || []).reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = (data.lines || []).reduce((sum, l) => sum + (l.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) throw ApiError.badRequest('Total debits must equal total credits');
  if (totalDebit <= 0) throw ApiError.badRequest('Total must be greater than 0');

  const entryNumber = await generateEntryNumber(tenantId);
  const [insertedId] = await db('journal_entries').insert({
    tenant_id: tenantId,
    entry_number: entryNumber,
    date: data.date ? new Date(data.date) : new Date(),
    description: data.description,
    reference: data.reference || null,
    lines: JSON.stringify(data.lines),
    total_debit: totalDebit,
    total_credit: totalCredit,
    status: 'POSTED',
    posted_by: 'system',
    is_deleted: false,
  });

  return getJournalEntryById(insertedId, tenantId);
};

export const postJournalEntry = async (id, postedBy = 'system', tenantId = null) => {
  const entry = await getJournalEntryById(id, tenantId);
  if (!entry) throw ApiError.notFound('Journal entry not found');

  const jePost = db('journal_entries').where({ id });
  if (tenantId) jePost.andWhere('tenant_id', tenantId);
  await jePost.update({ status: 'POSTED', posted_by: postedBy });
  return getJournalEntryById(id, tenantId);
};

export const voidJournalEntry = async (id, voidedBy = 'system', tenantId = null) => {
  const entry = await getJournalEntryById(id, tenantId);
  if (!entry) throw ApiError.notFound('Journal entry not found');

  const jeVoid = db('journal_entries').where({ id });
  if (tenantId) jeVoid.andWhere('tenant_id', tenantId);
  await jeVoid.update({ status: 'VOID', voided_by: voidedBy, voided_at: new Date() });
  return getJournalEntryById(id, tenantId);
};

export const deleteJournalEntry = async (id, tenantId = null) => {
  const entry = await getJournalEntryById(id, tenantId);
  if (!entry) throw ApiError.notFound('Journal entry not found');

  const jeDel = db('journal_entries').where({ id });
  if (tenantId) jeDel.andWhere('tenant_id', tenantId);
  await jeDel.update({ is_deleted: true });
  return { ...entry, isDeleted: true };
};

export const getBalanceSheet = async (asOf = '', tenantId = null) => {
  await seedDefaultAccounts(tenantId);
  const accountsQuery = db('accounts').where({ is_deleted: false, is_active: true });
  applyTenantScope(accountsQuery, tenantId, 'accounts');
  const rows = await accountsQuery.orderBy('code', 'asc');
  const accounts = rows.map(r => formatAccount(r));

  const assets = accounts.filter(a => a.type === 'ASSET');
  const liabilities = accounts.filter(a => a.type === 'LIABILITY');
  const equity = accounts.filter(a => a.type === 'EQUITY');

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

  return {
    asOf: asOf ? new Date(asOf) : new Date(),
    assets: { accounts: assets, total: totalAssets },
    liabilities: { accounts: liabilities, total: totalLiabilities },
    equity: { accounts: equity, total: totalEquity },
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
  };
};

export const getProfitLoss = async (from = '', to = '', tenantId = null, branchId = null) => {
  const revQuery = db('transactions').where({ tx_type: 'SALE', is_deleted: false });
  applyTenantScope(revQuery, tenantId, 'transactions');
  if (branchId) revQuery.where('branch_id', branchId);
  if (from) revQuery.where('created_at', '>=', new Date(from));
  if (to) revQuery.where('created_at', '<=', new Date(to + 'T23:59:59'));
  const revRes = await revQuery.sum({ total: 'net_total' }).first();

  const expQuery = db('expenses').where({ is_deleted: false });
  applyTenantScope(expQuery, tenantId, 'expenses');
  if (branchId) expQuery.where('branch_id', branchId);
  if (from) expQuery.where('created_at', '>=', new Date(from));
  if (to) expQuery.where('created_at', '<=', new Date(to + 'T23:59:59'));
  const expRes = await expQuery.sum({ total: 'amount' }).first();

  const totalRevenue = Number(revRes?.total || 0);
  const totalExpenses = Number(expRes?.total || 0);
  const netIncome = totalRevenue - totalExpenses;

  return {
    period: { from, to },
    revenue: { total: totalRevenue },
    expenses: { total: totalExpenses },
    netIncome,
    isProfit: netIncome >= 0,
  };
};

export const getTrialBalance = async (tenantId = null) => {
  await seedDefaultAccounts(tenantId);
  const query = db('accounts').where({ is_deleted: false, is_active: true });
  applyTenantScope(query, tenantId, 'accounts');
  const rows = await query.orderBy('code', 'asc');
  const accounts = rows.map(r => formatAccount(r));

  let totalDebit = 0;
  let totalCredit = 0;
  accounts.forEach(a => {
    if (a.type === 'ASSET' || a.type === 'EXPENSE') totalDebit += a.balance;
    else totalCredit += a.balance;
  });

  return {
    accounts,
    totalDebit,
    totalCredit,
    balanced: Math.abs(totalDebit - totalCredit) < 0.01,
  };
};

export const createAutomatedSaleJournal = async (sale) => {};
export const createAutomatedReturnJournal = async (sale, refundAmount, returnInvoiceNumber, opts = {}) => {};
export const createAutomatedDueCollectionJournal = async (sale, collectedAmount, method = 'cash', collectedBy = 'system') => {};
export const createAutomatedPurchaseReturnJournal = async (purchaseOrder, refundAmount) => {};
export const createAutomatedPurchaseJournal = async (purchaseOrder, grnEntries = []) => {};
export const createAutomatedExpenseJournal = async (expense) => {};
export const syncHistoricalJournals = async (tenantId = null) => { return { message: 'Synced', syncedCount: 0 }; };
