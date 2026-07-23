import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    category: { type: String, default: 'general' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const defaultSettings = [
  { key: 'companyName', value: 'Brothers Mobile', category: 'company' },
  { key: 'companySlogan', value: 'Your Trusted Mobile & Electronics Partner', category: 'company' },
  { key: 'companyAddress', value: 'Level 3, Shop 304, Multiplan Center, New Elephant Road, Dhaka-1205', category: 'company' },
  { key: 'companyPhone', value: '+880 1700-000000, +880 1800-000000', category: 'company' },
  { key: 'companyEmail', value: 'sales@brothersmobile.bd', category: 'company' },
  { key: 'companyLogo', value: '', category: 'company' },
  { key: 'binVat', value: 'BIN: 004829103-0101', category: 'company' },
  { key: 'currency', value: 'BDT', category: 'finance' },
  { key: 'currencySymbol', value: '৳', category: 'finance' },
  { key: 'defaultVatRate', value: 15, category: 'finance' },
  { key: 'taxEnabled', value: false, category: 'finance' },
  { key: 'lowStockThreshold', value: 5, category: 'inventory' },
  { key: 'autoReorderEnabled', value: false, category: 'inventory' },
  { key: 'defaultWarrantyMonths', value: 12, category: 'warranty' },
  { key: 'invoiceFooter', value: 'Thank you for shopping with us!', category: 'invoice' },
  { key: 'invoiceTerms', value: '1. Original receipt & intact IMEI sticker required for warranty claims.  2. Software, liquid or physical damage excluded.', category: 'invoice' },
  { key: 'printEngine', value: 'VECTOR', category: 'printing' },
  { key: 'printerProfiles', value: [
      { name: 'Default A4', paper: 'A4', autoPrint: false, copies: 1 },
      { name: 'Thermal Counter', paper: '80mm', autoHeight: true, copies: 1 },
    ], category: 'printing' },
  { key: 'receiptMaker', value: { paperSize: '80mm', showLogo: true, customHeader: 'Welcome to Mobile Shop', customFooter: 'Warranty valid for 12 months with invoice.' }, category: 'printing' },
  { key: 'approvalRules', value: { maxExpenseWithoutApproval: 5000, maxDiscountWithoutApproval: 1000 }, category: 'security' },
  { key: 'timezone', value: 'Asia/Dhaka', category: 'system' },
  { key: 'dateFormat', value: 'YYYY-MM-DD', category: 'system' },
];

settingsSchema.statics.seedDefaults = async function () {
  for (const s of defaultSettings) {
    await this.findOneAndUpdate({ key: s.key }, { $setOnInsert: s }, { upsert: true });
  }
};

export const Settings = mongoose.model('Settings', settingsSchema);
