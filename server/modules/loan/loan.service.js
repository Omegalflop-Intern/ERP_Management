import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';

function parseJSON(str) {
  if (typeof str === 'string') {
    try { return JSON.parse(str); } catch { return []; }
  }
  return str || [];
}

export function formatLoan(row) {
  if (!row) return null;
  const loanAmt = Number(row.loan_amount || 0);
  const repaidAmt = Number(row.repaid_amount || 0);
  const remainingDue = Math.max(0, loanAmt - repaidAmt);

  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    type: row.type || 'LOAN_TAKEN',
    providerName: row.provider_name,
    accountNumber: row.account_number || '',
    phone: row.phone || '',
    loanAmount: loanAmt,
    interestRate: Number(row.interest_rate || 0),
    borrowedDate: row.borrowed_date,
    dueDate: row.due_date || null,
    installmentCount: Number(row.installment_count || 1),
    installmentSchedule: parseJSON(row.installment_schedule),
    repaidAmount: repaidAmt,
    remainingDue,
    status: row.status || 'Active',
    notes: row.notes || '',
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function formatLoanRepayment(row) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    loanId: String(row.loan_id),
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

export const getAllLoans = async (type = 'LOAN_TAKEN', tenantId = null, branchId = null) => {
  const query = db('loans').where({ is_deleted: false });
  applyTenantScope(query, tenantId);
  if (branchId && branchId !== 'all') {
    query.where(function () {
      this.where('branch_id', branchId).orWhereNull('branch_id');
    });
  }
  if (type) query.where({ type });

  const rows = await query.orderBy('created_at', 'desc');
  const loans = rows.map(formatLoan);

  const totalAmount = loans.reduce((sum, l) => sum + l.loanAmount, 0);
  const totalRepaid = loans.reduce((sum, l) => sum + l.repaidAmount, 0);
  const totalRemaining = loans.reduce((sum, l) => sum + l.remainingDue, 0);
  const activeCount = loans.filter((l) => l.remainingDue > 0).length;

  return {
    loans,
    summary: {
      totalAmount,
      totalRepaid,
      totalRemaining,
      activeCount,
    },
  };
};

export const createLoan = async (data, arg2 = null, arg3 = null) => {
  if (!data.loanAmount || Number(data.loanAmount) <= 0) throw ApiError.badRequest('Loan amount must be greater than 0');

  let resolvedTenantId = null;
  let resolvedBranchId = null;

  if (typeof arg2 === 'number' || (typeof arg2 === 'string' && /^\d+$/.test(arg2))) {
    resolvedTenantId = Number(arg2);
    resolvedBranchId = arg3;
  } else if (typeof arg3 === 'number' || (typeof arg3 === 'string' && /^\d+$/.test(arg3))) {
    resolvedTenantId = Number(arg3);
  } else if (data.tenantId && !isNaN(Number(data.tenantId))) {
    resolvedTenantId = Number(data.tenantId);
  }

  if (data.branchId && !isNaN(Number(data.branchId))) {
    resolvedBranchId = Number(data.branchId);
  }

  const loanAmount = Number(data.loanAmount);
  const interestRate = Number(data.interestRate) || 0;
  const totalWithInterest = loanAmount + (loanAmount * interestRate) / 100;
  const installmentCount = Math.max(1, Number(data.installmentCount) || 1);

  const schedule = [];
  const perInstallmentAmount = Number((totalWithInterest / installmentCount).toFixed(2));
  
  const borrowedDate = data.borrowedDate ? new Date(data.borrowedDate) : new Date();
  let calculatedDueDate = data.dueDate ? new Date(data.dueDate) : null;

  if (installmentCount > 1) {
    for (let i = 1; i <= installmentCount; i++) {
      const instDueDate = new Date(borrowedDate);
      instDueDate.setMonth(instDueDate.getMonth() + i);
      schedule.push({
        installmentNo: i,
        dueDate: instDueDate.toISOString(),
        amount: perInstallmentAmount,
        status: 'Pending',
        paidAmount: 0,
      });
    }
    calculatedDueDate = new Date(borrowedDate);
    calculatedDueDate.setMonth(calculatedDueDate.getMonth() + installmentCount);
  } else {
    // Single repayment loan
    const finalDueDate = calculatedDueDate || new Date(borrowedDate);
    if (!calculatedDueDate) {
      finalDueDate.setMonth(finalDueDate.getMonth() + 1);
      calculatedDueDate = finalDueDate;
    }
    schedule.push({
      installmentNo: 1,
      dueDate: finalDueDate.toISOString(),
      amount: perInstallmentAmount,
      status: 'Pending',
      paidAmount: 0,
    });
  }

  // Validate payment method/account is active
  const { validatePaymentMethodActive } = await import('../accounting/accounting.service.js');
  await validatePaymentMethodActive(data.accountNumber || 'cash', resolvedTenantId);

  const [insertedId] = await db('loans').insert({
    tenant_id: resolvedTenantId,
    branch_id: resolvedBranchId,
    type: data.type || 'LOAN_TAKEN',
    provider_name: data.providerName,
    account_number: data.accountNumber || null,
    phone: data.phone || null,
    loan_amount: totalWithInterest,
    interest_rate: interestRate,
    borrowed_date: borrowedDate,
    due_date: calculatedDueDate,
    installment_count: installmentCount,
    installment_schedule: JSON.stringify(schedule),
    repaid_amount: 0,
    status: 'Active',
    notes: data.notes || null,
    is_deleted: false,
  });

  const createdLoan = await db('loans').where({ id: insertedId }).first();
  try {
    await createAutomatedLoanJournal(createdLoan);
  } catch (err) {
    console.error('[Loan Journal Error]:', err.message);
  }

  return getLoanById(insertedId, resolvedTenantId);
};

export const getLoanById = async (id, tenantId = null) => {
  const query = db('loans').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
  const row = await query.first();
  if (!row) throw ApiError.notFound('Loan record not found');

  const repQuery = db('loan_repayments').where({ loan_id: id, is_deleted: false });
  applyTenantScope(repQuery, tenantId);
  const repRows = await repQuery.orderBy('created_at', 'desc');

  const loan = formatLoan(row);
  loan.repayments = repRows.map(formatLoanRepayment);
  return loan;
};

export const repayLoanInstalment = async (loanId, data, username = 'system', tenantId = null) => {
  const loan = await getLoanById(loanId, tenantId);
  if (!loan) throw ApiError.notFound('Loan record not found');

  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) throw ApiError.badRequest('Invalid repayment amount');

  const remainingDue = loan.loanAmount - loan.repaidAmount;
  if (amount > remainingDue) {
    throw ApiError.badRequest(`Repayment amount (৳${amount}) exceeds remaining loan due (৳${remainingDue})`);
  }

  const newRepaid = loan.repaidAmount + amount;
  const status = newRepaid >= loan.loanAmount ? 'Fully Repaid' : 'Active';

  // Validate repayment payment method/account is active
  const resolvedTenant = tenantId || loan.tenantId || null;
  const { validatePaymentMethodActive } = await import('../accounting/accounting.service.js');
  await validatePaymentMethodActive(data.paymentMethod || 'cash', resolvedTenant);

  const q1 = db('loans').where({ id: loanId });
  if (tenantId) q1.andWhere('tenant_id', tenantId);
  await q1.update({
    repaid_amount: newRepaid,
    status,
  });

  const [repId] = await db('loan_repayments').insert({
    tenant_id: tenantId || loan.tenantId || null,
    loan_id: loanId,
    amount,
    payment_method: data.paymentMethod || 'cash',
    reference: data.reference || '',
    notes: data.notes || '',
    date: data.date ? new Date(data.date) : new Date(),
    recorded_by: username,
    is_deleted: false,
  });

  try {
    const createdRep = await db('loan_repayments').where({ id: repId }).first();
    const fullLoan = await db('loans').where({ id: loanId }).first();
    await createAutomatedLoanRepaymentJournal(createdRep, fullLoan);
  } catch (err) {
    console.error('[Loan Repayment Journal Error]:', err.message);
  }

  const updatedLoan = await getLoanById(loanId, tenantId);
  const repQuery = db('loan_repayments').where({ id: repId });
  if (tenantId) repQuery.andWhere('tenant_id', tenantId);
  const repRow = await repQuery.first();

  return { loan: updatedLoan, repayment: formatLoanRepayment(repRow) };
};

