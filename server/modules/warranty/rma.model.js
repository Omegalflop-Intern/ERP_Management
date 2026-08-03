import mongoose from 'mongoose';

const rmaSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    rmaNumber: { type: String, required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    items: [
      {
        inventoryUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryUnit' },
        imeiOrSerial: { type: String, required: true },
        defectReason: { type: String, required: true },
        status: { type: String, enum: ['PENDING', 'SENT_TO_SUPPLIER', 'REPLACED', 'CREDITED', 'REJECTED'], default: 'PENDING' },
      },
    ],
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'CLOSED'], default: 'OPEN' },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

rmaSchema.index({ tenantId: 1, rmaNumber: 1 }, { unique: true, sparse: true });

export const RMA = mongoose.model('RMA', rmaSchema);
