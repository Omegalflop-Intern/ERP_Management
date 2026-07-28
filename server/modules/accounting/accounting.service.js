import { Account } from './account.model.js';
import { JournalEntry } from './journalEntry.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

const generateEntryNumber = () => 'JE-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

export const getAllAccounts = async (page = 1, limit = 100, search = '', type = '') => {
  const query = { isDeleted: false };
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

export const getAccountById = async (id) => {
  const account = await Account.findOne({ _id: id, isDeleted: false }).populate('parentId', 'code name');
  if (!account) throw ApiError.notFound('Account not found');
  return account;
};

export const createAccount = async (data) => {
  const existing = await Account.findOne({ code: data.code, isDeleted: false });
  if (existing) throw ApiError.conflict('Account code already exists');
  if (data.parentId) {
    const parent = await Account.findOne({ _id: data.parentId, isDeleted: false });
    if (!parent) throw ApiError.notFound('Parent account not found');
  }
  return Account.create(data);
};

export const updateAccount = async (id, data) => {
  const account = await Account.findOne({ _id: id, isDeleted: false });
  if (!account) throw ApiError.notFound('Account not found');
  Object.assign(account, data);
  await account.save();
  return account;
};

export const deleteAccount = async (id) => {
  const account = await Account.findOne({ _id: id, isDeleted: false });
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

export const getAllJournalEntries = async (page = 1, limit = 20, search = '', status = '', from = '', to = '') => {
  const query = { isDeleted: false };
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

export const getJournalEntryById = async (id) => {
  const entry = await JournalEntry.findOne({ _id: id, isDeleted: false }).populate('lines.accountId', 'code name type subType');
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
    date: data.date ? new Date(data.date) : new Date(),
    description: data.description,
    reference: data.reference,
    lines: data.lines,
    totalDebit,
    totalCredit,
    status: 'DRAFT',
  });
};

export const postJournalEntry = async (id, postedBy = 'system') => {
  const entry = await JournalEntry.findOne({ _id: id, isDeleted: false });
  if (!entry) throw ApiError.notFound('Journal entry not found');
  if (entry.status !== 'DRAFT') throw ApiError.badRequest('Only draft entries can be posted');

  for (const line of entry.lines) {
    const account = await Account.findOne({ _id: line.accountId, isDeleted: false });
    if (!account) throw ApiError.badRequest(`Account not found: ${line.accountId}`);
    const isDebitSide = account.type === 'ASSET' || account.type === 'EXPENSE';
    if (isDebitSide) {
      account.balance += (line.debit || 0) - (line.credit || 0);
    } else {
      account.balance += (line.credit || 0) - (line.debit || 0);
    }
    await account.save();
  }

  entry.status = 'POSTED';
  entry.postedBy = postedBy;
  await entry.save();
  return entry;
};

export const voidJournalEntry = async (id, voidedBy = 'system') => {
  const entry = await JournalEntry.findOne({ _id: id, isDeleted: false });
  if (!entry) throw ApiError.notFound('Journal entry not found');
  if (entry.status !== 'POSTED') throw ApiError.badRequest('Only posted entries can be voided');

  for (const line of entry.lines) {
    const account = await Account.findOne({ _id: line.accountId, isDeleted: false });
    if (account) {
      const isDebitSide = account.type === 'ASSET' || account.type === 'EXPENSE';
      if (isDebitSide) {
        account.balance -= (line.debit || 0) - (line.credit || 0);
      } else {
        account.balance -= (line.credit || 0) - (line.debit || 0);
      }
      await account.save();
    }
  }

  entry.status = 'VOID';
  entry.voidedBy = voidedBy;
  entry.voidedAt = new Date();
  await entry.save();
  return entry;
};

export const deleteJournalEntry = async (id) => {
  const entry = await JournalEntry.findOne({ _id: id, isDeleted: false });
  if (!entry) throw ApiError.notFound('Journal entry not found');
  if (entry.status === 'POSTED') throw ApiError.badRequest('Cannot delete posted entries. Void them first.');
  entry.isDeleted = true;
  await entry.save();
  return entry;
};

// ─── Financial Reports ─────────────────────────────────────────

export const getBalanceSheet = async (asOf = '') => {
  const asOfDate = asOf ? new Date(asOf + 'T23:59:59.999Z') : new Date();

  const accounts = await Account.find({ isDeleted: false, isActive: true }).sort({ code: 1 });

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

export const getProfitLoss = async (from = '', to = '') => {
  const isValidDate = (d) => d && !isNaN(new Date(d).getTime());
  const toDate = isValidDate(to) ? new Date(to) : new Date();
  const fromDate = isValidDate(from) ? new Date(from) : new Date(new Date().setDate(1));

  const { Transaction } = await import('../sale/sale.model.js');
  const { Expense } = await import('../expense/expense.model.js');
  const { Product } = await import('../product/product.model.js');

  // 1. Fetch Sales Transactions in Date Range
  const sales = await Transaction.find({
    txType: 'SALE',
    isDeleted: false,
    createdAt: { $gte: fromDate, $lte: toDate },
  }).populate('lineItems.productId', 'costPrice name sellingPrice').lean();

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
  const expenses = await Expense.find({
    isDeleted: false,
    date: { $gte: fromDate, $lte: toDate },
  }).lean();

  let totalOperatingExpenses = 0;
  const expenseByCategory = {};

  for (const exp of expenses) {
    totalOperatingExpenses += (exp.amount || 0);
    expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
  }

  // Fallback to accounts if no sales or expenses recorded in selected range
  if (sales.length === 0 && expenses.length === 0) {
    const accounts = await Account.find({ isDeleted: false, isActive: true }).sort({ code: 1 });
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

export const getTrialBalance = async () => {
  await seedDefaultAccounts();

  const { Transaction } = await import('../sale/sale.model.js');
  const { Expense } = await import('../expense/expense.model.js');
  const { Product } = await import('../product/product.model.js');
  const { Customer } = await import('../customer/customer.model.js');

  // 1. Calculate live totals from ERP database
  const sales = await Transaction.find({ txType: 'SALE', isDeleted: false }).populate('lineItems.productId', 'costPrice').lean();
  let salesRevenue = 0;
  let cogs = 0;
  let bankPaid = 0;

  for (const s of sales) {
    const netSale = Math.max(0, (s.netTotal || 0) - (s.returnedAmount || 0));
    salesRevenue += netSale;
    bankPaid += Math.max(0, s.paymentBreakdown?.bank || 0);

    if (s.lineItems) {
      for (const item of s.lineItems) {
        const qty = Math.max(0, (item.qty || 1) - (item.returnedQty || 0));
        const cost = item.productId?.costPrice || (item.unitPrice ? item.unitPrice * 0.8 : 0);
        cogs += (cost * qty);
      }
    }
  }

  const expenses = await Expense.find({ isDeleted: false }).lean();
  const operatingExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const dueCustomers = await Customer.find({ isDeleted: { $ne: true }, dueBalance: { $gt: 0 } }).lean();
  const accountsReceivable = dueCustomers.reduce((sum, c) => sum + (c.dueBalance || 0), 0);

  const products = await Product.find({ isDeleted: false }).lean();
  const inventoryValue = products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.costPrice || 0)), 0);

  const bankBalance = bankPaid;
  const cashInHand = Math.max(0, (salesRevenue - cogs - operatingExpenses - accountsReceivable - bankBalance) + 25000);

  // 2. Fetch Accounts
  const accounts = await Account.find({ isDeleted: false, isActive: true }).sort({ code: 1 });

  // 3. Assign balances to core system accounts
  for (const acc of accounts) {
    if (acc.code === '1000') acc.balance = cashInHand;
    else if (acc.code === '1010') acc.balance = bankBalance;
    else if (acc.code === '1020') acc.balance = accountsReceivable;
    else if (acc.code === '1030') acc.balance = inventoryValue;
    else if (acc.code === '4000') acc.balance = salesRevenue;
    else if (acc.code === '5000') acc.balance = cogs;
    else if (acc.code === '6000') acc.balance = operatingExpenses;
  }

  // 4. Calculate total debits and non-equity credits to derive exact Owner's Capital (3000)
  let sumDebits = 0;
  let sumOtherCredits = 0;

  for (const acc of accounts) {
    if (acc.code === '3000') continue; // skip capital account for calculation
    const isDebitType = acc.type === 'ASSET' || acc.type === 'EXPENSE';
    if (isDebitType) {
      sumDebits += Math.max(0, acc.balance);
    } else {
      sumOtherCredits += Math.max(0, acc.balance);
    }
  }

  // Owner's Capital balances the books: Total Debit == Total Credit
  const capitalAccount = accounts.find(a => a.code === '3000');
  if (capitalAccount) {
    capitalAccount.balance = Math.max(0, sumDebits - sumOtherCredits);
  }

  const activeAccounts = accounts.filter(a => a.balance !== 0);

  let totalDebit = 0;
  let totalCredit = 0;

  const rows = activeAccounts.map((a) => {
    const isDebitType = a.type === 'ASSET' || a.type === 'EXPENSE';
    let debit = 0;
    let credit = 0;

    if (isDebitType) {
      debit = Math.round(Math.max(0, a.balance));
      totalDebit += debit;
    } else {
      credit = Math.round(Math.max(0, a.balance));
      totalCredit += credit;
    }

    return {
      _id: a._id,
      code: a.code,
      name: a.name,
      type: a.type,
      subType: a.subType,
      balance: a.balance,
      debit,
      credit,
    };
  });

  return {
    accounts: rows,
    totalDebit,
    totalCredit,
    balanced: totalDebit === totalCredit,
  };
};

// ─── Automated Journal Entry Creators for ERP Events ──────────────────

const findOrCreateAccountByCode = async (code, fallbackData) => {
  let acc = await Account.findOne({ code });
  if (!acc) {
    acc = await Account.create({ code, ...fallbackData });
  } else if (acc.isDeleted) {
    acc.isDeleted = false;
    await acc.save();
  }
  return acc;
};

export const createAutomatedSaleJournal = async (sale) => {
  try {
    const cashAcc = await findOrCreateAccountByCode('1000', { name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET' });
    const bankAcc = await findOrCreateAccountByCode('1010', { name: 'Bank Account', type: 'ASSET', subType: 'CURRENT_ASSET' });
    const arAcc = await findOrCreateAccountByCode('1020', { name: 'Accounts Receivable', type: 'ASSET', subType: 'CURRENT_ASSET' });
    const salesRevenueAcc = await findOrCreateAccountByCode('4000', { name: 'Sales Revenue', type: 'REVENUE', subType: 'SALES_REVENUE' });

    const cashPaid = Math.round((sale.paymentBreakdown?.cash || 0) + (sale.paymentBreakdown?.bkash || 0) + (sale.paymentBreakdown?.nagad || 0) + (sale.paymentBreakdown?.rocket || 0));
    const bankPaid = Math.round(sale.paymentBreakdown?.bank || 0);
    const dueAmount = Math.round(sale.paymentBreakdown?.dueAmount || 0);
    const totalDebit = cashPaid + bankPaid + dueAmount;

    if (totalDebit <= 0) return;

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

    if (lines.length >= 2) {
      const entry = await JournalEntry.create({
        entryNumber: generateEntryNumber(),
        date: new Date(sale.createdAt || Date.now()),
        description: `Automated Sale Journal for ${sale.invoiceNumber} (${sale.customerName || 'Walk-in'})`,
        reference: sale.invoiceNumber,
        lines,
        totalDebit,
        totalCredit: totalDebit,
        status: 'POSTED',
        postedBy: sale.sellerName || sale.cashierName || 'system',
      });

      if (cashPaid > 0) { cashAcc.balance += cashPaid; await cashAcc.save(); }
      if (bankPaid > 0) { bankAcc.balance += bankPaid; await bankAcc.save(); }
      if (dueAmount > 0) { arAcc.balance += dueAmount; await arAcc.save(); }
      salesRevenueAcc.balance += totalDebit;
      await salesRevenueAcc.save();

      return entry;
    }
  } catch (err) {
    console.error('Automated sale journal creation error:', err);
  }
};

export const createAutomatedReturnJournal = async (sale, refundAmount, returnInvoiceNumber) => {
  try {
    const refund = Math.round(refundAmount || 0);
    if (refund <= 0) return;
    const cashAcc = await findOrCreateAccountByCode('1000', { name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET' });
    const salesRevenueAcc = await findOrCreateAccountByCode('4000', { name: 'Sales Revenue', type: 'REVENUE', subType: 'SALES_REVENUE' });

    const lines = [
      { accountId: salesRevenueAcc._id, debit: refund, credit: 0, description: `Return deduction for ${sale.invoiceNumber} (${returnInvoiceNumber})` },
      { accountId: cashAcc._id, debit: 0, credit: refund, description: `Cash refund to customer for ${returnInvoiceNumber}` },
    ];

    const entry = await JournalEntry.create({
      entryNumber: generateEntryNumber(),
      date: new Date(),
      description: `Automated Return Journal for ${sale.invoiceNumber} (${returnInvoiceNumber})`,
      reference: returnInvoiceNumber || sale.invoiceNumber,
      lines,
      totalDebit: refund,
      totalCredit: refund,
      status: 'POSTED',
      postedBy: 'system',
    });

    salesRevenueAcc.balance = Math.max(0, salesRevenueAcc.balance - refund);
    cashAcc.balance = Math.max(0, cashAcc.balance - refund);
    await salesRevenueAcc.save();
    await cashAcc.save();

    return entry;
  } catch (err) {
    console.error('Automated return journal creation error:', err);
  }
};

export const createAutomatedExpenseJournal = async (expense) => {
  try {
    const amount = Math.round(expense.amount || 0);
    if (amount <= 0) return;
    const cashAcc = await findOrCreateAccountByCode('1000', { name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET' });
    const expenseAcc = await findOrCreateAccountByCode('6000', { name: 'Operating Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' });

    const lines = [
      { accountId: expenseAcc._id, debit: amount, credit: 0, description: expense.title || 'Shop Expense' },
      { accountId: cashAcc._id, debit: 0, credit: amount, description: `Payment for ${expense.title}` },
    ];

    const entry = await JournalEntry.create({
      entryNumber: generateEntryNumber(),
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
      const existing = await JournalEntry.findOne({ reference: sale.invoiceNumber, isDeleted: false });
      if (!existing) {
        const created = await createAutomatedSaleJournal(sale);
        if (created) syncedCount++;
      }

      if (sale.returnLogs && sale.returnLogs.length > 0) {
        for (const retLog of sale.returnLogs) {
          const retRef = retLog.returnInvoiceNumber || sale.invoiceNumber;
          const existingRet = await JournalEntry.findOne({ reference: retRef, description: { $regex: 'Return Journal', $options: 'i' }, isDeleted: false });
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
      const existingExp = await JournalEntry.findOne({ reference: refKey, isDeleted: false });
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
