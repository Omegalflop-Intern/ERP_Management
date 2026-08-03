import mongoose from 'mongoose';

const documentVaultSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    entityType: { type: String, enum: ['Investor', 'Lender', 'Borrower', 'Loan'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    documentType: { type: String, enum: ['Legal Document', 'Cheque', 'NID', 'Other'], default: 'Other' },
    title: { type: String, required: true, trim: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true }, // size in bytes (max 5MB = 5 * 1024 * 1024)
    mimeType: { type: String, required: true },
    notes: { type: String },
    uploadedBy: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

documentVaultSchema.index({ entityType: 1, entityId: 1 });

export const DocumentVault = mongoose.model('DocumentVault', documentVaultSchema);
