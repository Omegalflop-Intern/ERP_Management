import { Investor, InvestorTransaction } from './investor.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { Account } from '../accounting/account.model.js';
import { JournalEntry } from '../accounting/journalEntry.model.js';
import { runInTransaction } from '../../utils/db/transactionHelper.js';
import { withTenant } from '../../utils/tenant.js';
import { createAutomatedInvestorJournal } from '../accounting/accounting.service.js';

export const getAllInvestors = async (tenantId = null) => {
  const query = withTenant({ isDeleted: false }, tenantId);
  const investors = await Investor.find(query).sort({ createdAt: -1 }).lean();

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

export const createInvestor = async (data, username, tenantId = null) => {
  return runInTransaction(async (session) => {
    const investors = session ? await Investor.create([{ ...data, tenantId: tenantId || null }], { session }) : await Investor.create([{ ...data, tenantId: tenantId || null }]);
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
          tenantId: tenantId || null,
        },
      ];

      if (session) await InvestorTransaction.create(txPayload, { session });
      else await InvestorTransaction.create(txPayload);
    }

    return investor;
  });
};

export const getInvestorById = async (id, tenantId = null) => {
  const investor = await Investor.findOne(withTenant({ _id: id, isDeleted: false }, tenantId)).lean();
  if (!investor) throw ApiError.notFound('Investor not found');

  const transactions = await InvestorTransaction.find(withTenant({ investorId: id, isDeleted: false }, tenantId))
    .sort({ createdAt: -1 })
    .lean();

  return {
    ...investor,
    currentBalance: Math.max(0, (investor.totalInvested || 0) - (investor.totalWithdrawn || 0)),
    transactions,
  };
};

export const addInvestorTransaction = async (investorId, txData, username, tenantId = null) => {
  return runInTransaction(async (session) => {
    const investorQuery = Investor.findOne(withTenant({ _id: investorId, isDeleted: false }, tenantId));
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
        tenantId: tenantId || null,
      },
    ];

    const txs = session
      ? await InvestorTransaction.create(txPayload, { session })
      : await InvestorTransaction.create(txPayload);
    const tx = txs[0];

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

    await createAutomatedInvestorJournal(investor, type, amount, tenantId).catch(err => console.error('Investor journal failed:', err));

    return { investor, transaction: tx };
  });
};

export const updateInvestor = async (id, data, tenantId = null) => {
  const investor = await Investor.findOneAndUpdate(
    withTenant({ _id: id, isDeleted: false }, tenantId),
    { $set: data },
    { new: true }
  );
  if (!investor) throw ApiError.notFound('Investor not found');
  return investor;
};

export const deleteInvestor = async (id, tenantId = null) => {
  const investor = await Investor.findOneAndUpdate(
    withTenant({ _id: id, isDeleted: false }, tenantId),
    { $set: { isDeleted: true } },
    { new: true }
  );
  if (!investor) throw ApiError.notFound('Investor not found');
  return investor;
};

export const getAllTransactions = async (tenantId = null) => {
  const txs = await InvestorTransaction.find(withTenant({ isDeleted: false }, tenantId))
    .populate('investorId', 'name phone sharePercentage')
    .sort({ createdAt: -1 })
    .lean();

  return txs;
};
