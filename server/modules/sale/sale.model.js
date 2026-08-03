import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  imeiOrSerial: { type: String },
  description: { type: String, required: true },
  qty: { type: Number, default: 1 },
  returnedQty: { type: Number, default: 0 },
  unitPrice: { type: Number, required: true },
  unitCost: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
});

const returnLogSchema = new mongoose.Schema({
  returnInvoiceNumber: { type: String },
  lineItemId: { type: mongoose.Schema.Types.ObjectId },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  description: { type: String },
  imeiOrSerial: { type: String },
  qty: { type: Number, default: 1 },
  originalUnitPrice: { type: Number, default: 0 },
  effectiveUnitPrice: { type: Number, default: 0 },
  refundAmount: { type: Number, default: 0 },
  reason: { type: String },
  notes: { type: String },
  processedBy: { type: String, default: 'system' },
  returnedAt: { type: Date, default: Date.now },
});

const transactionSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    invoiceNumber: { type: String, required: true },
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
    publicToken: { type: String, index: true, sparse: true },
    tokenExpiresAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

transactionSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true, sparse: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);
