import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema(
  {
    providerName: { type: String, required: true, trim: true }, // Bank, Person, Org name
    accountNumber: { type: String, trim: true },
    loanAmount: { type: Number, required: true, min: 0.01 },
    interestRate: { type: Number, default: 0 },
    borrowedDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
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
