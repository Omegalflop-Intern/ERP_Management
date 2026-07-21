import mongoose from 'mongoose';

const catalogItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['CATEGORY', 'BRAND'], required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

catalogItemSchema.index({ name: 1, type: 1 }, { unique: true });
catalogItemSchema.index({ name: 'text' });

export const CatalogItem = mongoose.model('CatalogItem', catalogItemSchema);
