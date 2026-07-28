import mongoose from 'mongoose';
import { Investor, InvestorTransaction } from './investor.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { Account } from '../accounting/account.model.js';
import { JournalEntry } from '../accounting/journalEntry.model.js';
import { runInTransaction } from '../../utils/db/transactionHelper.js';

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
  return runInTransaction(async (session) => {
    const investors = session ? await Investor.create([data], { session }) : await Investor.create([data]);
    const investor = investors[0];

    if (data.initialCapital && Number(data.initialCapital) > 0) {
      const initialAmt = Number(data.initialCapital);
      investor.totalInvested = initialAmt;
      if (session) await investor.save({ session });
      else await investor.save();

      const txPayload = [
        {
          investorId: investor._id,
          type: 'DEPOSIT',
          amount: initialAmt,
          paymentMethod: data.paymentMethod || 'cash',
          reference: 'Initial Investment Deposit',
          notes: 'Initial capital investment on creation',
          recordedBy: username,
        },
      ];

      if (session) await InvestorTransaction.create(txPayload, { session });
      else await InvestorTransaction.create(txPayload);
    }

    return investor;
  });
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
  return runInTransaction(async (session) => {
    const investorQuery = Investor.findOne({ _id: investorId, isDeleted: false });
    const investor = session ? await investorQuery.session(session) : await investorQuery;
    if (!investor) throw ApiError.notFound('Investor not found');

    const amount = Number(txData.amount);
    if (isNaN(amount) || amount <= 0) throw ApiError.badRequest('Invalid transaction amount');

    const type = txData.type;
    if (!['DEPOSIT', 'WITHDRAWAL', 'PROFIT_SHARE', 'PROFIT_PAYOUT', 'PROFIT_REINVESTMENT'].includes(type)) {
      throw ApiError.badRequest('Invalid transaction type');
    }

    if (type === 'WITHDRAWAL') {
      const currentBalance = (investor.totalInvested || 0) - (investor.totalWithdrawn || 0);
      if (amount > currentBalance) {
        throw ApiError.badRequest(`Withdrawal amount (৳${amount}) exceeds investor balance (৳${currentBalance})`);
      }
      investor.totalWithdrawn = (investor.totalWithdrawn || 0) + amount;
    } else if (type === 'DEPOSIT' || type === 'PROFIT_REINVESTMENT') {
      investor.totalInvested = (investor.totalInvested || 0) + amount;
    } else if (type === 'PROFIT_SHARE' || type === 'PROFIT_PAYOUT') {
      investor.totalProfitPaid = (investor.totalProfitPaid || 0) + amount;
    }

    if (session) await investor.save({ session });
    else await investor.save();

    const txPayload = [
      {
        investorId: investor._id,
        type,
        amount,
        paymentMethod: txData.paymentMethod || 'cash',
        reference: txData.reference || '',
        notes: txData.notes || '',
        date: txData.date || new Date(),
        recordedBy: username,
      },
    ];

    const txs = session
      ? await InvestorTransaction.create(txPayload, { session })
      : await InvestorTransaction.create(txPayload);
    const tx = txs[0];

    // Create Atomic LedgerEntry for double-entry bookkeeping
    const { LedgerEntry } = await import('../accounting/ledgerEntry.model.js');
    const ledgerPayload = [
      {
        transactionId: tx._id,
        transactionType: 'INVESTMENT',
        accountId: investor._id,
        entryType: type === 'WITHDRAWAL' ? 'DEBIT' : 'CREDIT',
        amount,
        narration: `Investor ${investor.name} (${type}): ${txData.notes || txData.reference || 'Capital transaction'}`,
      },
    ];

    if (session) await LedgerEntry.create(ledgerPayload, { session });
    else await LedgerEntry.create(ledgerPayload);

    return { investor, transaction: tx };
  });
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
