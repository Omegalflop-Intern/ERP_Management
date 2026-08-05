import mongoose from 'mongoose';

const tempAdminSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, default: '' },
    duration: { type: Number, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'REVOKED'],
      default: 'ACTIVE',
    },
    lastLoginAt: { type: Date },
    revokedAt: { type: Date },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

tempAdminSchema.index({ tenantId: 1, status: 1 });
tempAdminSchema.index({ userId: 1 });
tempAdminSchema.index({ createdBy: 1 });

export const TempAdmin = mongoose.model('TempAdmin', tempAdminSchema);
