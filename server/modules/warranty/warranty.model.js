import mongoose from 'mongoose';

const warrantyClaimSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    imei: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryUnit', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    invoiceRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    claimType: { type: String, enum: ['repair', 'replacement', 'refund'], required: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
    resolution: { type: String, trim: true },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

warrantyClaimSchema.index({ imei: 1 });
warrantyClaimSchema.index({ customer: 1 });
warrantyClaimSchema.index({ status: 1 });

export const WarrantyClaim = mongoose.model('WarrantyClaim', warrantyClaimSchema);