export const deleteLoan = async (id, tenantId = null) => {
  const loan = await getLoanById(id, tenantId);
  if (!loan) throw ApiError.notFound('Loan record not found');

  const q2 = db('loans').where({ id });
  if (tenantId) q2.andWhere('tenant_id', tenantId);
  await q2.update({ is_deleted: true });

  try {
    const { voidJournalEntry } = await import('../accounting/accounting.service.js');
    
    const creRef = `LOAN-CRT-${id}`;
    const creJe = await db('journal_entries').where({ reference: creRef, tenant_id: tenantId, is_deleted: false }).first();
    if (creJe && creJe.status !== 'VOID') {
      await voidJournalEntry(creJe.id, 'system', tenantId);
    }

    const reps = await db('loan_repayments').where({ loan_id: id, is_deleted: false });
    for (const r of reps) {
      const repRef = `LOAN-REP-${r.id}`;
      const repJe = await db('journal_entries').where({ reference: repRef, tenant_id: tenantId, is_deleted: false }).first();
      if (repJe && repJe.status !== 'VOID') {
        await voidJournalEntry(repJe.id, 'system', tenantId);
      }
    }
  } catch (err) {
    console.error('[Loan Deletion Reversal Error]:', err.message);
  }

  return { ...loan, isDeleted: true };
};

