import { Investor, InvestorTransaction } from './investor.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { Account } from '../accounting/account.model.js';
import { JournalEntry } from '../accounting/journalEntry.model.js';

export const getAllInvestors = async () => {
  const investors = await Investor.find({ isDeleted: false }).sort({ createdAt: -1 }).lean();

  const totalInvested = investors.reduce((sum, i) => sum + (i.totalInvested || 0), 0);
  const totalWithdrawn = investors.reduce((sum, i) => sum + (i.totalWithdrawn || 0), 0);
  const totalProfitPaid = investors.reduce((sum, i) => sum + (i.totalProfitPaid || 0), 0);
  const activeBalance = Math.max(0, totalInvested - totalWithdrawn);
  const activeCount = investors.filter(i => i.status === 'Active').length;

  return {
    investors: investors.map(i => ({
      ...i,
      currentBalance: Math.max(0, (i.totalInvested || 0) - (i.totalWithdrawn || 0)),
    })),
    summary: {
      totalInvested,
      totalWithdrawn,
      totalProfitPaid,
      activeBalance,
      activeInvestors: activeCount,
    },
  };
};

export const createInvestor = async (data, username) => {
  const investor = await Investor.create(data);

  // If initial capital is provided
  if (data.initialCapital && Number(data.initialCapital) > 0) {
    const initialAmt = Number(data.initialCapital);
    investor.totalInvested = initialAmt;
    await investor.save();

    await InvestorTransaction.create({
      investorId: investor._id,
      type: 'DEPOSIT',
      amount: initialAmt,
      paymentMethod: data.paymentMethod || 'cash',
      reference: 'Initial Investment Deposit',
      notes: 'Initial capital investment on creation',
      recordedBy: username,
    });
  }

  return investor;
};

export const getInvestorById = async (id) => {
  const investor = await Investor.findOne({ _id: id, isDeleted: false }).lean();
  if (!investor) throw ApiError.notFound('Investor not found');

  const transactions = await InvestorTransaction.find({ investorId: id, isDeleted: false })
    .sort({ createdAt: -1 })
    .lean();

  return {
    ...investor,
    currentBalance: Math.max(0, (investor.totalInvested || 0) - (investor.totalWithdrawn || 0)),
    transactions,
  };
};

export const addInvestorTransaction = async (investorId, txData, username) => {
  const investor = await Investor.findOne({ _id: investorId, isDeleted: false });
  if (!investor) throw ApiError.notFound('Investor not found');

  const amount = Number(txData.amount);
  if (isNaN(amount) || amount <= 0) throw ApiError.badRequest('Invalid transaction amount');

  const type = txData.type; // DEPOSIT, WITHDRAWAL, PROFIT_SHARE
  if (!['DEPOSIT', 'WITHDRAWAL', 'PROFIT_SHARE'].includes(type)) {
    throw ApiError.badRequest('Invalid transaction type');
  }

  if (type === 'WITHDRAWAL') {
    const currentBalance = (investor.totalInvested || 0) - (investor.totalWithdrawn || 0);
    if (amount > currentBalance) {
      throw ApiError.badRequest(`Withdrawal amount (৳${amount}) exceeds investor balance (৳${currentBalance})`);
    }
    investor.totalWithdrawn = (investor.totalWithdrawn || 0) + amount;
  } else if (type === 'DEPOSIT') {
    investor.totalInvested = (investor.totalInvested || 0) + amount;
  } else if (type === 'PROFIT_SHARE') {
    investor.totalProfitPaid = (investor.totalProfitPaid || 0) + amount;
  }

  await investor.save();

  const tx = await InvestorTransaction.create({
    investorId: investor._id,
    type,
    amount,
    paymentMethod: txData.paymentMethod || 'cash',
    reference: txData.reference || '',
    notes: txData.notes || '',
    date: txData.date || new Date(),
    recordedBy: username,
  });

  return { investor, transaction: tx };
};

export const updateInvestor = async (id, data) => {
  const investor = await Investor.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: data },
    { new: true }
  );
  if (!investor) throw ApiError.notFound('Investor not found');
  return investor;
};

export const deleteInvestor = async (id) => {
  const investor = await Investor.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );
  if (!investor) throw ApiError.notFound('Investor not found');
  return investor;
};

export const getAllTransactions = async () => {
  const txs = await InvestorTransaction.find({ isDeleted: false })
    .populate('investorId', 'name phone sharePercentage')
    .sort({ createdAt: -1 })
    .lean();

  return txs;
};
