import mongoose from 'mongoose';
import { encryptText, decryptText } from '../../utils/crypto.utils.js';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      get: decryptText,
      set: encryptText,
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

customerSchema.index({ name: 'text' });

export const Customer = mongoose.model('Customer', customerSchema);
