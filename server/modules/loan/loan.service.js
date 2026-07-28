import mongoose from 'mongoose';
import { Loan, LoanRepayment } from './loan.model.js';
import { ApiError } from '../../utils/http/ApiError.js';

export const getAllLoans = async (type = 'LOAN_TAKEN') => {
  const query = { isDeleted: false };
  if (type) query.type = type;

  const loans = await Loan.find(query).sort({ createdAt: -1 }).lean();

  const totalAmount = loans.reduce((sum, l) => sum + (l.loanAmount || 0), 0);
  const totalRepaid = loans.reduce((sum, l) => sum + (l.repaidAmount || 0), 0);
  const activeDueBalance = Math.max(0, totalAmount - totalRepaid);
  const activeCount = loans.filter(l => l.status === 'Active').length;

  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const processedLoans = loans.map(l => {
    const remainingDue = Math.max(0, (l.loanAmount || 0) - (l.repaidAmount || 0));

    let alertStatus = 'NONE'; // 'NONE' | 'UPCOMING' (YELLOW) | 'OVERDUE' (RED)
    if (remainingDue > 0 && l.dueDate) {
      const due = new Date(l.dueDate);
      if (due < now) {
        alertStatus = 'OVERDUE';
      } else if (due <= threeDaysLater) {
        alertStatus = 'UPCOMING';
      }
    }

    return {
      ...l,
      remainingDue,
      alertStatus,
    };
  });

  return {
    loans: processedLoans,
    summary: {
      totalAmount,
      totalRepaid,
      activeDueBalance,
      activeLoans: activeCount,
    },
  };
};

export const createLoan = async (data, username) => {
  if (!data.loanAmount || Number(data.loanAmount) <= 0) {
    throw ApiError.badRequest('Loan amount must be greater than 0');
  }

  const loanAmount = Number(data.loanAmount);
  const interestRate = Number(data.interestRate) || 0;
  const totalWithInterest = loanAmount + (loanAmount * interestRate) / 100;
  const installmentCount = Math.max(1, Number(data.installmentCount) || 1);

  // Generate Installment Schedule
  const schedule = [];
  const perInstallmentAmount = Number((totalWithInterest / installmentCount).toFixed(2));
  const startDate = data.dueDate ? new Date(data.dueDate) : new Date();

  for (let i = 1; i <= installmentCount; i++) {
    const instDueDate = new Date(startDate);
    instDueDate.setMonth(instDueDate.getMonth() + (i - 1));
    schedule.push({
      installmentNo: i,
      dueDate: instDueDate,
      amount: perInstallmentAmount,
      status: 'Pending',
      paidAmount: 0,
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [loan] = await Loan.create(
      [
        {
          ...data,
          type: data.type || 'LOAN_TAKEN',
          loanAmount: totalWithInterest,
          interestRate,
          installmentCount,
          installmentSchedule: schedule,
        },
      ],
      { session }
    );

    // Atomic LedgerEntry for double-entry bookkeeping
    const { LedgerEntry } = await import('../accounting/ledgerEntry.model.js');
    await LedgerEntry.create(
      [
        {
          transactionId: loan._id,
          transactionType: 'LOAN',
          accountId: loan._id,
          entryType: loan.type === 'LOAN_TAKEN' ? 'CREDIT' : 'DEBIT',
          amount: totalWithInterest,
          narration: `New Loan (${loan.type}): ${loan.providerName}`,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    return loan;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const repayLoanInstalment = async (loanId, data, username) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const loan = await Loan.findOne({ _id: loanId, isDeleted: false }).session(session);
    if (!loan) throw ApiError.notFound('Loan record not found');

    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) throw ApiError.badRequest('Invalid repayment amount');

    const remainingDue = (loan.loanAmount || 0) - (loan.repaidAmount || 0);
    if (amount > remainingDue) {
      throw ApiError.badRequest(`Repayment amount (৳${amount}) exceeds remaining loan due (৳${remainingDue})`);
    }

    loan.repaidAmount = (loan.repaidAmount || 0) + amount;
    if (loan.repaidAmount >= loan.loanAmount) {
      loan.status = 'Fully Repaid';
    }

    // Update Installment Schedule Statuses
    let remainingPayment = amount;
    if (loan.installmentSchedule && loan.installmentSchedule.length > 0) {
      for (const inst of loan.installmentSchedule) {
        if (remainingPayment <= 0) break;
        if (inst.status !== 'Paid') {
          const instDue = inst.amount - (inst.paidAmount || 0);
          if (remainingPayment >= instDue) {
            remainingPayment -= instDue;
            inst.paidAmount = inst.amount;
            inst.status = 'Paid';
            inst.paidDate = new Date();
          } else {
            inst.paidAmount = (inst.paidAmount || 0) + remainingPayment;
            remainingPayment = 0;
          }
        }
      }
    }

    await loan.save({ session });

    const [repayment] = await LoanRepayment.create(
      [
        {
          loanId: loan._id,
          amount,
          paymentMethod: data.paymentMethod || 'cash',
          reference: data.reference || '',
          notes: data.notes || '',
          date: data.date || new Date(),
          recordedBy: username,
        },
      ],
      { session }
    );

    // Atomic LedgerEntry for double-entry bookkeeping
    const { LedgerEntry } = await import('../accounting/ledgerEntry.model.js');
    await LedgerEntry.create(
      [
        {
          transactionId: repayment._id,
          transactionType: 'LOAN',
          accountId: loan._id,
          entryType: loan.type === 'LOAN_TAKEN' ? 'DEBIT' : 'CREDIT',
          amount,
          narration: `Loan Repayment (${loan.type}) for ${loan.providerName}: ৳${amount}`,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return { loan, repayment };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getLoanById = async (id) => {
  const loan = await Loan.findOne({ _id: id, isDeleted: false }).lean();
  if (!loan) throw ApiError.notFound('Loan record not found');

  const repayments = await LoanRepayment.find({ loanId: id, isDeleted: false }).sort({ createdAt: -1 }).lean();

  return {
    ...loan,
    remainingDue: Math.max(0, (loan.loanAmount || 0) - (loan.repaidAmount || 0)),
    repayments,
  };
};

export const deleteLoan = async (id) => {
  const loan = await Loan.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );
  if (!loan) throw ApiError.notFound('Loan record not found');
  return loan;
};
