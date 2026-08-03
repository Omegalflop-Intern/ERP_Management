import mongoose from 'mongoose';
import { encryptText, decryptText } from '../../utils/crypto.utils.js';

const employeeSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employeeId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    designation: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    branch: { type: String, default: 'Main', trim: true },
    salary: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, required: true },
    emergencyContact: { type: String, trim: true },
    address: { type: String, trim: true },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''], default: '' },
    nidNumber: {
      type: String,
      trim: true,
      get: decryptText,
      set: encryptText,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toObject: { getters: true },
    toJSON: { getters: true },
  }
);

employeeSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true, sparse: true });
employeeSchema.index({ name: 'text', phone: 'text', designation: 'text', department: 'text' });

export const Employee = mongoose.model('Employee', employeeSchema);
