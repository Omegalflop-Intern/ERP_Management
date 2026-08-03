import mongoose from 'mongoose';

const stockTransferSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    transferNumber: { type: String, required: true },
    fromBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    toBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    imeiOrSerial: { type: String },
    quantity: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    notes: { type: String },
    transferredBy: { type: String },
    deliveredAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

stockTransferSchema.index({ tenantId: 1, transferNumber: 1 }, { unique: true, sparse: true });

export const StockTransfer = mongoose.model('StockTransfer', stockTransferSchema);
