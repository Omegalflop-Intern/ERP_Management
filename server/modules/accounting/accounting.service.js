import { Account } from './account.model.js';
import { JournalEntry } from './journalEntry.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

const generateEntryNumber = async (tenantId = null) => {
  const prefix = 'JE-';
  const base = prefix + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const query = { entryNumber: base };
  if (tenantId) query.tenantId = tenantId;
  const existing = await JournalEntry.findOne(query);
  if (!existing) return base;
  return prefix + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const getAllAccounts = async (page = 1, limit = 100, search = '', type = '', tenantId = null) => {
  const query = { isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  if (type && type !== 'ALL') query.type = type;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await Account.countDocuments(query);
  const accounts = await paginate(Account.find(query).populate('parentId', 'code name'), page, limit).sort({ code: 1 });
  return { accounts, pagination: getPagination(total, page, limit) };
};

export const getAccountById = async (id, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const account = await Account.findOne(query).populate('parentId', 'code name');
  if (!account) throw ApiError.notFound('Account not found');
  return account;
};

export const createAccount = async (data) => {
  const duplicateQuery = { code: data.code, isDeleted: false };
  if (data.tenantId) duplicateQuery.tenantId = data.tenantId;
  const existing = await Account.findOne(duplicateQuery);
  if (existing) throw ApiError.conflict('Account code already exists');
  if (data.parentId) {
    const parent = await Account.findOne({ _id: data.parentId, isDeleted: false });
    if (!parent) throw ApiError.notFound('Parent account not found');
  }
  return Account.create(data);
};

export const updateAccount = async (id, data, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const account = await Account.findOne(query);
  if (!account) throw ApiError.notFound('Account not found');
  Object.assign(account, data);
  await account.save();
  return account;
};

export const deleteAccount = async (id, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const account = await Account.findOne(query);
  if (!account) throw ApiError.notFound('Account not found');
  const hasEntries = await JournalEntry.findOne({ 'lines.accountId': id, isDeleted: false, status: 'POSTED' });
  if (hasEntries) throw ApiError.badRequest('Cannot delete account with posted journal entries');
  account.isDeleted = true;
  await account.save();
  return account;
};

export const seedDefaultAccounts = async () => {
  const defaults = [
    { code: '1000', name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Cash on hand' },
    { code: '1010', name: 'Bank Account', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Bank account balance' },
    { code: '1020', name: 'Accounts Receivable', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Money owed by customers' },
    { code: '1030', name: 'Inventory', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Product inventory value' },
    { code: '1040', name: 'Prepaid Expenses', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Prepaid rent, insurance, etc.' },
    { code: '1500', name: 'Equipment', type: 'ASSET', subType: 'FIXED_ASSET', description: 'Office equipment' },
    { code: '1510', name: 'Accumulated Depreciation', type: 'ASSET', subType: 'FIXED_ASSET', description: 'Depreciation on equipment' },

    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', subType: 'CURRENT_LIABILITY', description: 'Money owed to suppliers' },
    { code: '2010', name: 'Sales Tax Payable', type: 'LIABILITY', subType: 'CURRENT_LIABILITY', description: 'VAT/GST collected' },
    { code: '2020', name: 'Salaries Payable', type: 'LIABILITY', subType: 'CURRENT_LIABILITY', description: 'Accrued salaries' },
    { code: '2030', name: 'Due to Suppliers', type: 'LIABILITY', subType: 'CURRENT_LIABILITY', description: 'Pending supplier payments' },
    { code: '2500', name: 'Long-term Loan', type: 'LIABILITY', subType: 'LONG_TERM_LIABILITY', description: 'Bank loans' },

    { code: '3000', name: 'Owner\'s Capital', type: 'EQUITY', subType: 'OWNERS_EQUITY', description: 'Owner investment' },
    { code: '3100', name: 'Retained Earnings', type: 'EQUITY', subType: 'RETAINED_EARNINGS', description: 'Accumulated profit/loss' },

    { code: '4000', name: 'Sales Revenue', type: 'REVENUE', subType: 'SALES_REVENUE', description: 'Revenue from product sales' },
    { code: '4100', name: 'Service Revenue', type: 'REVENUE', subType: 'OTHER_REVENUE', description: 'Revenue from services (repair)' },
    { code: '4200', name: 'Interest Income', type: 'REVENUE', subType: 'OTHER_REVENUE', description: 'Bank interest earned' },

    { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', subType: 'COST_OF_GOODS', description: 'Cost of products sold' },
    { code: '6000', name: 'Rent Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', description: 'Shop rent' },
    { code: '6010', name: 'Salary Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', description: 'Employee salaries' },
    { code: '6020', name: 'Utilities Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', description: 'Electricity, internet, etc.' },
    { code: '6030', name: 'Office Supplies', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', description: 'Stationery, printer ink' },
    { code: '6040', name: 'Marketing Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', description: 'Ads, promotions' },
    { code: '6050', name: 'Depreciation Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', description: 'Equipment depreciation' },
    { code: '7000', name: 'Miscellaneous Expense', type: 'EXPENSE', subType: 'OTHER_EXPENSE', description: 'Other expenses' },
  ];

  let count = 0;
  for (const def of defaults) {
    const existing = await Account.findOne({ code: def.code });
    if (!existing) {
      await Account.create(def);
      count++;
    } else if (existing.isDeleted) {
      existing.isDeleted = false;
      await existing.save();
      count++;
    }
  }

  return { message: 'Default accounts seeded', count };
};

// ─── Journal Entries ───────────────────────────────────────────

export const getAllJournalEntries = async (page = 1, limit = 20, search = '', status = '', from = '', to = '', tenantId = null) => {
  const query = { isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  if (status && status !== 'ALL') query.status = status;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to + 'T23:59:59.999Z');
  }
  if (search) {
    query.$or = [
      { entryNumber: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { reference: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await JournalEntry.countDocuments(query);
  const entries = await paginate(
    JournalEntry.find(query).populate('lines.accountId', 'code name type'),
    page, limit
  ).sort({ date: -1, createdAt: -1 });
  return { entries, pagination: getPagination(total, page, limit) };
};

export const getJournalEntryById = async (id, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const entry = await JournalEntry.findOne(query).populate('lines.accountId', 'code name type subType');
  if (!entry) throw ApiError.notFound('Journal entry not found');
  return entry;
};

export const createJournalEntry = async (data) => {
  const totalDebit = data.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = data.lines.reduce((sum, l) => sum + (l.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw ApiError.badRequest('Total debits must equal total credits');
  }
  if (totalDebit <= 0) {
    throw ApiError.badRequest('Total must be greater than 0');
  }
  if (data.lines.length < 2) {
    throw ApiError.badRequest('At least 2 lines required');
  }

  for (const line of data.lines) {
    const account = await Account.findOne({ _id: line.accountId, isDeleted: false });
    if (!account) throw ApiError.badRequest(`Account not found: ${line.accountId}`);
  }

  return JournalEntry.create({
    entryNumber: generateEntryNumber(),
    tenantId: data.tenantId || null,
    date: data.date ? new Date(data.date) : new Date(),
    description: data.description,
    reference: data.reference,
    lines: data.lines,
    totalDebit,
    totalCredit,
    status: 'DRAFT',
  });
};

export const postJournalEntry = async (id, postedBy = 'system', tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const entry = await JournalEntry.findOne(query);
  if (!entry) throw ApiError.notFound('Journal entry not found');
  if (entry.status !== 'DRAFT') throw ApiError.badRequest('Only draft entries can be posted');

  for (const line of entry.lines) {
    const account = await Account.findOne({ _id: line.accountId, isDeleted: false });
    if (!account) throw ApiError.badRequest(`Account not found: ${line.accountId}`);
    const isDebitSide = account.type === 'ASSET' || account.type === 'EXPENSE';
    if (isDebitSide) {
      await Account.updateOne({ _id: line.accountId }, { $inc: { balance: (line.debit || 0) - (line.credit || 0) } });
    } else {
      await Account.updateOne({ _id: line.accountId }, { $inc: { balance: (line.credit || 0) - (line.debit || 0) } });
    }
  }

  entry.status = 'POSTED';
  entry.postedBy = postedBy;
  await entry.save();
  return entry;
};

export const voidJournalEntry = async (id, voidedBy = 'system', tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const entry = await JournalEntry.findOne(query);
  if (!entry) throw ApiError.notFound('Journal entry not found');
  if (entry.status !== 'POSTED') throw ApiError.badRequest('Only posted entries can be voided');

  for (const line of entry.lines) {
    const account = await Account.findOne({ _id: line.accountId, isDeleted: false });
    if (account) {
      const isDebitSide = account.type === 'ASSET' || account.type === 'EXPENSE';
      if (isDebitSide) {
        await Account.updateOne({ _id: line.accountId }, { $inc: { balance: -((line.debit || 0) - (line.credit || 0)) } });
      } else {
        await Account.updateOne({ _id: line.accountId }, { $inc: { balance: -((line.credit || 0) - (line.debit || 0)) } });
      }
    }
  }

  entry.status = 'VOID';
  entry.voidedBy = voidedBy;
  entry.voidedAt = new Date();
  await entry.save();
  return entry;
};

export const deleteJournalEntry = async (id, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const entry = await JournalEntry.findOne(query);
  if (!entry) throw ApiError.notFound('Journal entry not found');
  if (entry.status === 'POSTED') throw ApiError.badRequest('Cannot delete posted entries. Void them first.');
  entry.isDeleted = true;
  await entry.save();
  return entry;
};

// ─── Financial Reports ─────────────────────────────────────────

export const getBalanceSheet = async (asOf = '', tenantId = null) => {
  const asOfDate = asOf ? new Date(asOf + 'T23:59:59.999Z') : new Date();

  const accountQuery = { isDeleted: false, isActive: true };
  if (tenantId) accountQuery.tenantId = tenantId;
  const accounts = await Account.find(accountQuery).sort({ code: 1 });

  const assetAccounts = accounts.filter((a) => a.type === 'ASSET');
  const liabilityAccounts = accounts.filter((a) => a.type === 'LIABILITY');
  const equityAccounts = accounts.filter((a) => a.type === 'EQUITY');

  const totalAssets = assetAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = equityAccounts.reduce((sum, a) => sum + a.balance, 0);

  return {
    asOf: asOfDate,
    assets: { accounts: assetAccounts, total: totalAssets },
    liabilities: { accounts: liabilityAccounts, total: totalLiabilities },
    equity: { accounts: equityAccounts, total: totalEquity },
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
  };
};

export const getProfitLoss = async (from = '', to = '', tenantId = null) => {
  const isValidDate = (d) => d && !isNaN(new Date(d).getTime());
  const toDate = isValidDate(to) ? new Date(to) : new Date();
  const fromDate = isValidDate(from) ? new Date(from) : new Date(new Date().setDate(1));

  const { Transaction } = await import('../sale/sale.model.js');
  const { Expense } = await import('../expense/expense.model.js');
  const { Product } = await import('../product/product.model.js');

  // 1. Fetch Sales Transactions in Date Range
  const saleQuery = {
    txType: 'SALE',
    isDeleted: false,
    createdAt: { $gte: fromDate, $lte: toDate },
  };
  if (tenantId) saleQuery.tenantId = tenantId;
  const sales = await Transaction.find(saleQuery).populate('lineItems.productId', 'costPrice name sellingPrice').lean();

  let totalSalesRevenue = 0;
  let totalCostOfGoodsSold = 0;

  for (const sale of sales) {
    const netSale = (sale.netTotal || 0) - (sale.returnedAmount || 0);
    totalSalesRevenue += Math.max(0, netSale);

    if (sale.lineItems && sale.lineItems.length > 0) {
      for (const item of sale.lineItems) {
        const effectiveQty = Math.max(0, (item.qty || 1) - (item.returnedQty || 0));
        if (effectiveQty > 0) {
          const itemCost = item.productId?.costPrice || (item.unitPrice ? item.unitPrice * 0.8 : 0);
          totalCostOfGoodsSold += (itemCost * effectiveQty);
        }
      }
    }
  }

  // 2. Fetch Operating Expenses in Date Range
  const expenseQuery = {
    isDeleted: false,
    date: { $gte: fromDate, $lte: toDate },
  };
  if (tenantId) expenseQuery.tenantId = tenantId;
  const expenses = await Expense.find(expenseQuery).lean();

  let totalOperatingExpenses = 0;
  const expenseByCategory = {};

  for (const exp of expenses) {
    totalOperatingExpenses += (exp.amount || 0);
    expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
  }

  // Fallback to accounts if no sales or expenses recorded in selected range
  if (sales.length === 0 && expenses.length === 0) {
    const accountQuery = { isDeleted: false, isActive: true };
    if (tenantId) accountQuery.tenantId = tenantId;
    const accounts = await Account.find(accountQuery).sort({ code: 1 });
    const revenueAccs = accounts.filter((a) => a.type === 'REVENUE');
    const expenseAccs = accounts.filter((a) => a.type === 'EXPENSE');

    totalSalesRevenue = revenueAccs.reduce((sum, a) => sum + a.balance, 0);
    totalOperatingExpenses = expenseAccs.reduce((sum, a) => sum + a.balance, 0);
  }

  const grossProfit = totalSalesRevenue - totalCostOfGoodsSold;
  const netIncome = grossProfit - totalOperatingExpenses;

  return {
    period: { from: fromDate, to: toDate },
    revenue: {
      total: totalSalesRevenue,
      salesCount: sales.length,
    },
    cogs: {
      total: totalCostOfGoodsSold,
      description: 'Product Cost Price (Kena Dam)',
    },
    grossProfit,
    expenses: {
      total: totalOperatingExpenses,
      byCategory: expenseByCategory,
      count: expenses.length,
    },
    netIncome,
    isProfit: netIncome >= 0,
  };
};

export const getTrialBalance = async (tenantId = null) => {
  await seedDefaultAccounts();

  const accountQuery = { isDeleted: false, isActive: true };
  if (tenantId) accountQuery.tenantId = tenantId;
  const accounts = await Account.find(accountQuery).sort({ code: 1 });

  const entryQuery = { status: 'POSTED', isDeleted: false };
  if (tenantId) entryQuery.tenantId = tenantId;
  const entries = await JournalEntry.find(entryQuery).lean();

  const accountBalances = {};
  for (const entry of entries) {
    for (const line of entry.lines) {
      const key = line.accountId.toString();
      if (!accountBalances[key]) {
        accountBalances[key] = { totalDebit: 0, totalCredit: 0 };
      }
      accountBalances[key].totalDebit += (line.debit || 0);
      accountBalances[key].totalCredit += (line.credit || 0);
    }
  }

  let totalDebit = 0;
  let totalCredit = 0;

  const rows = accounts.map((a) => {
    const bal = accountBalances[a._id.toString()] || { totalDebit: 0, totalCredit: 0 };
    const isDebitType = a.type === 'ASSET' || a.type === 'EXPENSE';
    let debit = 0;
    let credit = 0;

    if (isDebitType) {
      debit = Math.round(Math.max(0, bal.totalDebit - bal.totalCredit));
      credit = Math.round(Math.max(0, bal.totalCredit - bal.totalDebit));
    } else {
      debit = Math.round(Math.max(0, bal.totalCredit - bal.totalDebit));
      credit = Math.round(Math.max(0, bal.totalDebit - bal.totalCredit));
    }

    totalDebit += debit;
    totalCredit += credit;

    return {
      _id: a._id,
      code: a.code,
      name: a.name,
      type: a.type,
      subType: a.subType,
      debit,
      credit,
    };
  }).filter((r) => r.debit > 0 || r.credit > 0);

  return {
    accounts: rows,
    totalDebit,
    totalCredit,
    balanced: Math.abs(totalDebit - totalCredit) < 0.01,
  };
};

// ─── Automated Journal Entry Creators for ERP Events ──────────────────

const findOrCreateAccountByCode = async (code, fallbackData, tenantId = null) => {
  const query = { code };
  if (tenantId) query.tenantId = tenantId;
  let acc = await Account.findOne(query);
  if (!acc) {
    acc = await Account.create({ code, ...fallbackData, tenantId: tenantId || null });
  } else if (acc.isDeleted) {
    acc.isDeleted = false;
    await acc.save();
  }
  return acc;
};

export const createAutomatedSaleJournal = async (sale) => {
  try {
    const tenantId = sale.tenantId || null;
    const cashAcc = await findOrCreateAccountByCode('1000', { name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET' }, tenantId);
    const bankAcc = await findOrCreateAccountByCode('1010', { name: 'Bank Account', type: 'ASSET', subType: 'CURRENT_ASSET' }, tenantId);
    const arAcc = await findOrCreateAccountByCode('1020', { name: 'Accounts Receivable', type: 'ASSET', subType: 'CURRENT_ASSET' }, tenantId);
    const salesRevenueAcc = await findOrCreateAccountByCode('4000', { name: 'Sales Revenue', type: 'REVENUE', subType: 'SALES_REVENUE' }, tenantId);

    const cashPaid = Math.round((sale.paymentBreakdown?.cash || 0) + (sale.paymentBreakdown?.bkash || 0) + (sale.paymentBreakdown?.nagad || 0) + (sale.paymentBreakdown?.rocket || 0));
    const bankPaid = Math.round(sale.paymentBreakdown?.bank || 0);
    const dueAmount = Math.round(sale.paymentBreakdown?.dueAmount || 0);
    const totalDebit = cashPaid + bankPaid + dueAmount;

    if (totalDebit <= 0) return;

    // COGS: total cost of items sold on this invoice (minus any already-returned qty)
    const costOfGoodsSold = Math.round(
      (sale.lineItems || []).reduce((sum, li) => sum + ((li.unitCost || 0) * (li.qty - (li.returnedQty || 0))), 0)
    );
    const inventoryAcc = await findOrCreateAccountByCode('1030', { name: 'Inventory', type: 'ASSET', subType: 'CURRENT_ASSET' }, tenantId);
    const cogsAcc = await findOrCreateAccountByCode('5000', { name: 'Cost of Goods Sold', type: 'EXPENSE', subType: 'COST_OF_GOODS' }, tenantId);

    const lines = [];

    if (cashPaid > 0) {
      lines.push({ accountId: cashAcc._id, debit: cashPaid, credit: 0, description: `Cash/Mobile payment for ${sale.invoiceNumber}` });
    }
    if (bankPaid > 0) {
      lines.push({ accountId: bankAcc._id, debit: bankPaid, credit: 0, description: `Bank payment for ${sale.invoiceNumber}` });
    }
    if (dueAmount > 0) {
      lines.push({ accountId: arAcc._id, debit: dueAmount, credit: 0, description: `Customer due for ${sale.invoiceNumber}` });
    }
    // Sales revenue credit MUST equal sum of debits (totalDebit)
    lines.push({ accountId: salesRevenueAcc._id, debit: 0, credit: totalDebit, description: `Sales Revenue for ${sale.invoiceNumber}` });
    // COGS entry: move cost of sold goods out of inventory
    if (costOfGoodsSold > 0) {
      lines.push({ accountId: cogsAcc._id, debit: costOfGoodsSold, credit: 0, description: `COGS for ${sale.invoiceNumber}` });
      lines.push({ accountId: inventoryAcc._id, debit: 0, credit: costOfGoodsSold, description: `Inventory out for ${sale.invoiceNumber}` });
    }

    if (lines.length >= 2) {
      const entry = await JournalEntry.create({
        entryNumber: generateEntryNumber(),
        tenantId,
        date: new Date(sale.createdAt || Date.now()),
        description: `Automated Sale Journal for ${sale.invoiceNumber} (${sale.customerName || 'Walk-in'})`,
        reference: sale.invoiceNumber,
        lines,
        totalDebit: totalDebit + costOfGoodsSold,
        totalCredit: totalDebit + costOfGoodsSold,
        status: 'POSTED',
        postedBy: sale.sellerName || sale.cashierName || 'system',
      });

      if (cashPaid > 0) { cashAcc.balance += cashPaid; await cashAcc.save(); }
      if (bankPaid > 0) { bankAcc.balance += bankPaid; await bankAcc.save(); }
      if (dueAmount > 0) { arAcc.balance += dueAmount; await arAcc.save(); }
      salesRevenueAcc.balance += totalDebit;
      await salesRevenueAcc.save();
      if (costOfGoodsSold > 0) {
        cogsAcc.balance += costOfGoodsSold;
        inventoryAcc.balance = Math.max(0, (inventoryAcc.balance || 0) - costOfGoodsSold);
        await cogsAcc.save();
        await inventoryAcc.save();
      }

      return entry;
    }
  } catch (err) {
    console.error('Automated sale journal creation error:', err);
  }
};

export const createAutomatedReturnJournal = async (sale, refundAmount, returnInvoiceNumber, opts = {}) => {
  try {
    const refund = Math.round(refundAmount || 0);
    if (refund <= 0) return;
    const tenantId = sale.tenantId || null;
    const allocation = opts.allocation || { ar: refund, bank: 0, cash: 0 };
    const costOfReturned = Math.round(opts.costOfReturned || 0);

    const cashAcc = await findOrCreateAccountByCode('1000', { name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET' }, tenantId);
    const bankAcc = await findOrCreateAccountByCode('1010', { name: 'Bank Account', type: 'ASSET', subType: 'CURRENT_ASSET' }, tenantId);
    const arAcc = await findOrCreateAccountByCode('1020', { name: 'Accounts Receivable', type: 'ASSET', subType: 'CURRENT_ASSET' }, tenantId);
    const inventoryAcc = await findOrCreateAccountByCode('1030', { name: 'Inventory', type: 'ASSET', subType: 'CURRENT_ASSET' }, tenantId);
    const salesRevenueAcc = await findOrCreateAccountByCode('4000', { name: 'Sales Revenue', type: 'REVENUE', subType: 'SALES_REVENUE' }, tenantId);
    const cogsAcc = await findOrCreateAccountByCode('5000', { name: 'Cost of Goods Sold', type: 'EXPENSE', subType: 'COST_OF_GOODS' }, tenantId);

    const arAmount = Math.round(allocation.ar || 0);
    const bankAmount = Math.round(allocation.bank || 0);
    const cashAmount = Math.round(allocation.cash || 0);

    const lines = [
      { accountId: salesRevenueAcc._id, debit: refund, credit: 0, description: `Return deduction for ${sale.invoiceNumber} (${returnInvoiceNumber})` },
      { accountId: inventoryAcc._id, debit: costOfReturned, credit: 0, description: `Returned stock value restored for ${returnInvoiceNumber}` },
      { accountId: cogsAcc._id, debit: 0, credit: costOfReturned, description: `COGS reversal for returned items ${returnInvoiceNumber}` },
    ];
    if (arAmount > 0) {
      lines.push({ accountId: arAcc._id, debit: 0, credit: arAmount, description: `Customer due reduced for ${returnInvoiceNumber}` });
    }
    if (bankAmount > 0) {
      lines.push({ accountId: bankAcc._id, debit: 0, credit: bankAmount, description: `Bank refund for ${returnInvoiceNumber}` });
    }
    if (cashAmount > 0) {
      lines.push({ accountId: cashAcc._id, debit: 0, credit: cashAmount, description: `Cash refund to customer for ${returnInvoiceNumber}` });
    }

    const totalEntry = refund + costOfReturned;

    const entry = await JournalEntry.create({
      entryNumber: generateEntryNumber(),
      tenantId,
      date: new Date(),
      description: `Automated Return Journal for ${sale.invoiceNumber} (${returnInvoiceNumber})`,
      reference: returnInvoiceNumber || sale.invoiceNumber,
      lines,
      totalDebit: totalEntry,
      totalCredit: totalEntry,
      status: 'POSTED',
      postedBy: opts.processedBy || 'system',
    });

    salesRevenueAcc.balance = Math.max(0, (salesRevenueAcc.balance || 0) - refund);
    inventoryAcc.balance = (inventoryAcc.balance || 0) + costOfReturned;
    cogsAcc.balance = Math.max(0, (cogsAcc.balance || 0) - costOfReturned);
    if (arAmount > 0) arAcc.balance = Math.max(0, (arAcc.balance || 0) - arAmount);
    if (bankAmount > 0) bankAcc.balance = Math.max(0, (bankAcc.balance || 0) - bankAmount);
    if (cashAmount > 0) cashAcc.balance = Math.max(0, (cashAcc.balance || 0) - cashAmount);
    await salesRevenueAcc.save();
    await inventoryAcc.save();
    await cogsAcc.save();
    if (arAmount > 0) await arAcc.save();
    if (bankAmount > 0) await bankAcc.save();
    if (cashAmount > 0) await cashAcc.save();

    return entry;
  } catch (err) {
    console.error('Automated return journal creation error:', err);
  }
};

export const createAutomatedDueCollectionJournal = async (sale, collectedAmount, method = 'cash', collectedBy = 'system') => {
  try {
    const amount = Math.round(collectedAmount || 0);
    if (amount <= 0) return;
    const tenantId = sale.tenantId || null;
    const cashAcc = await findOrCreateAccountByCode('1000', { name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET' }, tenantId);
    const bankAcc = await findOrCreateAccountByCode('1010', { name: 'Bank Account', type: 'ASSET', subType: 'CURRENT_ASSET' }, tenantId);
    const arAcc = await findOrCreateAccountByCode('1020', { name: 'Accounts Receivable', type: 'ASSET', subType: 'CURRENT_ASSET' }, tenantId);

    let paymentAcc = cashAcc;
    if (method === 'bank') paymentAcc = bankAcc;

    const lines = [
      { accountId: paymentAcc._id, debit: amount, credit: 0, description: `Due collection for ${sale.invoiceNumber} (${method})` },
      { accountId: arAcc._id, debit: 0, credit: amount, description: `Customer due settled for ${sale.invoiceNumber}` },
    ];

    const entry = await JournalEntry.create({
      entryNumber: generateEntryNumber(),
      tenantId,
      date: new Date(),
      description: `Automated Due Collection Journal for ${sale.invoiceNumber}`,
      reference: sale.invoiceNumber,
      lines,
      totalDebit: amount,
      totalCredit: amount,
      status: 'POSTED',
      postedBy: collectedBy || 'system',
    });

    paymentAcc.balance = (paymentAcc.balance || 0) + amount;
    arAcc.balance = Math.max(0, (arAcc.balance || 0) - amount);
    await paymentAcc.save();
    await arAcc.save();

    return entry;
  } catch (err) {
    console.error('Automated due collection journal creation error:', err);
  }
};

export const createAutomatedPurchaseReturnJournal = async (purchaseOrder, refundAmount) => {
  try {
    const refund = Math.round(refundAmount || 0);
    if (refund <= 0) return;
    const tenantId = purchaseOrder.tenantId || null;
    const apAcc = await findOrCreateAccountByCode('2000', { name: 'Accounts Payable', type: 'LIABILITY', subType: 'CURRENT_LIABILITY' }, tenantId);
    const inventoryAcc = await findOrCreateAccountByCode('1030', { name: 'Inventory', type: 'ASSET', subType: 'CURRENT_ASSET' }, tenantId);

    const lines = [
      { accountId: apAcc._id, debit: refund, credit: 0, description: `Purchase return credit for ${purchaseOrder.poNumber}` },
      { accountId: inventoryAcc._id, debit: 0, credit: refund, description: `Returned stock for ${purchaseOrder.poNumber}` },
    ];

    const entry = await JournalEntry.create({
      entryNumber: generateEntryNumber(),
      tenantId,
      date: new Date(),
      description: `Automated Purchase Return Journal for ${purchaseOrder.poNumber}`,
      reference: purchaseOrder.poNumber,
      lines,
      totalDebit: refund,
      totalCredit: refund,
      status: 'POSTED',
      postedBy: 'system',
    });

    apAcc.balance = Math.max(0, (apAcc.balance || 0) - refund);
    inventoryAcc.balance = Math.max(0, (inventoryAcc.balance || 0) - refund);
    await apAcc.save();
    await inventoryAcc.save();

    return entry;
  } catch (err) {
    console.error('Automated purchase return journal creation error:', err);
  }
};

export const createAutomatedPurchaseJournal = async (purchaseOrder, grnEntries = []) => {
  try {
    const totalCost = Math.round((purchaseOrder.netTotal || 0) - (purchaseOrder.discount || 0) + (purchaseOrder.tax || 0));
    if (totalCost <= 0) return;
    const tenantId = purchaseOrder.tenantId || null;
    const apAcc = await findOrCreateAccountByCode('2000', { name: 'Accounts Payable', type: 'LIABILITY', subType: 'CURRENT_LIABILITY' }, tenantId);
    const inventoryAcc = await findOrCreateAccountByCode('1030', { name: 'Inventory', type: 'ASSET', subType: 'CURRENT_ASSET' }, tenantId);

    const lines = [
      { accountId: inventoryAcc._id, debit: totalCost, credit: 0, description: `Inventory received — ${purchaseOrder.poNumber}` },
      { accountId: apAcc._id, debit: 0, credit: totalCost, description: `AP created for ${purchaseOrder.poNumber}` },
    ];

    const entry = await JournalEntry.create({
      entryNumber: generateEntryNumber(),
      tenantId,
      date: new Date(purchaseOrder.receivedDate || Date.now()),
      description: `Automated Purchase Journal for ${purchaseOrder.poNumber}`,
      reference: purchaseOrder.poNumber,
      lines,
      totalDebit: totalCost,
      totalCredit: totalCost,
      status: 'POSTED',
      postedBy: 'system',
    });

    await Account.updateOne({ _id: inventoryAcc._id }, { $inc: { balance: totalCost } });
    await Account.updateOne({ _id: apAcc._id }, { $inc: { balance: totalCost } });

    return entry;
  } catch (err) {
    console.error('Automated purchase journal creation error:', err);
  }
};

export const createAutomatedExpenseJournal = async (expense) => {
  try {
    const amount = Math.round(expense.amount || 0);
    if (amount <= 0) return;
    const tenantId = expense.tenantId || null;
    const cashAcc = await findOrCreateAccountByCode('1000', { name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET' }, tenantId);
    const expenseAcc = await findOrCreateAccountByCode('6000', { name: 'Operating Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' }, tenantId);

    const lines = [
      { accountId: expenseAcc._id, debit: amount, credit: 0, description: expense.title || 'Shop Expense' },
      { accountId: cashAcc._id, debit: 0, credit: amount, description: `Payment for ${expense.title}` },
    ];

    const entry = await JournalEntry.create({
      entryNumber: generateEntryNumber(),
      tenantId,
      date: new Date(expense.date || Date.now()),
      description: `Automated Expense Journal: ${expense.title || 'Expense'}`,
      reference: expense.voucherNumber || 'EXPENSE',
      lines,
      totalDebit: amount,
      totalCredit: amount,
      status: 'POSTED',
      postedBy: 'system',
    });

    expenseAcc.balance += amount;
    cashAcc.balance = Math.max(0, cashAcc.balance - amount);
    await expenseAcc.save();
    await cashAcc.save();

    return entry;
  } catch (err) {
    console.error('Automated expense journal creation error:', err);
  }
};

export const syncHistoricalJournals = async () => {
  await seedDefaultAccounts();

  const { Transaction } = await import('../sale/sale.model.js');
  const { Expense } = await import('../expense/expense.model.js');

  let syncedCount = 0;

  const sales = await Transaction.find({ txType: 'SALE', isDeleted: false });
  for (const sale of sales) {
    try {
      const existing = await JournalEntry.findOne({ reference: sale.invoiceNumber, isDeleted: false, ...(sale.tenantId ? { tenantId: sale.tenantId } : {}) });
      if (!existing) {
        const created = await createAutomatedSaleJournal(sale);
        if (created) syncedCount++;
      }

      if (sale.returnLogs && sale.returnLogs.length > 0) {
        for (const retLog of sale.returnLogs) {
          const retRef = retLog.returnInvoiceNumber || sale.invoiceNumber;
          const existingRet = await JournalEntry.findOne({ reference: retRef, description: { $regex: 'Return Journal', $options: 'i' }, isDeleted: false, ...(sale.tenantId ? { tenantId: sale.tenantId } : {}) });
          if (!existingRet) {
            const retCreated = await createAutomatedReturnJournal(sale, retLog.refundAmount, retLog.returnInvoiceNumber);
            if (retCreated) syncedCount++;
          }
        }
      }
    } catch (err) {
      console.error(`Sync error on sale ${sale.invoiceNumber}:`, err);
    }
  }

  const expenses = await Expense.find({ isDeleted: false });
  for (const exp of expenses) {
    try {
      const refKey = exp.voucherNumber || exp._id.toString();
      const existingExp = await JournalEntry.findOne({ reference: refKey, isDeleted: false, ...(exp.tenantId ? { tenantId: exp.tenantId } : {}) });
      if (!existingExp) {
        const expCreated = await createAutomatedExpenseJournal(exp);
        if (expCreated) syncedCount++;
      }
    } catch (err) {
      console.error(`Sync error on expense ${exp.title}:`, err);
    }
  }

  return { message: `Successfully synced ${syncedCount} historical transactions into Journal Entries`, syncedCount };
};

export const createAutomatedPayrollJournal = async (payroll, tenantId = null) => {
  try {
    const amount = Math.round(payroll.netSalary || 0);
    if (amount <= 0) return;
    const tId = tenantId || payroll.tenantId || null;
    const cashAcc = await findOrCreateAccountByCode('1000', { name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET' }, tId);
    const salaryExpAcc = await findOrCreateAccountByCode('6010', { name: 'Salary Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' }, tId);

    const lines = [
      { accountId: salaryExpAcc._id, debit: amount, credit: 0, description: `Salary for ${payroll.month}/${payroll.year} — emp ${payroll.employee}` },
      { accountId: cashAcc._id, debit: 0, credit: amount, description: `Salary paid for ${payroll.month}/${payroll.year}` },
    ];

    const entry = await JournalEntry.create({
      entryNumber: generateEntryNumber(),
      tenantId: tId,
      date: new Date(),
      description: `Payroll Journal ${payroll.month}/${payroll.year}`,
      reference: `PAYROLL-${payroll._id}`,
      lines,
      totalDebit: amount,
      totalCredit: amount,
      status: 'POSTED',
      postedBy: payroll.paidBy || 'system',
    });

    await Account.updateOne({ _id: salaryExpAcc._id }, { $inc: { balance: amount } });
    await Account.updateOne({ _id: cashAcc._id }, { $inc: { balance: -amount } });

    return entry;
  } catch (err) {
    console.error('Automated payroll journal creation error:', err);
  }
};

export const createAutomatedWholesaleJournal = async (order, tenantId = null) => {
  try {
    const total = Math.round(order.grandTotal || 0);
    if (total <= 0) return;
    const tId = tenantId || order.tenantId || null;
    const arAcc = await findOrCreateAccountByCode('1020', { name: 'Accounts Receivable', type: 'ASSET', subType: 'CURRENT_ASSET' }, tId);
    const revenueAcc = await findOrCreateAccountByCode('4000', { name: 'Sales Revenue', type: 'REVENUE', subType: 'SALES_REVENUE' }, tId);

    const lines = [
      { accountId: arAcc._id, debit: total, credit: 0, description: `Wholesale order ${order.orderNumber}` },
      { accountId: revenueAcc._id, debit: 0, credit: total, description: `Wholesale revenue ${order.orderNumber}` },
    ];

    const entry = await JournalEntry.create({
      entryNumber: generateEntryNumber(),
      tenantId: tId,
      date: new Date(),
      description: `Wholesale Journal ${order.orderNumber}`,
      reference: order.orderNumber,
      lines,
      totalDebit: total,
      totalCredit: total,
      status: 'POSTED',
      postedBy: order.createdBy || 'system',
    });

    await Account.updateOne({ _id: arAcc._id }, { $inc: { balance: total } });
    await Account.updateOne({ _id: revenueAcc._id }, { $inc: { balance: total } });

    return entry;
  } catch (err) {
    console.error('Automated wholesale journal creation error:', err);
  }
};

export const createAutomatedRepairJournal = async (ticket, tenantId = null) => {
  try {
    const amount = Math.round(ticket.estimatedCost || 0);
    if (amount <= 0) return;
    const tId = tenantId || ticket.tenantId || null;
    const arAcc = await findOrCreateAccountByCode('1020', { name: 'Accounts Receivable', type: 'ASSET', subType: 'CURRENT_ASSET' }, tId);
    const serviceRevenueAcc = await findOrCreateAccountByCode('4100', { name: 'Service Revenue', type: 'REVENUE', subType: 'OTHER_REVENUE' }, tId);

    const lines = [
      { accountId: arAcc._id, debit: amount, credit: 0, description: `Repair ticket ${ticket.ticketNumber}` },
      { accountId: serviceRevenueAcc._id, debit: 0, credit: amount, description: `Repair revenue ${ticket.ticketNumber}` },
    ];

    const entry = await JournalEntry.create({
      entryNumber: generateEntryNumber(),
      tenantId: tId,
      date: new Date(),
      description: `Repair Journal ${ticket.ticketNumber}`,
      reference: ticket.ticketNumber,
      lines,
      totalDebit: amount,
      totalCredit: amount,
      status: 'POSTED',
      postedBy: 'system',
    });

    await Account.updateOne({ _id: arAcc._id }, { $inc: { balance: amount } });
    await Account.updateOne({ _id: serviceRevenueAcc._id }, { $inc: { balance: amount } });

    return entry;
  } catch (err) {
    console.error('Automated repair journal creation error:', err);
  }
};

export const createAutomatedInvestorJournal = async (investor, txType, amount, tenantId = null) => {
  try {
    const amt = Math.round(amount || 0);
    if (amt <= 0) return;
    const tId = tenantId || investor.tenantId || null;
    const cashAcc = await findOrCreateAccountByCode('1000', { name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET' }, tId);
    const capitalAcc = await findOrCreateAccountByCode('3000', { name: "Owner's Capital", type: 'EQUITY', subType: 'OWNERS_EQUITY' }, tId);

    const isDebitToCash = txType === 'WITHDRAWAL' || txType === 'PROFIT_PAYOUT';
    const lines = isDebitToCash
      ? [
          { accountId: cashAcc._id, debit: amt, credit: 0, description: `${txType} — ${investor.name}` },
          { accountId: capitalAcc._id, debit: 0, credit: amt, description: `${txType} capital — ${investor.name}` },
        ]
      : [
          { accountId: cashAcc._id, debit: 0, credit: amt, description: `${txType} — ${investor.name}` },
          { accountId: capitalAcc._id, debit: amt, credit: 0, description: `${txType} capital — ${investor.name}` },
        ];

    const entry = await JournalEntry.create({
      entryNumber: generateEntryNumber(),
      tenantId: tId,
      date: new Date(),
      description: `Investor Journal ${txType} — ${investor.name}`,
      reference: investor._id.toString(),
      lines,
      totalDebit: amt,
      totalCredit: amt,
      status: 'POSTED',
      postedBy: 'system',
    });

    await Account.updateOne({ _id: cashAcc._id }, { $inc: { balance: isDebitToCash ? amt : -amt } });
    await Account.updateOne({ _id: capitalAcc._id }, { $inc: { balance: isDebitToCash ? -amt : amt } });

    return entry;
  } catch (err) {
    console.error('Automated investor journal creation error:', err);
  }
};

export const createAutomatedLoanJournal = async (loan, txType, amount, tenantId = null) => {
  try {
    const amt = Math.round(amount || 0);
    if (amt <= 0) return;
    const tId = tenantId || loan.tenantId || null;
    const cashAcc = await findOrCreateAccountByCode('1000', { name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET' }, tId);
    const loanAcc = await findOrCreateAccountByCode('2500', { name: 'Long-term Loan', type: 'LIABILITY', subType: 'LONG_TERM_LIABILITY' }, tId);

    const isNewLoan = txType === 'LOAN_TAKEN';
    const lines = isNewLoan
      ? [
          { accountId: cashAcc._id, debit: amt, credit: 0, description: `Loan received — ${loan.providerName}` },
          { accountId: loanAcc._id, debit: 0, credit: amt, description: `Loan liability — ${loan.providerName}` },
        ]
      : [
          { accountId: loanAcc._id, debit: amt, credit: 0, description: `Loan repayment — ${loan.providerName}` },
          { accountId: cashAcc._id, debit: 0, credit: amt, description: `Loan repayment cash — ${loan.providerName}` },
        ];

    const entry = await JournalEntry.create({
      entryNumber: generateEntryNumber(),
      tenantId: tId,
      date: new Date(),
      description: `Loan Journal ${txType} — ${loan.providerName}`,
      reference: loan._id.toString(),
      lines,
      totalDebit: amt,
      totalCredit: amt,
      status: 'POSTED',
      postedBy: 'system',
    });

    await Account.updateOne({ _id: cashAcc._id }, { $inc: { balance: isNewLoan ? amt : -amt } });
    await Account.updateOne({ _id: loanAcc._id }, { $inc: { balance: isNewLoan ? -amt : amt } });

    return entry;
  } catch (err) {
    console.error('Automated loan journal creation error:', err);
  }
};
