import mongoose from 'mongoose';

const loyaltyAccountSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true },
    pointsBalance: { type: Number, default: 0 },
    tier: { type: String, enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'], default: 'BRONZE' },
    totalPointsEarned: { type: Number, default: 0 },
    totalPointsRedeemed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
    discountValue: { type: Number, required: true },
    minPurchaseAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    usageLimit: { type: Number, default: 100 },
    timesUsed: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const giftCardSchema = new mongoose.Schema(
  {
    cardNumber: { type: String, required: true, unique: true },
    initialBalance: { type: Number, required: true },
    currentBalance: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    isClaimed: { type: Boolean, default: false },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const LoyaltyAccount = mongoose.model('LoyaltyAccount', loyaltyAccountSchema);
export const Coupon = mongoose.model('Coupon', couponSchema);
export const GiftCard = mongoose.model('GiftCard', giftCardSchema);
