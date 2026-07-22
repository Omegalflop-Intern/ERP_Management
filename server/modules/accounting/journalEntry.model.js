import mongoose from 'mongoose';

const journalLineSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },
  description: { type: String },
}, { _id: false });

const journalEntrySchema = new mongoose.Schema(
  {
    entryNumber: { type: String, required: true, unique: true },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, required: true },
    reference: { type: String },
    lines: {
      type: [journalLineSchema],
      validate: {
        validator: function (lines) {
          const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
          const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
          return totalDebit === totalCredit && totalDebit > 0;
        },
        message: 'Debits must equal credits and total must be greater than 0',
      },
    },
    totalDebit: { type: Number, required: true },
    totalCredit: { type: Number, required: true },
    status: { type: String, enum: ['DRAFT', 'POSTED', 'VOID'], default: 'DRAFT' },
    postedBy: { type: String },
    voidedBy: { type: String },
    voidedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

journalEntrySchema.index({ date: 1, status: 1 });
journalEntrySchema.index({ 'lines.accountId': 1 });

export const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
