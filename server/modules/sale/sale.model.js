import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  imeiOrSerial: { type: String },
  description: { type: String, required: true },
  qty: { type: Number, default: 1 },
  returnedQty: { type: Number, default: 0 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
});

const returnLogSchema = new mongoose.Schema({
  lineItemId: { type: mongoose.Schema.Types.ObjectId },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  imeiOrSerial: { type: String },
  qty: { type: Number, default: 1 },
  refundAmount: { type: Number, default: 0 },
  reason: { type: String },
  notes: { type: String },
  processedBy: { type: String, default: 'system' },
  returnedAt: { type: Date, default: Date.now },
});

const transactionSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    txType: { type: String, enum: ['SALE', 'PURCHASE', 'RETURN', 'REPAIR_PAYMENT', 'EXPENSE', 'TRANSFER'], required: true },
    saleType: { type: String, enum: ['RETAIL', 'WHOLESALE'], default: 'RETAIL' },
    status: { type: String, enum: ['COMPLETED', 'PARTIALLY_RETURNED', 'RETURNED', 'CANCELLED'], default: 'COMPLETED' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity' },
    lineItems: [lineItemSchema],
    returnLogs: [returnLogSchema],
    customerName: { type: String },
    customerPhone: { type: String },
    customerEmail: { type: String },
    customerAddress: { type: String },
    subTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    netTotal: { type: Number, required: true },
    returnedAmount: { type: Number, default: 0 },
    paymentBreakdown: {
      cash: { type: Number, default: 0 },
      bkash: { type: Number, default: 0 },
      rocket: { type: Number, default: 0 },
      nagad: { type: Number, default: 0 },
      bank: { type: Number, default: 0 },
      dueAmount: { type: Number, default: 0 },
    },
    cashierUsername: { type: String },
    sellerName: { type: String },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);