export const createAutomatedLoanJournal = async (loan) => {
  try {
    const { createJournalEntry, seedDefaultAccounts } = await import('../accounting/accounting.service.js');
    const tenantId = loan.tenant_id || loan.tenantId || null;
    const amount = Number(loan.loan_amount || 0);
    if (amount <= 0) return null;

    const ref = `LOAN-CRT-${loan.id}`;
    const existing = await db('journal_entries').where({ reference: ref, is_deleted: false }).first();
    if (existing) return existing;

    await seedDefaultAccounts(tenantId);
    
    const acctsQuery = db('accounts').where({ is_deleted: false });
    if (tenantId) acctsQuery.andWhere('tenant_id', tenantId);
    const accounts = await acctsQuery;
    const acctMap = {};
    for (const a of accounts) acctMap[a.code] = a;

    const method = String(loan.account_number || 'cash').toLowerCase();
    let assetAcct = acctMap['1000'];
    if (method.includes('bank') && acctMap['1010']) assetAcct = acctMap['1010'];
    else if (method.includes('bkash') && acctMap['1011']) assetAcct = acctMap['1011'];
    else if (method.includes('nagad') && acctMap['1012']) assetAcct = acctMap['1012'];
    else if (method.includes('rocket') && acctMap['1013']) assetAcct = acctMap['1013'];

    const type = String(loan.type).toUpperCase();

    if (type === 'LOAN_TAKEN') {
      const payAcct = acctMap['2000'];
      if (assetAcct && payAcct) {
        return await createJournalEntry({
          tenantId,
          branchId: loan.branch_id || null,
          date: loan.borrowed_date || new Date(),
          description: `Loan Taken from ${loan.provider_name}`,
          reference: ref,
          lines: [
            { accountId: assetAcct.id, code: assetAcct.code, accountName: assetAcct.name, debit: amount, credit: 0 },
            { accountId: payAcct.id, code: payAcct.code, accountName: payAcct.name, debit: 0, credit: amount }
          ],
          status: 'POSTED',
        });
      }
    } else if (type === 'LOAN_GIVEN') {
      const recAcct = acctMap['1020'];
      if (assetAcct && recAcct) {
        return await createJournalEntry({
          tenantId,
          branchId: loan.branch_id || null,
          date: loan.borrowed_date || new Date(),
          description: `Loan Given to ${loan.provider_name}`,
          reference: ref,
          lines: [
            { accountId: recAcct.id, code: recAcct.code, accountName: recAcct.name, debit: amount, credit: 0 },
            { accountId: assetAcct.id, code: assetAcct.code, accountName: assetAcct.name, debit: 0, credit: amount }
          ],
          status: 'POSTED',
        });
      }
    }
  } catch (err) {
    console.error('[AUTO-JOURNAL] Failed to create loan journal:', err.message);
  }
  return null;
};

