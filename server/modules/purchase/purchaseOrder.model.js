import mongoose from 'mongoose';

const poLineItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  description: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  receivedQty: { type: Number, default: 0 },
  returnedQty: { type: Number, default: 0 },
  unitCost: { type: Number, required: true },
  totalCost: { type: Number, required: true },
});

const grnEntrySchema = new mongoose.Schema({
  imeiOrSerial: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  warrantyMonths: { type: Number, default: 12 },
  receivedAt: { type: Date, default: Date.now },
  receivedBy: { type: String },
});

const returnLogSchema = new mongoose.Schema({
  imeiOrSerial: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  purchasePrice: { type: Number, required: true },
  reason: { type: String },
  returnedBy: { type: String },
  returnedAt: { type: Date, default: Date.now },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    poNumber: { type: String, required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
      default: 'DRAFT',
    },
    lineItems: [poLineItemSchema],
    grnEntries: [grnEntrySchema],
    returnLogs: [returnLogSchema],
    returnedCount: { type: Number, default: 0 },
    returnedAmount: { type: Number, default: 0 },
    returnedDate: { type: Date },
    subTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    netTotal: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['CASH', 'BANK', 'BKASH', 'ROCKET', 'NAGAD', 'CREDIT'], default: 'CREDIT' },
    expectedDeliveryDate: { type: Date },
    receivedDate: { type: Date },
    notes: { type: String },
    createdBy: { type: String },
    approvedBy: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ tenantId: 1, poNumber: 1 }, { unique: true, sparse: true });
purchaseOrderSchema.index({ supplierId: 1, status: 1 });

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
