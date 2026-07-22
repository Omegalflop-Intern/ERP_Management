import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema(
  {
    transactionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    transactionType: {
      type: String,
      enum: ['SALE', 'PURCHASE', 'EXPENSE', 'SALARY', 'LOAN', 'INVESTMENT', 'TRANSFER', 'JOURNAL'],
      required: true,
    },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    entryType: { type: String, enum: ['DEBIT', 'CREDIT'], required: true },
    amount: { type: Number, required: true },
    narration: { type: String },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ledgerEntrySchema.index({ accountId: 1, createdAt: -1 });
ledgerEntrySchema.index({ transactionId: 1 });

export const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);
