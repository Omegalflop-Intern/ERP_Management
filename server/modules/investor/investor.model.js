import mongoose from 'mongoose';

const investorSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true },
    sharePercentage: { type: Number, default: 0, min: 0, max: 100 },
    totalInvested: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    totalProfitPaid: { type: Number, default: 0 },
    profilePhoto: { type: String, trim: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const investorTransactionSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true },
    type: { type: String, enum: ['DEPOSIT', 'WITHDRAWAL', 'PROFIT_SHARE', 'PROFIT_PAYOUT', 'PROFIT_REINVESTMENT'], required: true },
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

export const Investor = mongoose.model('Investor', investorSchema);
export const InvestorTransaction = mongoose.model('InvestorTransaction', investorTransactionSchema);
