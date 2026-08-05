import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    shopName: { type: String, required: true, trim: true },
    logo: { type: String, default: null },
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    plan: {
      type: String,
      enum: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'],
      default: 'STARTER',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'PENDING_KYC', 'DELETED'],
      default: 'PENDING_KYC',
    },
    maxBranches: { type: Number, default: 2 },
    maxUsers: { type: Number, default: 5 },
    expiresAt: { type: Date },
    kycDocuments: {
      nidNumber: { type: String, trim: true },
      nidFront: { type: String },
      nidBack: { type: String },
      tradeLicenseNumber: { type: String, trim: true },
      tradeLicenseFile: { type: String },
      tinCertificate: { type: String },
      ownerPhoto: { type: String },
      kycStatus: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
      },
      rejectionReason: { type: String },
      reviewedAt: { type: Date },
    },
    isDeleted: { type: Boolean, default: false },
    pausedReason: { type: String },
    pausedAt: { type: Date },
    gracePeriodDays: { type: Number, default: 0 },
    lastWarningSent: { type: Date },
    subdomain: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
      minlength: 3,
      maxlength: 63,
    },
    customDomain: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    dnsVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Tenant = mongoose.model('Tenant', tenantSchema);