export const createAutomatedLoanRepaymentJournal = async (repayment, loan) => {
  try {
    const { createJournalEntry, seedDefaultAccounts } = await import('../accounting/accounting.service.js');
    const tenantId = repayment.tenant_id || repayment.tenantId || null;
    const amount = Number(repayment.amount || 0);
    if (amount <= 0) return null;

    const ref = `LOAN-REP-${repayment.id}`;
    const existing = await db('journal_entries').where({ reference: ref, is_deleted: false }).first();
    if (existing) return existing;

    await seedDefaultAccounts(tenantId);
    
    const acctsQuery = db('accounts').where({ is_deleted: false });
    if (tenantId) acctsQuery.andWhere('tenant_id', tenantId);
    const accounts = await acctsQuery;
    const acctMap = {};
    for (const a of accounts) acctMap[a.code] = a;

    const method = String(repayment.payment_method || 'cash').toLowerCase();
    let assetAcct = acctMap['1000'];
    if (method.includes('bank') && acctMap['1010']) assetAcct = acctMap['1010'];
    else if (method.includes('bkash') && acctMap['1011']) assetAcct = acctMap['1011'];
    else if (method.includes('nagad') && acctMap['1012']) assetAcct = acctMap['1012'];
    else if (method.includes('rocket') && acctMap['1013']) assetAcct = acctMap['1013'];

    const type = String(loan.type).toUpperCase();

    if (type === 'LOAN_TAKEN') {
      const payAcct = acctMap['2000'];
      if (assetAcct && payAcct) {
        return await createJournalEntry({
          tenantId,
          branchId: loan.branch_id || null,
          date: repayment.date || new Date(),
          description: `Loan Repayment to ${loan.provider_name}`,
          reference: ref,
          lines: [
            { accountId: payAcct.id, code: payAcct.code, accountName: payAcct.name, debit: amount, credit: 0 },
            { accountId: assetAcct.id, code: assetAcct.code, accountName: assetAcct.name, debit: 0, credit: amount }
          ],
          status: 'POSTED',
        });
      }
    } else if (type === 'LOAN_GIVEN') {
      const recAcct = acctMap['1020'];
      if (assetAcct && recAcct) {
        return await createJournalEntry({
          tenantId,
          branchId: loan.branch_id || null,
          date: repayment.date || new Date(),
          description: `Loan Repayment received from ${loan.provider_name}`,
          reference: ref,
          lines: [
            { accountId: assetAcct.id, code: assetAcct.code, accountName: assetAcct.name, debit: amount, credit: 0 },
            { accountId: recAcct.id, code: recAcct.code, accountName: recAcct.name, debit: 0, credit: amount }
          ],
          status: 'POSTED',
        });
      }
    }
  } catch (err) {
    console.error('[AUTO-JOURNAL] Failed to create loan repayment journal:', err.message);
  }
  return null;
};
