import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'Miscellaneous',
    },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: { type: String, enum: ['cash', 'bkash', 'nagad', 'rocket', 'bank'], default: 'cash' },
    date: { type: Date, default: Date.now },
    voucherNumber: { type: String, trim: true },
    notes: { type: String },
    recordedBy: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Expense = mongoose.model('Expense', expenseSchema);
