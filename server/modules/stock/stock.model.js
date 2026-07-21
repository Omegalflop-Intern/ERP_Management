import mongoose from 'mongoose';

const stockTransferSchema = new mongoose.Schema(
  {
    transferNumber: { type: String, required: true, unique: true },
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

export const StockTransfer = mongoose.model('StockTransfer', stockTransferSchema);
