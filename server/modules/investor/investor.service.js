import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';

export function formatInvestor(row) {
  if (!row) return null;
  const invested = Number(row.total_invested || 0);
  const withdrawn = Number(row.total_withdrawn || 0);
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    name: row.name,
    phone: row.phone,
    email: row.email || '',
    address: row.address || '',
    sharePercentage: Number(row.share_percentage || 0),
    totalInvested: invested,
    totalWithdrawn: withdrawn,
    totalProfitPaid: Number(row.total_profit_paid || 0),
    currentBalance: Math.max(0, invested - withdrawn),
    profilePhoto: row.profile_photo || null,
    status: row.status || 'Active',
    notes: row.notes || '',
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function formatInvestorTransaction(row, investorRow = null) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    investorId: investorRow ? {
      _id: String(investorRow.id),
      id: investorRow.id,
      name: investorRow.name,
      phone: investorRow.phone,
      sharePercentage: Number(investorRow.share_percentage || 0),
    } : String(row.investor_id),
    type: row.type,
    amount: Number(row.amount || 0),
    paymentMethod: row.payment_method || 'cash',
    reference: row.reference || '',
    notes: row.notes || '',
    date: row.date,
    recordedBy: row.recorded_by || '',
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where('tenant_id', tenantId);
  }
}

export const getAllInvestors = async (tenantId = null, branchId = null) => {
  const query = db('investors').where({ is_deleted: false });
  applyTenantScope(query, tenantId);
  if (branchId && branchId !== 'all') {
    query.where((b) => b.where('branch_id', branchId).orWhereNull('branch_id'));
  }
  const rows = await query.orderBy('created_at', 'desc');

  const investors = rows.map(formatInvestor);
  const totalInvested = investors.reduce((sum, i) => sum + i.totalInvested, 0);
  const totalWithdrawn = investors.reduce((sum, i) => sum + i.totalWithdrawn, 0);
  const totalProfitPaid = investors.reduce((sum, i) => sum + i.totalProfitPaid, 0);
  const activeBalance = Math.max(0, totalInvested - totalWithdrawn);
  const activeInvestors = investors.filter(i => i.status === 'Active').length;

  return {
    investors,
    summary: {
      totalInvested,
      totalWithdrawn,
      totalProfitPaid,
      activeBalance,
      activeInvestors,
    },
  };
};

export const createInvestor = async (data, tenantIdOrRecordedBy = null, branchIdOrTenantId = null) => {
  let tenantId = data.tenantId || null;
  let branchId = data.branchId || null;

  if (tenantIdOrRecordedBy && typeof tenantIdOrRecordedBy === 'string' && tenantIdOrRecordedBy !== 'admin_test' && tenantIdOrRecordedBy !== 'system') {
    tenantId = tenantIdOrRecordedBy;
  }
  if (branchIdOrTenantId && typeof branchIdOrTenantId === 'string' && (branchIdOrTenantId.startsWith('ten_') || branchIdOrTenantId.includes('-') || !isNaN(Number(branchIdOrTenantId)))) {
    tenantId = branchIdOrTenantId;
  }

  const [insertedId] = await db('investors').insert({
    tenant_id: tenantId,
    branch_id: branchId,
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    share_percentage: data.sharePercentage || 0,
    agreed_return_rate: data.agreedReturnRate || 0,
    status: data.status || 'Active',
    notes: data.notes || null,
    is_deleted: false,
  });

  if (data.initialCapital && Number(data.initialCapital) > 0) {
    await db('investor_transactions').insert({
      tenant_id: tenantId || data.tenantId || null,
      investor_id: insertedId,
      type: 'DEPOSIT',
      amount: Number(data.initialCapital),
      payment_method: data.paymentMethod || 'cash',
      reference: 'Initial Investment Deposit',
      notes: 'Initial capital investment on creation',
      recorded_by: (typeof tenantIdOrRecordedBy === 'string' && (tenantIdOrRecordedBy === 'admin_test' || tenantIdOrRecordedBy === 'system')) ? tenantIdOrRecordedBy : 'System',
      is_deleted: false,
    });
  }

  return getInvestorById(insertedId, tenantId || data.tenantId || null);
};

export const getInvestorById = async (id, tenantId = null) => {
  const query = db('investors').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
  const row = await query.first();
  if (!row) throw ApiError.notFound('Investor not found');

  const txQuery = db('investor_transactions').where({ investor_id: id, is_deleted: false });
  applyTenantScope(txQuery, tenantId);
  const txRows = await txQuery.orderBy('created_at', 'desc');

  const investor = formatInvestor(row);
  investor.transactions = txRows.map(r => formatInvestorTransaction(r));
  return investor;
};

