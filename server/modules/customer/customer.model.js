import mongoose from 'mongoose';
import { encryptText, decryptText } from '../../utils/crypto.utils.js';

const customerSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      trim: true,
      get: decryptText,
      set: encryptText,
    },
    phoneHash: {
      type: String,
      sparse: true,
      index: true,
    },
    email: { type: String, trim: true, lowercase: true },
    address: {
      type: String,
      trim: true,
      get: decryptText,
      set: encryptText,
    },
    customerType: { type: String, enum: ['INDIVIDUAL', 'B2B'], default: 'INDIVIDUAL' },
    companyName: { type: String, trim: true },
    binOrTaxId: { type: String, trim: true },
    dueBalance: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toObject: { getters: true },
    toJSON: { getters: true },
  }
);

customerSchema.index({ tenantId: 1, phoneHash: 1 }, { unique: true, sparse: true });
customerSchema.index({ name: 'text' });

export const Customer = mongoose.model('Customer', customerSchema);
