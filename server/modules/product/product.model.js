import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    model: { type: String, trim: true },
    sku: { type: String, required: true, uppercase: true },
    barcode: { type: String, sparse: true },
    ram: { type: String },
    storage: { type: String },
    color: { type: String },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    wholesalePrice: { type: Number },
    vatRate: { type: Number, default: 0 },
    unit: { type: String, default: 'piece' },
    minStockAlert: { type: Number, default: 2 },
    stockQuantity: { type: Number, default: 0 },
    warrantyMonths: { type: Number, default: 12 },
    image: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ tenantId: 1, sku: 1 }, { unique: true, sparse: true });
productSchema.index({ name: 'text', brand: 'text', sku: 'text' });

export const Product = mongoose.model('Product', productSchema);
