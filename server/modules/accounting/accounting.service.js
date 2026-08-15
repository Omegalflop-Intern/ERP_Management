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

async function applyLinesToAccounts(lines = [], reverse = false, tenantId = null) {
  if (!Array.isArray(lines) || lines.length === 0) return;
  for (const line of lines) {
    const debit = Number(line.debit || 0);
    const credit = Number(line.credit || 0);
    if (debit === 0 && credit === 0) continue;

    let account = null;
    if (line.accountId) {
      account = await db('accounts').where({ id: line.accountId }).first();
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
  const totalDebit = (data.lines || []).reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = (data.lines || []).reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

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
    status: data.status || 'POSTED',
    posted_by: data.postedBy || 'system',
    is_deleted: false,
  });

  if ((data.status || 'POSTED') === 'POSTED') {
    await applyLinesToAccounts(data.lines, false, tenantId);
  }

  return getJournalEntryById(insertedId, tenantId);
};

export const postJournalEntry = async (id, postedBy = 'system', tenantId = null) => {
  const entry = await getJournalEntryById(id, tenantId);
  if (!entry) throw ApiError.notFound('Journal entry not found');

  if (entry.status !== 'POSTED') {
    const jePost = db('journal_entries').where({ id });
    if (tenantId) jePost.andWhere('tenant_id', tenantId);
    await jePost.update({ status: 'POSTED', posted_by: postedBy });
    await applyLinesToAccounts(parseJSON(entry.lines), false, tenantId);
  }
  return getJournalEntryById(id, tenantId);
};

export const voidJournalEntry = async (id, voidedBy = 'system', tenantId = null) => {
  const entry = await getJournalEntryById(id, tenantId);
  if (!entry) throw ApiError.notFound('Journal entry not found');

  if (entry.status === 'POSTED') {
    await applyLinesToAccounts(parseJSON(entry.lines), true, tenantId);
  }

  const jeVoid = db('journal_entries').where({ id });
  if (tenantId) jeVoid.andWhere('tenant_id', tenantId);
  await jeVoid.update({ status: 'VOID', voided_by: voidedBy, voided_at: new Date() });
  return getJournalEntryById(id, tenantId);
};

export const deleteJournalEntry = async (id, tenantId = null) => {
  const entry = await getJournalEntryById(id, tenantId);
  if (!entry) throw ApiError.notFound('Journal entry not found');

  if (entry.status === 'POSTED') {
    await applyLinesToAccounts(parseJSON(entry.lines), true, tenantId);
  }

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
  // 1. Fetch completed sales transactions
  const revQuery = db('transactions')
    .where({ tx_type: 'SALE', is_deleted: false, status: 'COMPLETED' });
  applyTenantScope(revQuery, tenantId, 'transactions');
  if (branchId && branchId !== 'all') revQuery.where('branch_id', branchId);
  if (from) revQuery.where('created_at', '>=', new Date(from + 'T00:00:00'));
  if (to) revQuery.where('created_at', '<=', new Date(to + 'T23:59:59'));

  const salesRows = await revQuery.select(
    'id', 'invoice_number', 'sub_total', 'discount', 'tax', 'net_total',
    'returned_amount', 'line_items', 'created_at'
  );

  let totalSalesRevenue = 0;
  let totalCogs = 0;
  let totalDiscounts = 0;
  let totalReturns = 0;

  // Cache products cost price for fallback
  const allProducts = await db('products')
    .where('is_deleted', false)
    .select('id', 'cost_price', 'selling_price');
  const productCostMap = {};
  for (const p of allProducts) {
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
  if (from) expQuery.where('created_at', '>=', new Date(from + 'T00:00:00'));
  if (to) expQuery.where('created_at', '<=', new Date(to + 'T23:59:59'));

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
    if (from) payQuery.where('created_at', '>=', new Date(from + 'T00:00:00'));
    if (to) payQuery.where('created_at', '<=', new Date(to + 'T23:59:59'));

    const payRows = await payQuery.sum({ total: 'net_salary' }).first();
    const payrollTotal = Number(payRows?.total || 0);
    if (payrollTotal > 0) {
      totalExpenses += payrollTotal;
      byCategory['Staff Salaries & Payroll'] = (byCategory['Staff Salaries & Payroll'] || 0) + payrollTotal;
    }
  } catch (err) {
    // Non-blocking if payrolls table not yet queried
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

  for (const acct of allAccounts) {
    await db('accounts').where({ id: acct.id }).update({ balance: 0 });
  }

  const jeQuery = db('journal_entries').where({ is_deleted: false, status: 'POSTED' });
  applyTenantScope(jeQuery, tenantId, 'journal_entries');
  const postedEntries = await jeQuery;

  for (const entry of postedEntries) {
    const lines = parseJSON(entry.lines);
    await applyLinesToAccounts(lines, false, tenantId);
  }
};

export const getTrialBalance = async (tenantId = null) => {
  await seedDefaultAccounts(tenantId);

  // Sync any unsynced assets, sales, or expenses to ensure books are fully balanced
  try {
    await syncHistoricalJournals(tenantId);
  } catch (e) {
    console.error('[TrialBalance Sync Error]:', e.message);
  }

  const query = db('accounts').where({ is_deleted: false, is_active: true });
  applyTenantScope(query, tenantId, 'accounts');
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
    const ref = `EXP-${expense.id}`;
    const existing = await db('journal_entries').where({ reference: ref, is_deleted: false }).first();
    if (existing) return existing;

    await seedDefaultAccounts(tenantId);
    const acctsQuery = db('accounts').where({ is_deleted: false });
    applyTenantScope(acctsQuery, tenantId, 'accounts');
    const accounts = await acctsQuery;
    const acctMap = {};
    for (const a of accounts) acctMap[a.code] = a;

    const amt = Number(expense.amount || 0);
    const method = String(expense.payment_method || expense.paymentMethod || 'cash').toLowerCase();
    let creditAcct = acctMap['1000'];
    if (method.includes('bank') && acctMap['1010']) creditAcct = acctMap['1010'];
    else if (method.includes('bkash') && acctMap['1011']) creditAcct = acctMap['1011'];
    else if (method.includes('nagad') && acctMap['1012']) creditAcct = acctMap['1012'];
    else if (method.includes('rocket') && acctMap['1013']) creditAcct = acctMap['1013'];

    const expenseAcct = acctMap['6000'];
    if (expenseAcct && creditAcct && amt > 0) {
      return await createJournalEntry({
        tenantId,
        date: expense.created_at || new Date(),
        description: `Expense: ${expense.title || expense.category} (${expense.category})`,
        reference: ref,
        lines: [
          { accountId: expenseAcct.id, code: expenseAcct.code, accountName: expenseAcct.name, debit: amt, credit: 0 },
          { accountId: creditAcct.id, code: creditAcct.code, accountName: creditAcct.name, debit: 0, credit: amt },
        ],
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
        await createJournalEntry({
          tenantId: exp.tenant_id || tenantId,
          date: exp.created_at,
          description: `Expense: ${exp.title || exp.category} (${exp.category})`,
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

  await recalculateAllAccountBalances(tenantId);
  return { message: `Successfully synced ${syncedCount} journal entries into ledger`, syncedCount };
};

export const createAutomatedReturnJournal = async (sale, refundAmount, returnInvoiceNumber, opts = {}) => {};
export const createAutomatedPurchaseReturnJournal = async (purchaseOrder, refundAmount) => {};
export const createAutomatedPurchaseJournal = async (purchaseOrder, grnEntries = []) => {};
