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
    query.where(`${tablePrefix}.tenant_id`, tenantId);
  } else {
    query.whereNull(`${tablePrefix}.tenant_id`);
  }
}

function applyBranchScope(query, branchId, tablePrefix = 'accounts') {
  if (branchId && branchId !== 'all') {
    query.where((b) => b.where(`${tablePrefix}.branch_id`, branchId).orWhereNull(`${tablePrefix}.branch_id`));
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

  // Get journal entry counts and last activity per account from JSON lines
  const accountIds = rows.map((r) => r.id);
  let journalCounts = {};
  let lastTransactions = {};
  let totalDebits = {};
  let totalCredits = {};
  if (accountIds.length > 0) {
    const jeQuery = db('journal_entries')
      .where('is_deleted', false)
      .andWhere('status', 'POSTED')
      .select('id', 'date', 'lines', 'branch_id');
    applyTenantScope(jeQuery, tenantId, 'journal_entries');
    if (branchId && branchId !== 'all') {
      jeQuery.where('branch_id', branchId);
    }
    const jeRows = await jeQuery;
    for (const je of jeRows) {
      let lines = [];
      try { lines = typeof je.lines === 'string' ? JSON.parse(je.lines) : (je.lines || []); } catch { lines = []; }
      for (const line of lines) {
        const acctId = line.accountId || line.account_id;
        if (acctId && accountIds.includes(acctId)) {
          journalCounts[acctId] = (journalCounts[acctId] || 0) + 1;
          totalDebits[acctId] = (totalDebits[acctId] || 0) + Number(line.debit || 0);
          totalCredits[acctId] = (totalCredits[acctId] || 0) + Number(line.credit || 0);
          if (!lastTransactions[acctId] || new Date(je.date) > new Date(lastTransactions[acctId])) {
            lastTransactions[acctId] = je.date;
          }
        }
      }
    }
  }

  const accounts = rows.map((row) => {
    const parentRow = row.p_id ? { id: row.p_id, code: row.p_code, name: row.p_name } : null;
    const formatted = formatAccount(row, parentRow);
    const d = totalDebits[row.id] || 0;
    const c = totalCredits[row.id] || 0;

    if (branchId && branchId !== 'all') {
      if (['ASSET', 'EXPENSE'].includes(row.type)) {
        formatted.balance = d - c;
      } else {
        formatted.balance = c - d;
      }
    }

    formatted.journalEntryCount = journalCounts[row.id] || 0;
    formatted.lastTransactionDate = lastTransactions[row.id] || null;
    formatted.totalDebit = d;
    formatted.totalCredit = c;
    return formatted;
  });

  return { accounts, pagination: getPagination(total, page, limit) };
};

export const getAccountById = async (id, tenantId = null, branchId = null) => {
  const query = db('accounts')
    .leftJoin('accounts as p', 'accounts.parent_id', 'p.id')
    .where({ 'accounts.id': id, 'accounts.is_deleted': false })
    .select(
      'accounts.*',
      'p.id as p_id', 'p.code as p_code', 'p.name as p_name'
    );
  applyTenantScope(query, tenantId, 'accounts');
  applyBranchScope(query, branchId, 'accounts');
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

export const updateAccount = async (id, data, tenantId = null, branchId = null) => {
  const account = await getAccountById(id, tenantId, branchId);
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

export const deleteAccount = async (id, tenantId = null, branchId = null) => {
  const account = await getAccountById(id, tenantId, branchId);
  if (!account) throw ApiError.notFound('Account not found');

  const acctDel = db('accounts').where({ id });
  if (tenantId) acctDel.andWhere('tenant_id', tenantId);
  await acctDel.update({ is_deleted: true });
  return { ...account, isDeleted: true };
};

export const seedDefaultAccounts = async (tenantId = null) => {
  const defaults = [
    { code: '1000', name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Cash on hand' },
    { code: '1010', name: 'Bank Account', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Bank / Card account balance' },
    { code: '1011', name: 'bKash Account', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'bKash mobile wallet' },
    { code: '1012', name: 'Nagad Account', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Nagad mobile wallet' },
    { code: '1013', name: 'Rocket Account', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Rocket mobile wallet' },
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
    const existingQuery = db('accounts').where({ code: def.code, is_deleted: false });
    if (tenantId) existingQuery.andWhere('tenant_id', tenantId);
    const existing = await existingQuery.first();
    if (!existing) {
      await db('accounts').insert({
        tenant_id: tenantId,
        code: def.code,
        name: def.name,
        type: def.type,
        sub_type: def.subType,
        description: def.description,
        is_active: true,
        is_deleted: false,
      });
      count++;
    }
  }

  return { message: 'Default accounts seeded', count };
};

const PAYMENT_METHOD_TO_ACCOUNT_CODE = {
  cash: '1000',
  bank: '1010',
  bkash: '1011',
  nagad: '1012',
  rocket: '1013',
};

export const getWalletBalance = async (paymentMethod, tenantId = null) => {
  const method = String(paymentMethod || 'cash').toLowerCase();
  const accountCode = PAYMENT_METHOD_TO_ACCOUNT_CODE[method] || '1000';
  const query = db('accounts').where({ code: accountCode, is_deleted: false });
  if (tenantId) query.andWhere('tenant_id', tenantId);
  const account = await query.first();
  return account ? Number(account.balance || 0) : 0;
};

export const validateWalletBalance = async (paymentMethod, amount, tenantId = null) => {
  const balance = await getWalletBalance(paymentMethod, tenantId);
  if (Number(amount || 0) > balance) {
    const methodName = String(paymentMethod || 'cash').toUpperCase();
    throw ApiError.badRequest(`Insufficient ${methodName} balance! Available: ৳${balance.toLocaleString()}, Required: ৳${Number(amount).toLocaleString()}`);
  }
  return balance;
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

export const getJournalEntryById = async (id, tenantId = null, branchId = null) => {
  const query = db('journal_entries').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId, 'journal_entries');
  applyBranchScope(query, branchId, 'journal_entries');
  const row = await query.first();
  if (!row) throw ApiError.notFound('Journal entry not found');
  return formatJournalEntry(row);
};

async function applyLinesToAccounts(lines = [], reverse = false, tenantId = null) {
  if (!Array.isArray(lines) || lines.length === 0) return;
  for (const line of lines) {
    const debit = Number(line.debit || 0);
    const credit = Number(line.credit || 0);
    if (debit === 0 && credit === 0) continue;

    let account = null;
    if (line.accountId) {
      const q = db('accounts').where({ id: line.accountId });
      if (tenantId) q.andWhere('tenant_id', tenantId);
      account = await q.first();
    } else if (line.code) {
      const q = db('accounts').where({ code: line.code, is_deleted: false });
      if (tenantId) q.andWhere('tenant_id', tenantId);
      account = await q.first();
    }

    if (account) {
      let delta = 0;
      if (account.type === 'ASSET' || account.type === 'EXPENSE') {
        delta = debit - credit;
      } else {
        delta = credit - debit;
      }

      if (reverse) delta = -delta;

      const newBalance = Number(account.balance || 0) + delta;
      await db('accounts').where({ id: account.id }).update({ balance: newBalance });
    }
  }
}

export const createJournalEntry = async (data) => {
  const tenantId = data.tenantId || null;
  const branchId = data.branchId || null;
  const totalDebit = (data.lines || []).reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = (data.lines || []).reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) throw ApiError.badRequest('Total debits must equal total credits');
  if (totalDebit <= 0) throw ApiError.badRequest('Total must be greater than 0');

  const entryNumber = await generateEntryNumber(tenantId);
  const [insertedId] = await db('journal_entries').insert({
    tenant_id: tenantId,
    branch_id: branchId,
    entry_number: entryNumber,
    date: data.date ? new Date(data.date) : new Date(),
    description: data.description,
    reference: data.reference || null,
    lines: JSON.stringify(data.lines),
    total_debit: totalDebit,
    total_credit: totalCredit,
    status: data.status || 'POSTED',
    posted_by: data.postedBy || 'system',
    is_deleted: false,
  });

  if ((data.status || 'POSTED') === 'POSTED') {
    await applyLinesToAccounts(data.lines, false, tenantId);
  }

  return getJournalEntryById(insertedId, tenantId, branchId);
};

export const postJournalEntry = async (id, postedBy = 'system', tenantId = null, branchId = null) => {
  const entry = await getJournalEntryById(id, tenantId, branchId);
  if (!entry) throw ApiError.notFound('Journal entry not found');

  if (entry.status !== 'POSTED') {
    const jePost = db('journal_entries').where({ id });
    if (tenantId) jePost.andWhere('tenant_id', tenantId);
    if (branchId && branchId !== 'all') jePost.andWhere('branch_id', branchId);
    // Bug #24 fixed: Update status in DB FIRST before applying to accounts.
    // This prevents double-applying balances if applyLinesToAccounts throws midway
    // and the entry is later retried with status still = DRAFT.
    await jePost.update({ status: 'POSTED', posted_by: postedBy });
    await applyLinesToAccounts(parseJSON(entry.lines), false, tenantId);
  }
  return getJournalEntryById(id, tenantId, branchId);
};

export const voidJournalEntry = async (id, voidedBy = 'system', tenantId = null, branchId = null) => {
  const entry = await getJournalEntryById(id, tenantId, branchId);
  if (!entry) throw ApiError.notFound('Journal entry not found');

  if (entry.status === 'POSTED') {
    await applyLinesToAccounts(parseJSON(entry.lines), true, tenantId);
  }

  const jeVoid = db('journal_entries').where({ id });
  if (tenantId) jeVoid.andWhere('tenant_id', tenantId);
  if (branchId && branchId !== 'all') jeVoid.andWhere('branch_id', branchId);
  await jeVoid.update({ status: 'VOID', voided_by: voidedBy, voided_at: new Date() });
  return getJournalEntryById(id, tenantId, branchId);
};

export const deleteJournalEntry = async (id, tenantId = null, branchId = null) => {
  const entry = await getJournalEntryById(id, tenantId, branchId);
  if (!entry) throw ApiError.notFound('Journal entry not found');

  if (entry.status === 'POSTED') {
    await applyLinesToAccounts(parseJSON(entry.lines), true, tenantId);
  }

  const jeDel = db('journal_entries').where({ id });
  if (tenantId) jeDel.andWhere('tenant_id', tenantId);
  if (branchId && branchId !== 'all') jeDel.andWhere('branch_id', branchId);
  await jeDel.update({ is_deleted: true });
  return { ...entry, isDeleted: true };
};

export const getBalanceSheet = async (asOf = '', tenantId = null, branchId = null) => {
  await seedDefaultAccounts(tenantId);

  // Sync historical transactions to journal entries & recalculate live account balances
  try {
    await syncHistoricalJournals(tenantId);
    await recalculateAllAccountBalances(tenantId);
  } catch (err) {
    console.error('[BalanceSheet Sync Error]:', err.message);
  }

  const accountsQuery = db('accounts').where({ is_deleted: false, is_active: true });
  applyTenantScope(accountsQuery, tenantId, 'accounts');
  applyBranchScope(accountsQuery, branchId, 'accounts');
  const rows = await accountsQuery.orderBy('code', 'asc');
  const accounts = rows.map(r => formatAccount(r));

  const assets = accounts.filter(a => a.type === 'ASSET');
  const liabilities = accounts.filter(a => a.type === 'LIABILITY');
  const equity = accounts.filter(a => a.type === 'EQUITY');
  const revenue = accounts.filter(a => a.type === 'REVENUE');
  const expenses = accounts.filter(a => a.type === 'EXPENSE');

  const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + (-Number(a.balance || 0)), 0);
  const baseEquity = equity.reduce((sum, a) => sum + (-Number(a.balance || 0)), 0);

  // Retained Earnings = Total Revenue (Credit) - Total Operating Expenses & COGS (Debit)
  const totalRevenue = revenue.reduce((sum, a) => sum + (-Number(a.balance || 0)), 0);
  const totalExpenses = expenses.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const retainedEarnings = totalRevenue - totalExpenses;
  const totalEquity = baseEquity + retainedEarnings;

  return {
    asOf: asOf ? new Date(asOf) : new Date(),
    assets: { accounts: assets, total: totalAssets },
    liabilities: { accounts: liabilities, total: totalLiabilities },
    equity: { accounts: equity, total: totalEquity, baseEquity, retainedEarnings },
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
  };
};

export const getProfitLoss = async (from = '', to = '', tenantId = null, branchId = null) => {
  const fromDateStr = from ? (from.includes('T') ? from.split('T')[0] : from) : '';
  const toDateStr = to ? (to.includes('T') ? to.split('T')[0] : to) : '';

  // 1. Fetch completed sales transactions
  const revQuery = db('transactions')
    .where({ tx_type: 'SALE', is_deleted: false, status: 'COMPLETED' });
  applyTenantScope(revQuery, tenantId, 'transactions');
  if (branchId && branchId !== 'all') revQuery.where('branch_id', branchId);
  if (fromDateStr) revQuery.whereRaw('DATE(created_at) >= ?', [fromDateStr]);
  if (toDateStr) revQuery.whereRaw('DATE(created_at) <= ?', [toDateStr]);

  const salesRows = await revQuery.select(
    'id', 'invoice_number', 'sub_total', 'discount', 'tax', 'net_total',
    'returned_amount', 'line_items', 'created_at'
  );

  let totalSalesRevenue = 0;
  let totalCogs = 0;
  let totalDiscounts = 0;
  let totalReturns = 0;

  // Cache products cost price for fallback
  const prodsQuery = db('products').where('is_deleted', false);
  applyTenantScope(prodsQuery, tenantId, 'products');
  const prods = await prodsQuery;
  const productCostMap = {};
  for (const p of prods) {
    productCostMap[p.id] = Number(p.cost_price || 0);
  }

  for (const sale of salesRows) {
    const net = Number(sale.net_total || 0) - Number(sale.returned_amount || 0);
    totalSalesRevenue += net;
    totalDiscounts += Number(sale.discount || 0);
    totalReturns += Number(sale.returned_amount || 0);

    let items = [];
    try {
      items = typeof sale.line_items === 'string' ? JSON.parse(sale.line_items) : (sale.line_items || []);
    } catch {
      items = [];
    }

    for (const item of items) {
      const qty = Number(item.qty || 1);
      const unitCost = item.unitCost !== undefined && item.unitCost !== null
        ? Number(item.unitCost)
        : (productCostMap[item.productId] || 0);
      totalCogs += (unitCost * qty);
    }
  }

  const grossProfit = totalSalesRevenue - totalCogs;

  // 2. Fetch Operating Expenses
  const expQuery = db('expenses').where({ is_deleted: false });
  applyTenantScope(expQuery, tenantId, 'expenses');
  if (branchId && branchId !== 'all') expQuery.where('branch_id', branchId);
  if (fromDateStr) expQuery.whereRaw('DATE(created_at) >= ?', [fromDateStr]);
  if (toDateStr) expQuery.whereRaw('DATE(created_at) <= ?', [toDateStr]);

  const expRows = await expQuery.select('id', 'title', 'category', 'amount');
  let totalExpenses = 0;
  const byCategory = {};

  for (const exp of expRows) {
    const amt = Number(exp.amount || 0);
    totalExpenses += amt;
    const cat = exp.category || 'General Expense';
    byCategory[cat] = (byCategory[cat] || 0) + amt;
  }

  // 3. Fetch Paid Payroll / Staff Salaries
  try {
    const payQuery = db('payrolls').where({ is_deleted: false, payment_status: 'PAID' });
    applyTenantScope(payQuery, tenantId, 'payrolls');
    if (branchId && branchId !== 'all') payQuery.where('branch_id', branchId);
    if (fromDateStr) payQuery.whereRaw('DATE(created_at) >= ?', [fromDateStr]);
    if (toDateStr) payQuery.whereRaw('DATE(created_at) <= ?', [toDateStr]);

    const payRows = await payQuery.sum({ total: 'net_salary' }).first();
    const payrollTotal = Number(payRows?.total || 0);
    if (payrollTotal > 0) {
      totalExpenses += payrollTotal;
      byCategory['Staff Salaries & Payroll'] = (byCategory['Staff Salaries & Payroll'] || 0) + payrollTotal;
    }
  } catch (err) {
    // Non-blocking if payrolls table not yet queried
  }

  // 4. Fetch Total Product Purchases / Stock Restocks from purchase_orders
  let totalPurchasesCost = 0;
  let purchasesCount = 0;
  try {
    const poQuery = db('purchase_orders').where({ is_deleted: false }).whereNot('status', 'CANCELLED');
    applyTenantScope(poQuery, tenantId, 'purchase_orders');
    if (branchId && branchId !== 'all') poQuery.where('branch_id', branchId);
    if (fromDateStr) poQuery.whereRaw('DATE(created_at) >= ?', [fromDateStr]);
    if (toDateStr) poQuery.whereRaw('DATE(created_at) <= ?', [toDateStr]);

    // Bug #9 fixed: P&L was querying non-existent columns 'total_cost' and 'grand_total'.
    // The purchase_orders table uses 'sub_total' and 'net_total'.
    const poRows = await poQuery.select('id', 'sub_total', 'net_total', 'paid_amount', 'returned_amount');
    purchasesCount = poRows.length;
    for (const po of poRows) {
      const net = Number(po.net_total || po.sub_total || 0);
      const ret = Number(po.returned_amount || 0);
      totalPurchasesCost += Math.max(0, net - ret);
    }
  } catch (err) {
    // Non-blocking if table missing
  }

  const netIncome = grossProfit - totalExpenses;
  const grossMarginPercent = totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0;
  const netMarginPercent = totalSalesRevenue > 0 ? (netIncome / totalSalesRevenue) * 100 : 0;

  return {
    period: { from, to },
    revenue: {
      total: totalSalesRevenue,
      salesCount: salesRows.length,
      discounts: totalDiscounts,
      returns: totalReturns,
    },
    cogs: {
      total: totalCogs,
    },
    purchases: {
      total: totalPurchasesCost,
      count: purchasesCount,
    },
    grossProfit,
    grossMarginPercent: Number(grossMarginPercent.toFixed(2)),
    expenses: {
      total: totalExpenses,
      byCategory,
    },
    netIncome,
    netMarginPercent: Number(netMarginPercent.toFixed(2)),
    isProfit: netIncome >= 0,
  };
};

export const recalculateAllAccountBalances = async (tenantId = null) => {
  await seedDefaultAccounts(tenantId);
  const acctQuery = db('accounts').where({ is_deleted: false });
  applyTenantScope(acctQuery, tenantId, 'accounts');
  const allAccounts = await acctQuery;

  const acctTypeMap = {};
  for (const acct of allAccounts) {
    acctTypeMap[acct.id] = acct.type;
  }

  // Wrap balance reset + replay in a transaction to prevent stale reads during operation
  await db.transaction(async (trx) => {
    for (const acct of allAccounts) {
      await trx('accounts').where({ id: acct.id }).update({ balance: 0 });
    }

    const jeQuery = trx('journal_entries').where({ is_deleted: false, status: 'POSTED' });
    if (tenantId) jeQuery.where('tenant_id', tenantId);
    const postedEntries = await jeQuery;

    for (const entry of postedEntries) {
      const lines = parseJSON(entry.lines);
      for (const line of lines) {
        if (line.accountId && (line.debit || line.credit)) {
          const type = acctTypeMap[line.accountId] || 'ASSET';
          const debit = Number(line.debit || 0);
          const credit = Number(line.credit || 0);
          const delta = (type === 'ASSET' || type === 'EXPENSE')
            ? (debit - credit)
            : (credit - debit);

          await trx('accounts')
            .where({ id: line.accountId })
            .increment('balance', delta);
        }
      }
    }
  });
};

export const getTrialBalance = async (tenantId = null, branchId = null) => {
  await seedDefaultAccounts(tenantId);

  // Sync any unsynced historical transactions and recalculate account balances
  try {
    await syncHistoricalJournals(tenantId);
    await recalculateAllAccountBalances(tenantId);
  } catch (e) {
    console.error('[TrialBalance Sync Error]:', e.message);
  }

  const query = db('accounts').where({ is_deleted: false, is_active: true });
  applyTenantScope(query, tenantId, 'accounts');
  applyBranchScope(query, branchId, 'accounts');
  const rows = await query.orderBy('code', 'asc');

  let totalDebit = 0;
  let totalCredit = 0;

  const accounts = rows.map((r) => {
    const formatted = formatAccount(r);
    const balance = Number(formatted.balance || 0);
    let debit = 0;
    let credit = 0;

    if (formatted.type === 'ASSET' || formatted.type === 'EXPENSE') {
      if (balance >= 0) {
        debit = balance;
      } else {
        credit = Math.abs(balance);
      }
    } else {
      if (balance >= 0) {
        credit = balance;
      } else {
        debit = Math.abs(balance);
      }
    }

    totalDebit += debit;
    totalCredit += credit;

    return {
      ...formatted,
      debit,
      credit,
    };
  });

  return {
    accounts,
    totalDebit,
    totalCredit,
    balanced: Math.abs(totalDebit - totalCredit) < 0.01,
  };
};

export const createAutomatedSaleJournal = async (sale) => {
  try {
    const tenantId = sale.tenant_id || sale.tenantId || null;
    const ref = sale.invoice_number || sale.invoiceNo;
    if (!ref) return null;

    const existing = await db('journal_entries').where({ reference: ref, is_deleted: false }).first();
    if (existing) return existing;

    await seedDefaultAccounts(tenantId);
    const acctsQuery = db('accounts').where({ is_deleted: false });
    applyTenantScope(acctsQuery, tenantId, 'accounts');
    const accounts = await acctsQuery;
    const acctMap = {};
    for (const a of accounts) acctMap[a.code] = a;

    let pb = {};
    try { pb = typeof sale.payment_breakdown === 'string' ? JSON.parse(sale.payment_breakdown) : (sale.paymentBreakdown || sale.payment_breakdown || {}); } catch { pb = {}; }

    const cash = Number(pb.cash || 0);
    const bkash = Number(pb.bkash || 0);
    const nagad = Number(pb.nagad || 0);
    const rocket = Number(pb.rocket || 0);
    const bank = Number(pb.bank || 0);
    const due = Number(pb.dueAmount || 0);
    const netTotal = Number(sale.net_total || sale.grandTotal || sale.totalAmount || 0);

    const lines = [];
    if (cash > 0 && acctMap['1000']) lines.push({ accountId: acctMap['1000'].id, code: '1000', accountName: 'Cash', debit: cash, credit: 0 });
    if (bank > 0 && acctMap['1010']) lines.push({ accountId: acctMap['1010'].id, code: '1010', accountName: 'Bank Account', debit: bank, credit: 0 });
    if (bkash > 0 && acctMap['1011']) lines.push({ accountId: acctMap['1011'].id, code: '1011', accountName: 'bKash Account', debit: bkash, credit: 0 });
    if (nagad > 0 && acctMap['1012']) lines.push({ accountId: acctMap['1012'].id, code: '1012', accountName: 'Nagad Account', debit: nagad, credit: 0 });
    if (rocket > 0 && acctMap['1013']) lines.push({ accountId: acctMap['1013'].id, code: '1013', accountName: 'Rocket Account', debit: rocket, credit: 0 });
    if (due > 0 && acctMap['1020']) lines.push({ accountId: acctMap['1020'].id, code: '1020', accountName: 'Accounts Receivable', debit: due, credit: 0 });

    const totalPaidAssigned = cash + bank + bkash + nagad + rocket + due;
    if (totalPaidAssigned < netTotal && acctMap['1000']) {
      lines.push({ accountId: acctMap['1000'].id, code: '1000', accountName: 'Cash', debit: netTotal - totalPaidAssigned, credit: 0 });
    }

    if (acctMap['4000']) {
      lines.push({ accountId: acctMap['4000'].id, code: '4000', accountName: 'Sales Revenue', debit: 0, credit: netTotal });
    }

    let saleItems = [];
    try { saleItems = typeof sale.line_items === 'string' ? JSON.parse(sale.line_items) : (sale.lineItems || sale.items || []); } catch { saleItems = []; }
    let cogs = 0;
    for (const it of saleItems) {
      const qty = Number(it.qty || 1);
      const uCost = Number(it.unitCost || 0);
      cogs += (uCost * qty);
    }
    if (cogs > 0 && acctMap['5000'] && acctMap['1030']) {
      lines.push({ accountId: acctMap['5000'].id, code: '5000', accountName: 'Cost of Goods Sold', debit: cogs, credit: 0 });
      lines.push({ accountId: acctMap['1030'].id, code: '1030', accountName: 'Inventory', debit: 0, credit: cogs });
    }

    if (lines.length >= 2) {
      return await createJournalEntry({
        tenantId,
        date: sale.created_at || new Date(),
        description: `Sale Invoice #${ref} (${sale.customer_name || 'Walk-in'})`,
        reference: ref,
        lines,
        status: 'POSTED',
      });
    }
  } catch (err) {
    console.error('[AUTO-JOURNAL] Failed to create sale journal:', err.message);
  }
  return null;
};

export const createAutomatedExpenseJournal = async (expense) => {
  try {
    const tenantId = expense.tenant_id || expense.tenantId || null;
    const branchId = expense.branch_id || expense.branchId || null;
    const amt = Number(expense.amount || 0);
    if (amt <= 0) return null;

    let expenseId = expense.id;
    if (!expenseId) {
      const [insertedId] = await db('expenses').insert({
        tenant_id: tenantId,
        branch_id: branchId,
        title: expense.title || expense.notes || `${expense.expenseCategory || expense.category || 'Supplier Payment'}`,
        category: expense.expenseCategory || expense.category || 'Supplier Payment',
        amount: amt,
        payment_method: String(expense.paymentMethod || expense.payment_method || 'cash').toLowerCase(),
        date: expense.date || new Date(),
        voucher_number: expense.voucherNumber || `PAY-${Date.now().toString(36).toUpperCase()}`,
        notes: expense.notes || '',
        recorded_by: expense.createdBy || 'system',
        is_deleted: false,
      });
      expenseId = insertedId;
    }

    const ref = `EXP-${expenseId}`;
    const existing = await db('journal_entries').where({ reference: ref, is_deleted: false }).first();
    if (existing) return existing;

    await seedDefaultAccounts(tenantId);
    const acctsQuery = db('accounts').where({ is_deleted: false });
    applyTenantScope(acctsQuery, tenantId, 'accounts');
    const accounts = await acctsQuery;
    const acctMap = {};
    for (const a of accounts) acctMap[a.code] = a;

    const method = String(expense.payment_method || expense.paymentMethod || 'cash').toLowerCase();
    let creditAcct = acctMap['1000'];
    if (method.includes('bank') && acctMap['1010']) creditAcct = acctMap['1010'];
    else if (method.includes('bkash') && acctMap['1011']) creditAcct = acctMap['1011'];
    else if (method.includes('nagad') && acctMap['1012']) creditAcct = acctMap['1012'];
    else if (method.includes('rocket') && acctMap['1013']) creditAcct = acctMap['1013'];

    const expenseAcct = acctMap['6000'];
    if (expenseAcct && creditAcct && amt > 0) {
      const expTitle = expense.title || expense.notes || expense.category || expense.expenseCategory || 'Shop Expense';
      const expCat = expense.category || expense.expenseCategory || 'General Expense';
      return await createJournalEntry({
        tenantId,
        branchId,
        date: expense.created_at || expense.date || new Date(),
        description: `Expense: ${expTitle} (${expCat})`,
        reference: ref,
        lines: [
          { accountId: expenseAcct.id, code: expenseAcct.code, accountName: expenseAcct.name, debit: amt, credit: 0 },
          { accountId: creditAcct.id, code: creditAcct.code, accountName: creditAcct.name, debit: 0, credit: amt },
        ],
        status: 'POSTED',
      });
    }
  } catch (err) {
    console.error('[AUTO-JOURNAL] Failed to create expense journal:', err.message);
  }
  return null;
};

export const createAutomatedDueCollectionJournal = async (sale, collectedAmount, method = 'cash', collectedBy = 'system') => {
  try {
    const tenantId = sale.tenant_id || sale.tenantId || null;
    const amt = Number(collectedAmount || 0);
    if (amt <= 0) return null;

    await seedDefaultAccounts(tenantId);
    const acctsQuery = db('accounts').where({ is_deleted: false });
    applyTenantScope(acctsQuery, tenantId, 'accounts');
    const accounts = await acctsQuery;
    const acctMap = {};
    for (const a of accounts) acctMap[a.code] = a;

    let debitAcct = acctMap['1000'];
    const m = String(method).toLowerCase();
    if (m.includes('bank') && acctMap['1010']) debitAcct = acctMap['1010'];
    else if (m.includes('bkash') && acctMap['1011']) debitAcct = acctMap['1011'];
    else if (m.includes('nagad') && acctMap['1012']) debitAcct = acctMap['1012'];
    else if (m.includes('rocket') && acctMap['1013']) debitAcct = acctMap['1013'];

    const arAcct = acctMap['1020'];
    if (debitAcct && arAcct) {
      return await createJournalEntry({
        tenantId,
        date: new Date(),
        description: `Due Collection for Invoice #${sale.invoice_number || sale.invoiceNo || 'Sale'}`,
        reference: `DUE-${sale.invoice_number || sale.id}-${Date.now().toString().slice(-4)}`,
        lines: [
          { accountId: debitAcct.id, code: debitAcct.code, accountName: debitAcct.name, debit: amt, credit: 0 },
          { accountId: arAcct.id, code: arAcct.code, accountName: arAcct.name, debit: 0, credit: amt },
        ],
        status: 'POSTED',
      });
    }
  } catch (err) {
    console.error('[AUTO-JOURNAL] Failed to create due collection journal:', err.message);
  }
  return null;
};

export const syncHistoricalJournals = async (tenantId = null) => {
  await seedDefaultAccounts(tenantId);

  const acctsQuery = db('accounts').where({ is_deleted: false });
  applyTenantScope(acctsQuery, tenantId, 'accounts');
  const accounts = await acctsQuery;
  const acctMap = {};
  for (const a of accounts) {
    acctMap[a.code] = a;
  }

  const allProducts = await db('products').where('is_deleted', false).select('id', 'cost_price');
  const prodCostMap = {};
  for (const p of allProducts) {
    prodCostMap[p.id] = Number(p.cost_price || 0);
  }

  let syncedCount = 0;

  // 0. Sync Fixed Shop Assets with Owner's Capital
  const capitalAcct = acctMap['3000'];
  if (capitalAcct) {
    const fixedAssets = accounts.filter(
      (a) => a.type === 'ASSET' && !['1000', '1010', '1011', '1012', '1013', '1020', '1030'].includes(a.code)
    );
    for (const fa of fixedAssets) {
      const pCost = Number(fa.balance || 0);
      if (pCost > 0) {
        const ref = `INIT-AST-${fa.id}`;
        const existing = db('journal_entries').where({ reference: ref, is_deleted: false });
        applyTenantScope(existing, tenantId, 'journal_entries');
        const hasExisting = await existing.first();
        if (!hasExisting) {
          await createJournalEntry({
            tenantId: fa.tenant_id || tenantId,
            date: fa.created_at || new Date(),
            description: `Initial Capital Asset: ${fa.name}`,
            reference: ref,
            lines: [
              { accountId: fa.id, code: fa.code, accountName: fa.name, debit: pCost, credit: 0 },
              { accountId: capitalAcct.id, code: capitalAcct.code, accountName: capitalAcct.name, debit: 0, credit: pCost },
            ],
          });
          syncedCount++;
        }
      }
    }
  }

  // 1. Sync Sales
  const salesQuery = db('transactions').where({ tx_type: 'SALE', is_deleted: false, status: 'COMPLETED' });
  applyTenantScope(salesQuery, tenantId, 'transactions');
  const sales = await salesQuery;

  for (const sale of sales) {
    const ref = sale.invoice_number;
    const existing = db('journal_entries').where({ reference: ref, is_deleted: false });
    applyTenantScope(existing, tenantId, 'journal_entries');
    const hasExisting = await existing.first();

    if (!hasExisting && sale.net_total > 0) {
      let pb = {};
      try { pb = typeof sale.payment_breakdown === 'string' ? JSON.parse(sale.payment_breakdown) : (sale.payment_breakdown || {}); } catch { pb = {}; }

      const cash = Number(pb.cash || 0);
      const bkash = Number(pb.bkash || 0);
      const nagad = Number(pb.nagad || 0);
      const rocket = Number(pb.rocket || 0);
      const bank = Number(pb.bank || 0);
      const due = Number(pb.dueAmount || 0);
      const netTotal = Number(sale.net_total || 0);

      const lines = [];
      if (cash > 0 && acctMap['1000']) lines.push({ accountId: acctMap['1000'].id, code: '1000', accountName: 'Cash', debit: cash, credit: 0 });
      if (bank > 0 && acctMap['1010']) lines.push({ accountId: acctMap['1010'].id, code: '1010', accountName: 'Bank Account', debit: bank, credit: 0 });
      if (bkash > 0 && acctMap['1011']) lines.push({ accountId: acctMap['1011'].id, code: '1011', accountName: 'bKash Account', debit: bkash, credit: 0 });
      if (nagad > 0 && acctMap['1012']) lines.push({ accountId: acctMap['1012'].id, code: '1012', accountName: 'Nagad Account', debit: nagad, credit: 0 });
      if (rocket > 0 && acctMap['1013']) lines.push({ accountId: acctMap['1013'].id, code: '1013', accountName: 'Rocket Account', debit: rocket, credit: 0 });
      if (due > 0 && acctMap['1020']) lines.push({ accountId: acctMap['1020'].id, code: '1020', accountName: 'Accounts Receivable', debit: due, credit: 0 });

      const totalPaidAssigned = cash + bank + bkash + nagad + rocket + due;
      if (totalPaidAssigned < netTotal && acctMap['1000']) {
        lines.push({ accountId: acctMap['1000'].id, code: '1000', accountName: 'Cash', debit: netTotal - totalPaidAssigned, credit: 0 });
      }

      if (acctMap['4000']) {
        lines.push({ accountId: acctMap['4000'].id, code: '4000', accountName: 'Sales Revenue', debit: 0, credit: netTotal });
      }

      let saleItems = [];
      try { saleItems = typeof sale.line_items === 'string' ? JSON.parse(sale.line_items) : (sale.line_items || []); } catch { saleItems = []; }
      let cogs = 0;
      for (const it of saleItems) {
        const qty = Number(it.qty || 1);
        const uCost = it.unitCost !== undefined ? Number(it.unitCost) : (prodCostMap[it.productId] || 0);
        cogs += (uCost * qty);
      }

      if (cogs > 0 && acctMap['5000'] && acctMap['1030']) {
        lines.push({ accountId: acctMap['5000'].id, code: '5000', accountName: 'Cost of Goods Sold', debit: cogs, credit: 0 });
        lines.push({ accountId: acctMap['1030'].id, code: '1030', accountName: 'Inventory', debit: 0, credit: cogs });
      }

      if (lines.length >= 2) {
        await createJournalEntry({
          tenantId: sale.tenant_id || tenantId,
          date: sale.created_at,
          description: `Sale Invoice #${ref} (${sale.customer_name || 'Walk-in'})`,
          reference: ref,
          lines,
        });
        syncedCount++;
      }
    }
  }

  // 2. Sync Expenses
  const expQuery = db('expenses').where({ is_deleted: false });
  applyTenantScope(expQuery, tenantId, 'expenses');
  const expenses = await expQuery;

  for (const exp of expenses) {
    const ref = `EXP-${exp.id}`;
    const existing = db('journal_entries').where({ reference: ref, is_deleted: false });
    applyTenantScope(existing, tenantId, 'journal_entries');
    const hasExisting = await existing.first();

    if (!hasExisting && exp.amount > 0) {
      const amt = Number(exp.amount || 0);
      const method = String(exp.payment_method || 'cash').toLowerCase();
      let creditAcct = acctMap['1000'];
      if (method.includes('bank') && acctMap['1010']) creditAcct = acctMap['1010'];
      else if (method.includes('bkash') && acctMap['1011']) creditAcct = acctMap['1011'];
      else if (method.includes('nagad') && acctMap['1012']) creditAcct = acctMap['1012'];
      else if (method.includes('rocket') && acctMap['1013']) creditAcct = acctMap['1013'];

      const expenseAcct = acctMap['6000'];
      if (expenseAcct && creditAcct) {
        const titleStr = exp.title || exp.notes || exp.category || 'General Expense';
        const catStr = exp.category || 'General Expense';
        await createJournalEntry({
          tenantId: exp.tenant_id || tenantId,
          date: exp.created_at,
          description: `Expense: ${titleStr} (${catStr})`,
          reference: ref,
          lines: [
            { accountId: expenseAcct.id, code: expenseAcct.code, accountName: expenseAcct.name, debit: amt, credit: 0 },
            { accountId: creditAcct.id, code: creditAcct.code, accountName: creditAcct.name, debit: 0, credit: amt },
          ],
        });
        syncedCount++;
      }
    }
  }

  // Cleanup any legacy undefined descriptions in journal entries
  try {
    await db('journal_entries')
      .where('description', 'like', '%undefined%')
      .update({ description: 'Expense: Shop Operating Expense (General Expense)' });
  } catch (e) {
    // ignore
  }

  // Bug #12 fixed: Use soft-delete (is_deleted = true) instead of hard .delete()
  // to maintain audit trail. Also add tenant scope to prevent cross-tenant data loss.
  // Clean up any legacy duplicate inventory purchase expenses
  try {
    const dupExpQuery = db('expenses')
      .where('category', 'Inventory Purchase')
      .orWhere('title', 'like', '%Product Restock Purchase%');
    if (tenantId) dupExpQuery.andWhere('tenant_id', tenantId);
    const dupExpenses = await dupExpQuery.select('id');
    if (dupExpenses.length > 0) {
      const expIds = dupExpenses.map(e => e.id);
      // Soft-delete expenses
      const expDelQ = db('expenses').whereIn('id', expIds);
      if (tenantId) expDelQ.andWhere('tenant_id', tenantId);
      await expDelQ.update({ is_deleted: true, updated_at: new Date() });
      // Soft-delete related journal entries
      for (const eId of expIds) {
        const jeDelQ = db('journal_entries').where('reference', `EXP-${eId}`);
        if (tenantId) jeDelQ.andWhere('tenant_id', tenantId);
        await jeDelQ.update({ is_deleted: true });
      }
    }
  } catch (e) {
    // ignore
  }

  // 3. Sync Purchase Orders
  const poQuery = db('purchase_orders').where({ is_deleted: false });
  applyTenantScope(poQuery, tenantId, 'purchase_orders');
  const purchaseOrders = await poQuery;

  for (const po of purchaseOrders) {
    const ref = `PO-${po.id}`;
    const existing = db('journal_entries').where({ reference: ref, is_deleted: false });
    applyTenantScope(existing, tenantId, 'journal_entries');
    const hasExisting = await existing.first();

    if (!hasExisting) {
      await createAutomatedPurchaseJournal(po, po.created_by || 'system');
      syncedCount++;
    }
  }

  await recalculateAllAccountBalances(tenantId);
  return { message: `Successfully synced ${syncedCount} journal entries into ledger`, syncedCount };
};

export const createAutomatedReturnJournal = async (sale, refundAmount, returnInvoiceNumber, opts = {}) => {
  try {
    const tenantId = sale.tenant_id || sale.tenantId || null;
    const ref = returnInvoiceNumber || `RET-${sale.invoice_number || sale.invoiceNo || sale.id}`;
    const existing = await db('journal_entries').where({ reference: ref, is_deleted: false }).first();
    if (existing) return existing;

    await seedDefaultAccounts(tenantId);
    const acctsQuery = db('accounts').where({ is_deleted: false });
    applyTenantScope(acctsQuery, tenantId, 'accounts');
    const accounts = await acctsQuery;
    const acctMap = {};
    for (const a of accounts) acctMap[a.code] = a;

    const refund = Number(refundAmount || 0);
    if (refund <= 0) return null;

    const lines = [];
    // Debit Sales Revenue (or Sales Returns) 4000
    if (acctMap['4000']) {
      lines.push({ accountId: acctMap['4000'].id, code: '4000', accountName: 'Sales Revenue', debit: refund, credit: 0 });
    }

    // Credit Cash, Bank, Wallet, or Accounts Receivable
    let pb = {};
    try { pb = typeof sale.payment_breakdown === 'string' ? JSON.parse(sale.payment_breakdown) : (sale.paymentBreakdown || sale.payment_breakdown || {}); } catch { pb = {}; }
    const dueAmount = Number(pb.dueAmount || sale.due_amount || sale.dueAmount || 0);

    if (dueAmount > 0 && acctMap['1020']) {
      const dueReduction = Math.min(dueAmount, refund);
      lines.push({ accountId: acctMap['1020'].id, code: '1020', accountName: 'Accounts Receivable', debit: 0, credit: dueReduction });
      const remainingRefund = refund - dueReduction;
      if (remainingRefund > 0 && acctMap['1000']) {
        lines.push({ accountId: acctMap['1000'].id, code: '1000', accountName: 'Cash', debit: 0, credit: remainingRefund });
      }
    } else if (acctMap['1000']) {
      lines.push({ accountId: acctMap['1000'].id, code: '1000', accountName: 'Cash', debit: 0, credit: refund });
    }

    // Restore Inventory & reverse COGS if cost is available
    let items = [];
    try { items = typeof sale.line_items === 'string' ? JSON.parse(sale.line_items) : (sale.lineItems || sale.items || []); } catch { items = []; }
    let cogsRestored = 0;
    for (const it of items) {
      const qty = Number(it.quantity || it.qty || 1);
      const uCost = Number(it.unitCost || 0);
      cogsRestored += (uCost * qty);
    }
    if (cogsRestored > 0 && acctMap['1030'] && acctMap['5000']) {
      lines.push({ accountId: acctMap['1030'].id, code: '1030', accountName: 'Inventory', debit: cogsRestored, credit: 0 });
      lines.push({ accountId: acctMap['5000'].id, code: '5000', accountName: 'Cost of Goods Sold', debit: 0, credit: cogsRestored });
    }

    if (lines.length >= 2) {
      return await createJournalEntry({
        tenantId,
        date: new Date(),
        description: `Sales Return (${ref}) - Customer: ${sale.customer_name || sale.customer?.name || 'Customer'}`,
        reference: ref,
          status: 'POSTED',
        });
      }
    } catch (err) {
      console.error('[Accounting Auto-Journal Sale Return Error]:', err.message);
    }
  };

export const createAutomatedPurchaseReturnJournal = async (purchaseOrder, refundAmount) => {};
// Bug #10 fixed: createAutomatedServiceJournal now creates POSTED journals.
// Previously used DRAFT status, so repair revenue was never reflected in the ledger.
export const createAutomatedPurchaseJournal = async (purchaseOrder, createdBy = 'system') => {
  try {
    const tenantId = purchaseOrder.tenantId || purchaseOrder.tenant_id || null;
    const branchId = purchaseOrder.branchId || purchaseOrder.branch_id || null;
    const poNumber = purchaseOrder.poNumber || purchaseOrder.po_number || 'PO';
    const ref = `PO-${purchaseOrder.id || purchaseOrder._id}`;

    const netTotal = Number(purchaseOrder.netTotal || purchaseOrder.net_total || 0);
    const paidAmount = Number(purchaseOrder.paidAmount || purchaseOrder.paid_amount || 0);
    const dueAmount = Number(purchaseOrder.dueAmount || purchaseOrder.due_amount || 0);

    const existingEntry = await db('journal_entries').where({ reference: ref, is_deleted: false }).first();
    if (existingEntry) return existingEntry;

    await seedDefaultAccounts(tenantId);
    const acctsQuery = db('accounts').where({ is_deleted: false });
    applyTenantScope(acctsQuery, tenantId, 'accounts');
    const accounts = await acctsQuery;
    const acctMap = {};
    for (const a of accounts) acctMap[a.code] = a;

    // Parse payment breakdown for split payments
    let pb = {};
    try { pb = typeof purchaseOrder.payment_breakdown === 'string' ? JSON.parse(purchaseOrder.payment_breakdown) : (purchaseOrder.paymentBreakdown || purchaseOrder.payment_breakdown || {}); } catch { pb = {}; }

    const cash = Number(pb.cash || 0);
    const bkash = Number(pb.bkash || 0);
    const nagad = Number(pb.nagad || 0);
    const rocket = Number(pb.rocket || 0);
    const bank = Number(pb.bank || 0);

    // Fallback: if no payment_breakdown, use single method
    const method = String(purchaseOrder.paymentMethod || purchaseOrder.payment_method || 'cash').toLowerCase();
    let fallbackPaid = paidAmount;
    if (cash + bkash + nagad + rocket + bank === 0 && paidAmount > 0) {
      if (method.includes('bank')) { /* already default */ }
      else if (method.includes('bkash')) { /* handled via map below */ }
      else if (method.includes('nagad')) { /* handled via map below */ }
      else if (method.includes('rocket')) { /* handled via map below */ }
    }

    const invAcct = acctMap['1030']; // Inventory Asset
    const apAcct = acctMap['2000'];  // Accounts Payable

    const lines = [];
    // Debit Inventory for full amount
    if (invAcct && netTotal > 0) {
      lines.push({ accountId: invAcct.id, code: invAcct.code, accountName: invAcct.name, debit: netTotal, credit: 0 });
    }

    // Credit each payment method account
    if (cash > 0 && acctMap['1000']) lines.push({ accountId: acctMap['1000'].id, code: '1000', accountName: 'Cash', debit: 0, credit: cash });
    if (bank > 0 && acctMap['1010']) lines.push({ accountId: acctMap['1010'].id, code: '1010', accountName: 'Bank Account', debit: 0, credit: bank });
    if (bkash > 0 && acctMap['1011']) lines.push({ accountId: acctMap['1011'].id, code: '1011', accountName: 'bKash Account', debit: 0, credit: bkash });
    if (nagad > 0 && acctMap['1012']) lines.push({ accountId: acctMap['1012'].id, code: '1012', accountName: 'Nagad Account', debit: 0, credit: nagad });
    if (rocket > 0 && acctMap['1013']) lines.push({ accountId: acctMap['1013'].id, code: '1013', accountName: 'Rocket Account', debit: 0, credit: rocket });

    // Fallback: single payment method (no breakdown provided)
    const totalSplit = cash + bkash + nagad + rocket + bank;
    if (totalSplit === 0 && paidAmount > 0) {
      let payAcct = acctMap['1000'];
      if (method.includes('bank') && acctMap['1010']) payAcct = acctMap['1010'];
      else if (method.includes('bkash') && acctMap['1011']) payAcct = acctMap['1011'];
      else if (method.includes('nagad') && acctMap['1012']) payAcct = acctMap['1012'];
      else if (method.includes('rocket') && acctMap['1013']) payAcct = acctMap['1013'];
      if (payAcct) lines.push({ accountId: payAcct.id, code: payAcct.code, accountName: payAcct.name, debit: 0, credit: paidAmount });
    }

    // Credit Accounts Payable for due amount
    if (apAcct && dueAmount > 0) {
      lines.push({ accountId: apAcct.id, code: apAcct.code, accountName: apAcct.name, debit: 0, credit: dueAmount });
    }

    if (lines.length >= 2) {
      return await createJournalEntry({
        tenantId,
        branchId,
        date: purchaseOrder.createdAt || purchaseOrder.created_at || new Date(),
        description: `Product Purchase PO #${poNumber}`,
        reference: ref,
        lines,
        status: 'POSTED',
      });
    }
  } catch (err) {
    console.error('[AUTO-JOURNAL] Failed to create purchase journal:', err.message);
  }
  return null;
};

export const createAutomatedServiceJournal = async (repairTicket, amountPaid, paymentMethod = 'CASH', createdBy = 'system') => {
  try {
    const tenantId = repairTicket.tenantId || repairTicket.tenant_id || null;
    const branchId = repairTicket.branchId || repairTicket.branch_id || null;
    const ticketNumber = repairTicket.ticketNumber || repairTicket.ticket_number || 'RPR';
    const amt = Number(amountPaid || 0);
    if (amt <= 0) return null;

    const ref = `RPR-${repairTicket.id || repairTicket._id}-${Date.now().toString(36).toUpperCase()}`;

    await seedDefaultAccounts(tenantId);
    const acctsQuery = db('accounts').where({ is_deleted: false });
    applyTenantScope(acctsQuery, tenantId, 'accounts');
    const accounts = await acctsQuery;
    const acctMap = {};
    for (const a of accounts) acctMap[a.code] = a;

    const method = String(paymentMethod).toLowerCase();
    let debitAcct = acctMap['1000'];
    if (method.includes('bank') && acctMap['1010']) debitAcct = acctMap['1010'];
    else if (method.includes('bkash') && acctMap['1011']) debitAcct = acctMap['1011'];
    else if (method.includes('nagad') && acctMap['1012']) debitAcct = acctMap['1012'];
    else if (method.includes('rocket') && acctMap['1013']) debitAcct = acctMap['1013'];

    const revAcct = acctMap['4000'];

    if (debitAcct && revAcct) {
      return await createJournalEntry({
        tenantId,
        branchId,
        date: new Date(),
        description: `Repair Service Revenue #${ticketNumber} (${repairTicket.deviceModel || 'Gadget Repair'})`,
        reference: ref,
        lines: [
          { accountId: debitAcct.id, code: debitAcct.code, accountName: debitAcct.name, debit: amt, credit: 0 },
          { accountId: revAcct.id, code: revAcct.code, accountName: revAcct.name, debit: 0, credit: amt },
        ],
        // Bug #10 fixed: Changed DRAFT → POSTED so repair revenue actually appears in the ledger.
        status: 'POSTED',
      });
    }
  } catch (err) {
    console.error('[AUTO-JOURNAL] Failed to create repair service journal:', err.message);
  }
  return null;
};

export const getCashFlowStatement = async (from = '', to = '', tenantId = null, branchId = null) => {
  const fromDate = from ? new Date(from + 'T00:00:00') : new Date(new Date().setDate(1));
  const toDate = to ? new Date(to + 'T23:59:59') : new Date();

  // Operating Activities - cash from sales, expenses, due collections, repair services
  const salesQuery = db('transactions')
    .where({ tx_type: 'SALE', is_deleted: false, status: 'COMPLETED' })
    .whereBetween('created_at', [fromDate, toDate]);
  applyTenantScope(salesQuery, tenantId, 'transactions');
  if (branchId && branchId !== 'all') salesQuery.andWhere((b) => b.where('branch_id', branchId).orWhereNull('branch_id'));

  const salesRows = await salesQuery.select('payment_breakdown', 'returned_amount', 'net_total', 'created_at');
  let cashFromSales = 0;
  let creditSales = 0;
  for (const s of salesRows) {
    const pb = typeof s.payment_breakdown === 'string' ? (() => { try { return JSON.parse(s.payment_breakdown); } catch { return {}; } })() : (s.payment_breakdown || {});
    const netTotal = Number(s.net_total || 0);
    const returned = Number(s.returned_amount || 0);
    const cashPaid = (Number(pb.cash || 0) + Number(pb.bank || 0) + Number(pb.bkash || 0) + Number(pb.nagad || 0) + Number(pb.rocket || 0));
    cashFromSales += Math.max(0, cashPaid - returned);
    const dueAmt = Number(pb.dueAmount || 0);
    if (dueAmt > 0) creditSales += dueAmt;
  }

  // Due collections
  const dueQuery = db('transactions')
    .where({ tx_type: 'SALE', is_deleted: false })
    .whereBetween('created_at', [fromDate, toDate]);
  applyTenantScope(dueQuery, tenantId, 'transactions');
  if (branchId && branchId !== 'all') dueQuery.andWhere((b) => b.where('branch_id', branchId).orWhereNull('branch_id'));
  const dueRows = await dueQuery.select('payment_breakdown', 'created_at');
  let dueCollected = 0;
  for (const d of dueRows) {
    const pb = typeof d.payment_breakdown === 'string' ? (() => { try { return JSON.parse(d.payment_breakdown); } catch { return {}; } })() : (d.payment_breakdown || {});
    dueCollected += Number(pb.dueCollected || 0);
  }

  // Bug #23 fixed: Removed direct repair_tickets query that was double-counting repair income.
  // Repair service revenue is already captured in POSTED journal entries (RPR- references).
  // Using journal entries as the single source of truth prevents double-counting.
  let repairIncome = 0;
  try {
    const repairJeQuery = db('journal_entries')
      .where({ is_deleted: false, status: 'POSTED' })
      .where('reference', 'like', 'RPR-%')
      .whereBetween('created_at', [fromDate, toDate]);
    applyTenantScope(repairJeQuery, tenantId, 'journal_entries');
    if (branchId && branchId !== 'all') repairJeQuery.andWhere((b) => b.where('branch_id', branchId).orWhereNull('branch_id'));
    const repairJeRows = await repairJeQuery.select('total_credit', 'total_debit');
    for (const rj of repairJeRows) {
      repairIncome += Number(rj.total_credit || 0);
    }
  } catch (err) {
    // Non-blocking if journal_entries not available
  }

  // Expenses paid
  const expenseQuery = db('expenses')
    .where({ is_deleted: false })
    .whereBetween('created_at', [fromDate, toDate]);
  applyTenantScope(expenseQuery, tenantId, 'expenses');
  if (branchId && branchId !== 'all') expenseQuery.andWhere('branch_id', branchId);
  const expenseRows = await expenseQuery.select('amount', 'payment_method', 'category', 'created_at');
  let totalExpensesPaid = 0;
  const expensesByCategory = {};
  for (const e of expenseRows) {
    const amt = Number(e.amount || 0);
    totalExpensesPaid += amt;
    expensesByCategory[e.category || 'Other'] = (expensesByCategory[e.category || 'Other'] || 0) + amt;
  }

  // Payroll paid
  let payrollPaid = 0;
  try {
    const payrollQuery = db('payrolls')
      .where('is_deleted', false)
      .whereIn('status', ['paid', 'PAID']);
    applyTenantScope(payrollQuery, tenantId, 'payrolls');
    if (branchId && branchId !== 'all') payrollQuery.andWhere('branch_id', branchId);
    if (fromDate && toDate) {
      payrollQuery.where((b) => {
        b.whereBetween('paid_date', [fromDate, toDate]).orWhereBetween('created_at', [fromDate, toDate]);
      });
    }
    const payrollRows = await payrollQuery.select('net_salary');
    for (const p of payrollRows) payrollPaid += Number(p.net_salary || 0);
  } catch (err) {
    // Non-blocking fallback
  }

  // Supplier payments for stock purchase orders
  let supplierPayments = 0;
  try {
    const poQuery = db('purchase_orders')
      .where({ is_deleted: false })
      .whereBetween('created_at', [fromDate, toDate]);
    applyTenantScope(poQuery, tenantId, 'purchase_orders');
    if (branchId && branchId !== 'all') poQuery.andWhere('branch_id', branchId);
    const poRows = await poQuery.select('paid_amount');
    for (const po of poRows) {
      supplierPayments += Number(po.paid_amount || 0);
    }
  } catch (err) {
    // Non-blocking fallback
  }

  // Investing Activities - asset purchases
  const assetQuery = db('accounts')
    .where({ type: 'ASSET', is_deleted: false })
    .where('code', 'LIKE', 'AST-%')
    .whereBetween('created_at', [fromDate, toDate]);
  applyTenantScope(assetQuery, tenantId, 'accounts');
  const assetRows = await assetQuery.select('balance', 'created_at', 'name');
  let assetPurchases = 0;
  const assetList = [];
  for (const a of assetRows) {
    const cost = Number(a.balance || 0);
    assetPurchases += cost;
    assetList.push({ name: a.name, amount: cost });
  }

  // Financing Activities - investor deposits/withdrawals, loan disbursements/repayments
  const investorQuery = db('investor_transactions')
    .whereBetween('created_at', [fromDate, toDate]);
  applyTenantScope(investorQuery, tenantId, 'investor_transactions');
  const investorRows = await investorQuery.select('type', 'amount', 'created_at');
  let investorDeposits = 0;
  let investorWithdrawals = 0;
  for (const inv of investorRows) {
    if (['DEPOSIT', 'PROFIT_REINVESTMENT'].includes(inv.type)) investorDeposits += Number(inv.amount || 0);
    else investorWithdrawals += Number(inv.amount || 0);
  }

  // Loan disbursements and repayments
  const loanQuery = db('loans')
    .where({ is_deleted: false })
    .whereBetween('created_at', [fromDate, toDate]);
  applyTenantScope(loanQuery, tenantId, 'loans');
  const loanRows = await loanQuery.select('type', 'loan_amount', 'created_at');
  let loanDisbursed = 0;
  for (const l of loanRows) {
    if (l.type === 'LOAN_TAKEN') loanDisbursed += Number(l.loan_amount || 0);
  }

  // Summarize
  const totalOperatingIn = cashFromSales + dueCollected + repairIncome;
  const totalOperatingOut = totalExpensesPaid + payrollPaid + supplierPayments;
  const netOperatingCash = totalOperatingIn - totalOperatingOut;

  const totalInvestingIn = 0;
  const totalInvestingOut = assetPurchases;
  const netInvestingCash = totalInvestingIn - totalInvestingOut;

  const totalFinancingIn = investorDeposits + loanDisbursed;
  const totalFinancingOut = investorWithdrawals;
  const netFinancingCash = totalFinancingIn - totalFinancingOut;

  const netCashChange = netOperatingCash + netInvestingCash + netFinancingCash;

  return {
    period: { from: fromDate, to: toDate },
    operating: {
      inflows: {
        sales: cashFromSales,
        dueCollections: dueCollected,
        repairServices: repairIncome,
        total: totalOperatingIn,
      },
      outflows: {
        expenses: totalExpensesPaid,
        payroll: payrollPaid,
        supplierPayments,
        total: totalOperatingOut,
      },
      netCashFlow: netOperatingCash,
      expensesByCategory,
    },
    investing: {
      inflows: { total: totalInvestingIn },
      outflows: {
        assetPurchases,
        assets: assetList,
        total: totalInvestingOut,
      },
      netCashFlow: netInvestingCash,
    },
    financing: {
      inflows: {
        investorDeposits,
        loanDisbursements: loanDisbursed,
        total: totalFinancingIn,
      },
      outflows: {
        investorWithdrawals,
        total: totalFinancingOut,
      },
      netCashFlow: netFinancingCash,
    },
    summary: {
      operating: netOperatingCash,
      investing: netInvestingCash,
      financing: netFinancingCash,
      netChangeInCash: netCashChange,
    },
    netCashChange,
    isPositive: netCashChange >= 0,
  };
};
