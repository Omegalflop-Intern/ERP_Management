import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String },
    customerPhone: { type: String },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
      },
    ],
    subTotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    netTotal: { type: Number, required: true },
    validUntil: { type: Date },
    status: { type: String, enum: ['DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'CONVERTED'], default: 'DRAFT' },
    createdBY: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Quotation = mongoose.model('Quotation', quotationSchema);
