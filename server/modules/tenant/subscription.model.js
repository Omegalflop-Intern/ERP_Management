import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    description: { type: String, default: '' },
    monthlyPrice: { type: Number, required: true, default: 0 },
    yearlyPrice: { type: Number, required: true, default: 0 },
    trialDays: { type: Number, default: 0 },
    maxBranches: { type: Number, required: true, default: 1 },
    maxUsers: { type: Number, required: true, default: 3 },
    maxProducts: { type: Number, default: -1 },
    maxCustomers: { type: Number, default: -1 },
    maxStorageMB: { type: Number, default: -1 },
    features: [{ type: String }],
    isPublic: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
