import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    company: { type: String, trim: true },
    address: { type: String, trim: true },
    dueBalance: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    paymentTerms: { type: String, enum: ['CASH', 'NET15', 'NET30', 'NET60'], default: 'CASH' },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

supplierSchema.index({ name: 'text', company: 'text', phone: 'text' });

export const Supplier = mongoose.model('Supplier', supplierSchema);