export const addInvestorTransaction = async (investorId, txData, username, tenantId = null) => {
  const investor = await getInvestorById(investorId, tenantId);
  if (!investor) throw ApiError.notFound('Investor not found');

  const amount = Number(txData.amount);
  if (isNaN(amount) || amount <= 0) throw ApiError.badRequest('Invalid transaction amount');

  const type = txData.type;
  if (!['DEPOSIT', 'WITHDRAWAL', 'PROFIT_SHARE', 'PROFIT_PAYOUT', 'PROFIT_REINVESTMENT'].includes(type)) {
    throw ApiError.badRequest('Invalid transaction type');
  }

  let totalInvested = investor.totalInvested;
  let totalWithdrawn = investor.totalWithdrawn;
  let totalProfitPaid = investor.totalProfitPaid;

  if (type === 'WITHDRAWAL') {
    const currentBalance = totalInvested - totalWithdrawn;
    if (amount > currentBalance) {
      throw ApiError.badRequest(`Withdrawal amount (৳${amount}) exceeds investor balance (৳${currentBalance})`);
    }
    totalWithdrawn += amount;
  } else if (type === 'DEPOSIT' || type === 'PROFIT_REINVESTMENT') {
    totalInvested += amount;
  } else if (type === 'PROFIT_SHARE' || type === 'PROFIT_PAYOUT') {
    totalProfitPaid += amount;
  }

  const invUpdate = db('investors').where({ id: investorId });
  if (tenantId) invUpdate.andWhere('tenant_id', tenantId);
  await invUpdate.update({
    total_invested: totalInvested,
    total_withdrawn: totalWithdrawn,
    total_profit_paid: totalProfitPaid,
  });

  const [txId] = await db('investor_transactions').insert({
    tenant_id: tenantId || investor.tenantId || null,
    investor_id: investorId,
    type,
    amount,
    payment_method: txData.paymentMethod || 'cash',
    reference: txData.reference || '',
    notes: txData.notes || '',
    date: txData.date ? new Date(txData.date) : new Date(),
    recorded_by: username || 'System',
    is_deleted: false,
  });

  const updatedInvestor = await getInvestorById(investorId, tenantId);
  const txReQuery = db('investor_transactions').where({ id: txId });
  if (tenantId) txReQuery.andWhere('tenant_id', tenantId);
  const txRow = await txReQuery.first();

  return { investor: updatedInvestor, transaction: formatInvestorTransaction(txRow) };
};

export const updateInvestor = async (id, data, tenantId = null) => {
  const investor = await getInvestorById(id, tenantId);
  if (!investor) throw ApiError.notFound('Investor not found');

  const updateFields = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.phone !== undefined) updateFields.phone = data.phone;
  if (data.email !== undefined) updateFields.email = data.email;
  if (data.address !== undefined) updateFields.address = data.address;
  if (data.sharePercentage !== undefined) updateFields.share_percentage = data.sharePercentage;
  if (data.status !== undefined) updateFields.status = data.status;
  if (data.notes !== undefined) updateFields.notes = data.notes;

  if (Object.keys(updateFields).length > 0) {
    const invUpdateFields = db('investors').where({ id });
    if (tenantId) invUpdateFields.andWhere('tenant_id', tenantId);
    await invUpdateFields.update(updateFields);
  }

  return getInvestorById(id, tenantId);
};

export const deleteInvestor = async (id, tenantId = null) => {
  const investor = await getInvestorById(id, tenantId);
  if (!investor) throw ApiError.notFound('Investor not found');

  const invDel = db('investors').where({ id });
  if (tenantId) invDel.andWhere('tenant_id', tenantId);
  await invDel.update({ is_deleted: true });
  return { ...investor, isDeleted: true };
};

export const getAllTransactions = async (tenantId = null) => {
  const dataQuery = db('investor_transactions')
    .leftJoin('investors', 'investor_transactions.investor_id', 'investors.id')
    .where('investor_transactions.is_deleted', false)
    .select(
      'investor_transactions.*',
      'investors.id as inv_id',
      'investors.name as inv_name',
      'investors.phone as inv_phone',
      'investors.share_percentage as inv_share_percentage'
    );
  if (tenantId) {
    dataQuery.where('investor_transactions.tenant_id', tenantId);
  }

  const rows = await dataQuery.orderBy('investor_transactions.created_at', 'desc');
  return rows.map((r) => {
    const inv = r.inv_id ? { id: r.inv_id, name: r.inv_name, phone: r.inv_phone, share_percentage: r.inv_share_percentage } : null;
    return formatInvestorTransaction(r, inv);
  });
};
