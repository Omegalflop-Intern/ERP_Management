import { Investor, InvestorTransaction } from './investor.model.js';
import { getProfitLoss } from '../accounting/accounting.service.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { runInTransaction } from '../../utils/db/transactionHelper.js';
import { withTenant } from '../../utils/tenant.js';

const parseValidDate = (val, fallback) => {
  if (!val || val === 'undefined' || val === 'null') return fallback;
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : d;
};

export const calculateProfitDistribution = async (startDate, endDate, tenantId = null) => {
  const fromDate = parseValidDate(startDate, new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const toDate = parseValidDate(endDate, new Date());

  const plData = await getProfitLoss(fromDate.toISOString(), toDate.toISOString());
  const netProfit = plData.netIncome || 0;

  const investors = await Investor.find(withTenant({ isDeleted: false, status: 'Active' }, tenantId)).lean();

  const totalPercentageAllocated = investors.reduce((sum, inv) => sum + (inv.sharePercentage || 0), 0);

  const shares = investors.map((inv) => {
    const percentage = inv.sharePercentage || 0;
    const shareAmount = Number(((netProfit * percentage) / 100).toFixed(2));
    return {
      investorId: inv._id,
      name: inv.name,
      phone: inv.phone,
      sharePercentage: percentage,
      currentBalance: Math.max(0, (inv.totalInvested || 0) - (inv.totalWithdrawn || 0)),
      totalInvested: inv.totalInvested || 0,
      totalProfitPaid: inv.totalProfitPaid || 0,
      calculatedShare: shareAmount,
    };
  });

  return {
    period: { from: fromDate, to: toDate },
    netProfit,
    totalPercentageAllocated,
    shares,
  };
};

export const executeShareDistribution = async (distributionData, username, tenantId = null) => {
  const { investorId, actionType, amount, paymentMethod, reference, notes } = distributionData;

  if (!investorId || !actionType || !amount || Number(amount) <= 0) {
    throw ApiError.badRequest('investorId, valid actionType (PAYOUT or REINVEST), and amount are required');
  }

  if (!['PAYOUT', 'REINVEST'].includes(actionType)) {
    throw ApiError.badRequest('actionType must be either PAYOUT or REINVEST');
  }

  const numericAmount = Number(amount);

  return runInTransaction(async (session) => {
    const investorQuery = Investor.findOne(withTenant({ _id: investorId, isDeleted: false }, tenantId));
    const investor = session ? await investorQuery.session(session) : await investorQuery;

    if (!investor) {
      throw ApiError.notFound('Investor profile not found');
    }

    let txType = 'PROFIT_PAYOUT';
    let referenceMsg = reference || 'Profit Share Pay Out';

    if (actionType === 'PAYOUT') {
      txType = 'PROFIT_PAYOUT';
      investor.totalProfitPaid = (investor.totalProfitPaid || 0) + numericAmount;
    } else if (actionType === 'REINVEST') {
      txType = 'PROFIT_REINVESTMENT';
      referenceMsg = reference || 'Profit Share Reinvested into Capital';
      investor.totalInvested = (investor.totalInvested || 0) + numericAmount;
    }

    if (session) {
      await investor.save({ session });
    } else {
      await investor.save();
    }

    const txPayload = [
      {
        investorId: investor._id,
        type: txType,
        amount: numericAmount,
        paymentMethod: paymentMethod || 'cash',
        reference: referenceMsg,
        notes: notes || `Profit share distribution (${actionType})`,
        date: new Date(),
        recordedBy: username,
        tenantId: tenantId || null,
      },
    ];

    const transactions = session
      ? await InvestorTransaction.create(txPayload, { session })
      : await InvestorTransaction.create(txPayload);

    const transaction = transactions[0];

    const { LedgerEntry } = await import('../accounting/ledgerEntry.model.js');
    const ledgerPayload = [
      {
        transactionId: transaction._id,
        transactionType: 'INVESTMENT',
        accountId: investor._id,
        entryType: actionType === 'PAYOUT' ? 'DEBIT' : 'CREDIT',
        amount: numericAmount,
        narration: `Profit Share Distribution (${actionType}) for ${investor.name}: ৳${numericAmount}`,
      },
    ];

    if (session) {
      await LedgerEntry.create(ledgerPayload, { session });
    } else {
      await LedgerEntry.create(ledgerPayload);
    }

    await createAutomatedInvestorJournal(investor, txType, numericAmount, tenantId).catch(err => console.error('Investor distribution journal failed:', err));

    return { investor, transaction };
  });
};
