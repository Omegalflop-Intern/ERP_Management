import mongoose from 'mongoose';

const passportEventSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  event: { type: String, required: true },
  details: { type: String },
  performedBy: { type: String },
  amount: { type: Number },
});

const inventoryUnitSchema = new mongoose.Schema(
  {
    imeiOrSerial: { type: String, required: true, unique: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    status: {
      type: String,
      enum: ['Available', 'Reserved', 'Sold', 'Returned', 'Defective', 'Sent for Repair', 'Display Unit', 'Transferred'],
      default: 'Available',
      index: true,
    },
    purchasePrice: { type: Number, required: true },
    currentSellingPrice: { type: Number, required: true },
    warrantyMonths: { type: Number, default: 12 },
    warrantyExpiry: { type: Date },
    color: { type: String, trim: true },
    ram: { type: String, trim: true },
    storage: { type: String, trim: true },
    soldToCustomerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    soldInvoiceNumber: { type: String },
    soldAt: { type: Date },
    passportHistory: [passportEventSchema],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const InventoryUnit = mongoose.model('InventoryUnit', inventoryUnitSchema);
