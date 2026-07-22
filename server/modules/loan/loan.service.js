import { Loan, LoanRepayment } from './loan.model.js';
import { ApiError } from '../../utils/http/ApiError.js';

export const getAllLoans = async () => {
  const loans = await Loan.find({ isDeleted: false }).sort({ createdAt: -1 }).lean();

  const totalBorrowed = loans.reduce((sum, l) => sum + (l.loanAmount || 0), 0);
  const totalRepaid = loans.reduce((sum, l) => sum + (l.repaidAmount || 0), 0);
  const activeDueBalance = Math.max(0, totalBorrowed - totalRepaid);
  const activeCount = loans.filter(l => l.status === 'Active').length;

  return {
    loans: loans.map(l => ({
      ...l,
      remainingDue: Math.max(0, (l.loanAmount || 0) - (l.repaidAmount || 0)),
    })),
    summary: {
      totalBorrowed,
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

  const loan = await Loan.create({
    ...data,
    loanAmount: Number(data.loanAmount),
    interestRate: Number(data.interestRate) || 0,
  });

  return loan;
};

export const repayLoanInstalment = async (loanId, data, username) => {
  const loan = await Loan.findOne({ _id: loanId, isDeleted: false });
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
  await loan.save();

  const repayment = await LoanRepayment.create({
    loanId: loan._id,
    amount,
    paymentMethod: data.paymentMethod || 'cash',
    reference: data.reference || '',
    notes: data.notes || '',
    date: data.date || new Date(),
    recordedBy: username,
  });

  return { loan, repayment };
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
