import mongoose from 'mongoose';

const loanInstallmentSchema = new mongoose.Schema({
  installmentNo: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Overdue'], default: 'Pending' },
  paidDate: { type: Date },
  paidAmount: { type: Number, default: 0 },
});

const loanSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['LOAN_TAKEN', 'LOAN_GIVEN'], default: 'LOAN_TAKEN' }, // LOAN_TAKEN (Lender) vs LOAN_GIVEN (Borrower)
    providerName: { type: String, required: true, trim: true }, // Lender Name or Borrower Name
    accountNumber: { type: String, trim: true },
    phone: { type: String, trim: true },
    loanAmount: { type: Number, required: true, min: 0.01 },
    interestRate: { type: Number, default: 0 },
    borrowedDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    installmentCount: { type: Number, default: 1 },
    installmentSchedule: [loanInstallmentSchema],
    repaidAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Fully Repaid'], default: 'Active' },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const loanRepaymentSchema = new mongoose.Schema(
  {
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: { type: String, enum: ['cash', 'bkash', 'nagad', 'rocket', 'bank'], default: 'cash' },
    reference: { type: String },
    notes: { type: String },
    date: { type: Date, default: Date.now },
    recordedBy: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Loan = mongoose.model('Loan', loanSchema);
export const LoanRepayment = mongoose.model('LoanRepayment', loanRepaymentSchema);
