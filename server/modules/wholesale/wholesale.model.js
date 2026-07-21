import mongoose from 'mongoose';

const wholesalePriceSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    tier: { type: String, required: true, trim: true },
    minQty: { type: Number, required: true, min: 1 },
    maxQty: { type: Number },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

wholesalePriceSchema.index({ product: 1, tier: 1 });

const wholesaleOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      productName: { type: String },
      quantity: { type: Number, required: true, min: 1 },
      unitPrice: { type: Number, required: true },
      total: { type: Number, required: true },
    }],
    subTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['CASH', 'BKASH', 'ROCKET', 'NAGAD', 'BANK', 'CHEQUE'], default: 'CASH' },
    status: { type: String, enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'], default: 'PENDING' },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

wholesaleOrderSchema.index({ customer: 1 });

export const WholesalePrice = mongoose.model('WholesalePrice', wholesalePriceSchema);
export const WholesaleOrder = mongoose.model('WholesaleOrder', wholesaleOrderSchema);
