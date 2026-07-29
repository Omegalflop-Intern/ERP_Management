import mongoose from 'mongoose';
import { encryptText, decryptText } from '../../utils/crypto.utils.js';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
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
  },
  {
    timestamps: true,
    toObject: { getters: true },
    toJSON: { getters: true },
  }
);

export const User = mongoose.model('User', userSchema);
