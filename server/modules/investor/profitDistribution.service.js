import { db } from '../../config/db.knex.js';
import { getProfitLoss } from '../accounting/accounting.service.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getInvestorById, formatInvestorTransaction } from './investor.service.js';

const parseValidDate = (val, fallback) => {
  if (!val || val === 'undefined' || val === 'null') return fallback;
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : d;
};

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where('tenant_id', tenantId);
  }
}

export const calculateProfitDistribution = async (startDate, endDate, tenantId = null) => {
  const fromDate = parseValidDate(startDate, new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const toDate = parseValidDate(endDate, new Date());

  const plData = await getProfitLoss(fromDate.toISOString(), toDate.toISOString(), tenantId);
  const netProfit = plData.netIncome || 0;

  const query = db('investors').where({ is_deleted: false, status: 'Active' });
  applyTenantScope(query, tenantId);
  const investors = await query;

  const totalPercentageAllocated = investors.reduce((sum, inv) => sum + Number(inv.share_percentage || 0), 0);

  const shares = investors.map((inv) => {
    const percentage = Number(inv.share_percentage || 0);
    const shareAmount = Number(((netProfit * percentage) / 100).toFixed(2));
    const invested = Number(inv.total_invested || 0);
    const withdrawn = Number(inv.total_withdrawn || 0);
    return {
      investorId: String(inv.id),
      id: inv.id,
      name: inv.name,
      phone: inv.phone,
      sharePercentage: percentage,
      currentBalance: Math.max(0, invested - withdrawn),
      totalInvested: invested,
      totalProfitPaid: Number(inv.total_profit_paid || 0),
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

export const executeShareDistribution = async (distributionData, username = 'system', tenantId = null, branchId = null) => {
  const { investorId, actionType, amount, paymentMethod, reference, notes } = distributionData;

  if (!investorId || !actionType || !amount || Number(amount) <= 0) {
    throw ApiError.badRequest('investorId, valid actionType (PAYOUT or REINVEST), and amount are required');
  }

  const numericAmount = Number(amount);
  const investor = await getInvestorById(investorId, tenantId);
  if (!investor) throw ApiError.notFound('Investor profile not found');

  if (branchId && branchId !== 'all' && investor.branchId && String(investor.branchId) !== String(branchId)) {
    throw ApiError.forbidden('Investor does not belong to your branch');
  }

  let txType = 'PROFIT_PAYOUT';
  let referenceMsg = reference || 'Profit Share Pay Out';

  if (actionType === 'PAYOUT') {
    txType = 'PROFIT_PAYOUT';
    const pdPayoutUpdate = db('investors').where({ id: investorId });
    if (tenantId) pdPayoutUpdate.andWhere('tenant_id', tenantId);
    await pdPayoutUpdate.update({
      total_profit_paid: Number(investor.totalProfitPaid || 0) + numericAmount,
    });
  } else if (actionType === 'REINVEST') {
    txType = 'PROFIT_REINVESTMENT';
    referenceMsg = reference || 'Profit Share Reinvested into Capital';
    const pdReinvestUpdate = db('investors').where({ id: investorId });
    if (tenantId) pdReinvestUpdate.andWhere('tenant_id', tenantId);
    await pdReinvestUpdate.update({
      total_invested: Number(investor.totalInvested || 0) + numericAmount,
    });
  }

  const [txId] = await db('investor_transactions').insert({
    tenant_id: tenantId || investor.tenantId || null,
    investor_id: investorId,
    type: txType,
    amount: numericAmount,
    payment_method: paymentMethod || 'cash',
    reference: referenceMsg,
    notes: notes || `Profit share distribution (${actionType})`,
    date: new Date(),
    recorded_by: username,
    is_deleted: false,
  });

  const updatedInvestor = await getInvestorById(investorId, tenantId);
  const txReQuery = db('investor_transactions').where({ id: txId });
  if (tenantId) txReQuery.andWhere('tenant_id', tenantId);
  const txRow = await txReQuery.first();

  return { investor: updatedInvestor, transaction: formatInvestorTransaction(txRow) };
};
