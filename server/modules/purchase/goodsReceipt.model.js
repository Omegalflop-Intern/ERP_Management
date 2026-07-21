import mongoose from 'mongoose';

const goodsReceiptSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, required: true, unique: true },
    purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    receivedItems: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        imeiOrSerials: [{ type: String }],
        quantity: { type: Number, required: true },
        unitCost: { type: Number, required: true },
        totalCost: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    remarks: { type: String },
  },
  { timestamps: true }
);

export const GoodsReceipt = mongoose.model('GoodsReceipt', goodsReceiptSchema);
