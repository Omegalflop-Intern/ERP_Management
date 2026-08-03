import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    company: { type: String, trim: true },
    address: { type: String, trim: true },
    dueBalance: { type: Number, default: 0 },
    creditBalance: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    paymentTerms: { type: String, enum: ['CASH', 'NET15', 'NET30', 'NET60'], default: 'CASH' },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

supplierSchema.index({ tenantId: 1, phone: 1 }, { unique: true, sparse: true });
supplierSchema.index({ name: 'text', company: 'text', phone: 'text' });

export const Supplier = mongoose.model('Supplier', supplierSchema);
