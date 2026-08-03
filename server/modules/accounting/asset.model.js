import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    assetName: { type: String, required: true, trim: true },
    category: { type: String, enum: ['FURNITURE', 'EQUIPMENT', 'ELECTRONICS', 'VEHICLE', 'OTHER'], default: 'EQUIPMENT' },
    purchaseDate: { type: Date, required: true },
    purchaseCost: { type: Number, required: true },
    usefulLifeMonths: { type: Number, required: true, default: 36 },
    salvageValue: { type: Number, default: 0 },
    currentBookValue: { type: Number, required: true },
    depreciationMethod: { type: String, enum: ['STRAIGHT_LINE', 'REDUCING_BALANCE'], default: 'STRAIGHT_LINE' },
    depreciationSchedule: [
      {
        month: { type: Date },
        depreciationAmount: { type: Number },
        remainingValue: { type: Number },
        isProcessed: { type: Boolean, default: false },
      },
    ],
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Asset = mongoose.model('Asset', assetSchema);
