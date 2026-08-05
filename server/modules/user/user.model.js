import mongoose from 'mongoose';
import { encryptText, decryptText } from '../../utils/crypto.utils.js';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    roleName: { type: String, required: true },
    fullName: { type: String, trim: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    commissionRate: { type: Number, default: 0 },
    otpCode: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    otpLockedUntil: { type: Date, select: false },
    mfaSecret: {
      type: String,
      select: false,
      get: decryptText,
      set: encryptText,
    },
    isMfaEnabled: { type: Boolean, default: false },
    mfaBackupCodes: [{ type: String, select: false }],
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLoginAt: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    isDeleted: { type: Boolean, default: false },
    isTempAdmin: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toObject: { getters: true },
    toJSON: { getters: true },
  }
);

// Compound unique index: username must be unique per tenant (not globally)
// sparse: true allows multiple documents with null tenantId (super admin users)
userSchema.index({ username: 1, tenantId: 1 }, { unique: true, sparse: true });

export const User = mongoose.model('User', userSchema);
