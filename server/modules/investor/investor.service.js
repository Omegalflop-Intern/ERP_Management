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

export const getAllInvestors = async (tenantId = null) => {
  const query = db('investors').where({ is_deleted: false });
  applyTenantScope(query, tenantId);
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

// Bug #17 fixed: Clarified the true calling convention. All callsites use:
//   createInvestor(data, recordedBy_string, tenantId)
// The old parameter names (tenantIdOrRecordedBy, branchIdOrTenantId) were confusing,
// causing the risk of wrong tenant assignment. Now named explicitly.
export const createInvestor = async (data, recordedBy = 'system', tenantId = null) => {
  // tenantId: prefer explicit param (3rd arg), fallback to data.tenantId
  const resolvedTenantId = (tenantId !== null && tenantId !== undefined && !isNaN(Number(tenantId)))
    ? tenantId
    : (data.tenantId && !isNaN(Number(data.tenantId)) ? data.tenantId : null);

  if (data.initialCapital && Number(data.initialCapital) > 0) {
    const { validatePaymentMethodActive } = await import('../accounting/accounting.service.js');
    await validatePaymentMethodActive(data.paymentMethod || 'cash', resolvedTenantId);
  }

  const initialCap = Number(data.initialCapital || 0);
  const dateToUse = data.startDate ? new Date(data.startDate) : new Date();

  const [insertedId] = await db('investors').insert({
    tenant_id: resolvedTenantId,
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    address: data.address || null,
    share_percentage: Number(data.sharePercentage || 0),
    total_invested: initialCap,
    total_withdrawn: 0,
    total_profit_paid: 0,
    status: data.status || 'Active',
    notes: data.notes || null,
    is_deleted: false,
    created_at: dateToUse,
    updated_at: dateToUse,
  });

  if (data.initialCapital && Number(data.initialCapital) > 0) {
    const [txId] = await db('investor_transactions').insert({
      tenant_id: resolvedTenantId,
      investor_id: insertedId,
      type: 'DEPOSIT',
      amount: Number(data.initialCapital),
      payment_method: data.paymentMethod || 'cash',
      reference: 'Initial Investment Deposit',
      notes: 'Initial capital investment on creation',
      recorded_by: typeof recordedBy === 'string' ? recordedBy : 'system',
      is_deleted: false,
      created_at: dateToUse,
      updated_at: dateToUse,
    });
    try {
      const createdTx = await db('investor_transactions').where({ id: txId }).first();
      await createAutomatedInvestorJournal(createdTx);
    } catch (err) {
      console.error('[Investor Initial Journal Error]:', err.message);
    }
  }

  return getInvestorById(insertedId, resolvedTenantId);
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

  const resolvedTenant = tenantId || investor.tenantId || null;
  const { validatePaymentMethodActive } = await import('../accounting/accounting.service.js');
  await validatePaymentMethodActive(txData.paymentMethod || 'cash', resolvedTenant);

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

  try {
    const createdTx = await db('investor_transactions').where({ id: txId }).first();
    await createAutomatedInvestorJournal(createdTx);
  } catch (err) {
    console.error('[Investor Transaction Journal Error]:', err.message);
  }

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

  try {
    const { voidJournalEntry } = await import('../accounting/accounting.service.js');
    const txs = await db('investor_transactions').where({ investor_id: id, is_deleted: false });
    await db('investor_transactions').where({ investor_id: id }).update({ is_deleted: true });
    
    for (const tx of txs) {
      const jeRef = `INV-TX-${tx.id}`;
      const je = await db('journal_entries').where({ reference: jeRef, tenant_id: tenantId, is_deleted: false }).first();
      if (je && je.status !== 'VOID') {
        await voidJournalEntry(je.id, 'system', tenantId);
      }
    }
  } catch (err) {
    console.error('[Investor Deletion Reversal Error]:', err.message);
  }

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

export const createAutomatedInvestorJournal = async (tx) => {
  try {
    const { createJournalEntry, seedDefaultAccounts } = await import('../accounting/accounting.service.js');
    const tenantId = tx.tenant_id || tx.tenantId || null;
    const amount = Number(tx.amount || 0);
    if (amount <= 0) return null;

    const ref = `INV-TX-${tx.id}`;
    const existing = await db('journal_entries').where({ reference: ref, is_deleted: false }).first();
    if (existing) return existing;

    await seedDefaultAccounts(tenantId);
    
    const acctsQuery = db('accounts').where({ is_deleted: false });
    if (tenantId) acctsQuery.andWhere('tenant_id', tenantId);
    const accounts = await acctsQuery;
    const acctMap = {};
    for (const a of accounts) acctMap[a.code] = a;

    const method = String(tx.payment_method || tx.paymentMethod || 'cash').toLowerCase();
    let assetAcct = acctMap['1000'];
    if (method.includes('bank') && acctMap['1010']) assetAcct = acctMap['1010'];
    else if (method.includes('bkash') && acctMap['1011']) assetAcct = acctMap['1011'];
    else if (method.includes('nagad') && acctMap['1012']) assetAcct = acctMap['1012'];
    else if (method.includes('rocket') && acctMap['1013']) assetAcct = acctMap['1013'];

    const capitalAcct = acctMap['3000'];
    const type = String(tx.type).toUpperCase();

    if (assetAcct && capitalAcct) {
      let lines = [];
      if (type === 'DEPOSIT' || type === 'PROFIT_REINVESTMENT') {
        lines = [
          { accountId: assetAcct.id, code: assetAcct.code, accountName: assetAcct.name, debit: amount, credit: 0 },
          { accountId: capitalAcct.id, code: capitalAcct.code, accountName: capitalAcct.name, debit: 0, credit: amount }
        ];
      } else if (type === 'WITHDRAWAL' || type === 'PROFIT_SHARE' || type === 'PROFIT_PAYOUT') {
        lines = [
          { accountId: capitalAcct.id, code: capitalAcct.code, accountName: capitalAcct.name, debit: amount, credit: 0 },
          { accountId: assetAcct.id, code: assetAcct.code, accountName: assetAcct.name, debit: 0, credit: amount }
        ];
      }

      if (lines.length === 2) {
        return await createJournalEntry({
          tenantId,
          date: tx.date || tx.created_at || new Date(),
          description: `Investor Capital Transaction (${tx.type}): Ref ${tx.reference || tx.id}`,
          reference: ref,
          lines,
          status: 'POSTED',
        });
      }
    }
  } catch (err) {
    console.error('[AUTO-JOURNAL] Failed to create investor transaction journal:', err.message);
  }
  return null;
};
