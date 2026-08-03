import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // FREE, STARTER, PRO, ENTERPRISE
    displayName: { type: String, required: true },
    monthlyPrice: { type: Number, required: true, default: 0 },
    yearlyPrice: { type: Number, required: true, default: 0 },
    maxBranches: { type: Number, required: true, default: 1 },
    maxUsers: { type: Number, required: true, default: 3 },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
