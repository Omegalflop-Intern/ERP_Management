import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'],
      required: true,
    },
    subType: {
      type: String,
      enum: [
        'CURRENT_ASSET', 'FIXED_ASSET',
        'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY',
        'OWNERS_EQUITY', 'RETAINED_EARNINGS',
        'SALES_REVENUE', 'OTHER_REVENUE',
        'COST_OF_GOODS', 'OPERATING_EXPENSE', 'OTHER_EXPENSE',
      ],
      required: true,
    },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    balance: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

accountSchema.index({ type: 1 });
accountSchema.index({ tenantId: 1, code: 1 }, { unique: true, sparse: true });
accountSchema.index({ name: 'text', code: 'text' });

export const Account = mongoose.model('Account', accountSchema);
