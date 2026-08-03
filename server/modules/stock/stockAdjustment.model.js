import mongoose from 'mongoose';

const stockAdjustmentSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    adjustmentNumber: { type: String, required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    type: {
      type: String,
      enum: ['DAMAGED', 'STOLEN', 'MISSING', 'FOUND', 'PHYSICAL_COUNT_AUDIT'],
      required: true,
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        inventoryUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryUnit' },
        imeiOrSerial: { type: String },
        quantity: { type: Number, required: true, default: 1 },
        reason: { type: String },
      },
    ],
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
    adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

stockAdjustmentSchema.index({ tenantId: 1, adjustmentNumber: 1 }, { unique: true, sparse: true });

export const StockAdjustment = mongoose.model('StockAdjustment', stockAdjustmentSchema);
