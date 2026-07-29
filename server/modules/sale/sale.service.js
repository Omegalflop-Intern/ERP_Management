import { Transaction } from './sale.model.js';
import { InventoryUnit } from '../imei/imei.model.js';
import { Customer } from '../customer/customer.model.js';
import { Product } from '../product/product.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';
import { escapeRegex } from '../../utils/system/helpers.js';
import { createAutomatedSaleJournal, createAutomatedReturnJournal } from '../accounting/accounting.service.js';
import crypto from 'crypto';

const generateInvoiceNumber = async () => {
  const count = await Transaction.countDocuments({ txType: 'SALE', isDeleted: false });
  const num = (count + 1).toString().padStart(5, '0');
  return `INV-${new Date().getFullYear()}-${num}`;
};

export const createSale = async (data, createdBy = 'system') => {
  const invoiceNumber = await generateInvoiceNumber();

  let subTotal = 0;
  const lineItems = [];

  for (const item of data.items) {
    const product = await Product.findOne({ _id: item.productId, isDeleted: false });
    if (!product) throw ApiError.notFound(`Product not found: ${item.productId}`);

    if (item.imeiOrSerial) {
      const unit = await InventoryUnit.findOne({ imeiOrSerial: item.imeiOrSerial, isDeleted: false });
      if (!unit) throw ApiError.notFound(`IMEI not found: ${item.imeiOrSerial}`);
      if (unit.status !== 'Available') throw ApiError.badRequest(`IMEI ${item.imeiOrSerial} is ${unit.status}`);

      const soldDate = new Date();
      unit.status = 'Sold';
      unit.soldInvoiceNumber = invoiceNumber;
      unit.soldAt = soldDate;
      if (unit.warrantyMonths) {
        const expiry = new Date(soldDate);
        expiry.setMonth(expiry.getMonth() + unit.warrantyMonths);
        unit.warrantyExpiry = expiry;
      }
      unit.passportHistory.push({
        event: 'SOLD',
        details: `Sold on ${invoiceNumber} to ${data.customerName || 'Walk-in'}`,
        amount: item.unitPrice,
        performedBy: createdBy,
      });
      await unit.save();

      // Sync stockQuantity for IMEI-tracked products from actual available count
      const availCount = await InventoryUnit.countDocuments({ productId: item.productId, status: 'Available', isDeleted: false });
      await Product.updateOne({ _id: item.productId }, { stockQuantity: availCount }).catch(() => {});
    } else {
      // Bulk product (stockQuantity-based) — verify sufficient stock
      const requestedQty = Math.abs(item.qty || 1);
      if (product.stockQuantity < requestedQty) {
        throw ApiError.badRequest(`Insufficient stock for "${product.name}". Available: ${product.stockQuantity} pcs, Requested: ${requestedQty} pcs`);
      }
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stockQuantity: -requestedQty } }
      ).catch(() => {});
    }

    const itemTotal = (item.unitPrice * item.qty) - (item.discount || 0);
    subTotal += itemTotal;
    lineItems.push({
      productId: item.productId,
      imeiOrSerial: item.imeiOrSerial,
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
      totalPrice: itemTotal,
    });
  }

  const netTotal = subTotal - (data.discount || 0) + (data.tax || 0);
  const paidAmount = (data.paymentBreakdown?.cash || 0) +
    (data.paymentBreakdown?.bkash || 0) +
    (data.paymentBreakdown?.rocket || 0) +
    (data.paymentBreakdown?.nagad || 0) +
    (data.paymentBreakdown?.bank || 0);
  const dueAmount = netTotal - paidAmount;

  if (dueAmount > 0 && !data.customerPhone) {
    throw ApiError.badRequest('Customer phone is required for due amount');
  }

  let customerId = data.customerId;
  let customerObj = null;

  if (customerId) {
    customerObj = await Customer.findOne({ _id: customerId, isDeleted: false });
  } else if (data.customerPhone && data.customerPhone.trim()) {
    const phoneVal = data.customerPhone.trim();
    customerObj = await Customer.findOne({ phone: phoneVal, isDeleted: false });
    if (!customerObj) {
      customerObj = await Customer.create({
        name: data.customerName || 'Walk-in Customer',
        phone: phoneVal,
        email: data.customerEmail || '',
        address: data.customerAddress || '',
      });
    }
    customerId = customerObj._id;
  }

  if (customerObj) {
    customerObj.totalPurchases = (customerObj.totalPurchases || 0) + netTotal;
    customerObj.dueBalance = (customerObj.dueBalance || 0) + dueAmount;
    if (data.customerName && data.customerName !== 'Walk-in Customer' && !data.customerId) {
      customerObj.name = data.customerName;
    }
    if (data.customerEmail) customerObj.email = data.customerEmail;
    if (data.customerAddress) customerObj.address = data.customerAddress;
    await customerObj.save();
  }

  const soldImeis = lineItems.map(i => i.imeiOrSerial).filter(Boolean);
  if (soldImeis.length > 0 && customerId) {
    await InventoryUnit.updateMany(
      { imeiOrSerial: { $in: soldImeis } },
      { soldToCustomerId: customerId }
    ).catch(() => {});
  }

  const finalCustomerName = data.customerName || customerObj?.name || 'Walk-in Customer';
  const finalCustomerPhone = data.customerPhone || customerObj?.phone || 'N/A';
  const finalCustomerEmail = data.customerEmail || customerObj?.email || '';
  const finalCustomerAddress = data.customerAddress || customerObj?.address || '';

  const sale = await Transaction.create({
    invoiceNumber,
    txType: 'SALE',
    saleType: data.saleType || (customerObj?.customerType === 'B2B' ? 'WHOLESALE' : 'RETAIL'),
    customerId: customerId || null,
    customerName: finalCustomerName,
    customerPhone: finalCustomerPhone,
    customerEmail: finalCustomerEmail,
    customerAddress: finalCustomerAddress,
    lineItems,
    subTotal,
    discount: data.discount || 0,
    tax: data.tax || 0,
    netTotal,
    paymentBreakdown: {
      cash: data.paymentBreakdown?.cash || 0,
      bkash: data.paymentBreakdown?.bkash || 0,
      rocket: data.paymentBreakdown?.rocket || 0,
      nagad: data.paymentBreakdown?.nagad || 0,
      bank: data.paymentBreakdown?.bank || 0,
      dueAmount,
    },
    cashierUsername: createdBy,
    sellerName: data.sellerName || createdBy,
    sellerId: data.sellerId || null,
    publicToken: crypto.randomBytes(24).toString('hex'),
    tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await createAutomatedSaleJournal(sale).catch(err => console.error('Sale journal failed:', err));

  return sale;
};

export const getAllSales = async (page = 1, limit = 20, filters = {}) => {
  const query = { isDeleted: false, txType: 'SALE' };

  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to + 'T23:59:59');
  }

  if (filters.customer) {
    query.$or = [
      { customerName: { $regex: filters.customer, $options: 'i' } },
      { customerPhone: { $regex: filters.customer, $options: 'i' } },
    ];
  }

  if (filters.status) query.status = filters.status;
  if (filters.saleType) query.saleType = filters.saleType.toUpperCase();
  if (filters.paymentMethod) {
    if (filters.paymentMethod === 'cash') query['paymentBreakdown.cash'] = { $gt: 0 };
    if (filters.paymentMethod === 'bkash') query['paymentBreakdown.bkash'] = { $gt: 0 };
    if (filters.paymentMethod === 'due') query['paymentBreakdown.dueAmount'] = { $gt: 0 };
  }

  const total = await Transaction.countDocuments(query);
  const sales = await paginate(
    Transaction.find(query).populate('customerId'),
    page, limit
  ).sort({ createdAt: -1 });

  return { sales, pagination: getPagination(total, page, limit) };
};

export const getSaleById = async (id) => {
  const sale = await Transaction.findOne({ _id: id, isDeleted: false })
    .populate('customerId')
    .populate('lineItems.productId');
  if (!sale) throw ApiError.notFound('Sale not found');
  return sale;
};

export const getSaleByInvoice = async (invoiceQuery) => {
  if (!invoiceQuery || !invoiceQuery.trim()) {
    throw ApiError.badRequest('Invoice search query is required');
  }

  const safeQuery = escapeRegex(invoiceQuery.trim());
  const regex = new RegExp(safeQuery, 'i');

  let sale = await Transaction.findOne({
    isDeleted: false,
    txType: 'SALE',
    $or: [
      { invoiceNumber: { $regex: regex } },
      { customerName: { $regex: regex } },
      { customerPhone: { $regex: regex } },
      { 'lineItems.imeiOrSerial': { $regex: regex } },
    ],
  })
    .populate('customerId')
    .populate('lineItems.productId')
    .sort({ createdAt: -1 });

  if (!sale) {
    throw ApiError.notFound(`No sale found matching "${invoiceQuery}"`);
  }

  return sale;
};

export const getSaleByPublicToken = async (token) => {
  if (!token) throw ApiError.badRequest('Invalid token');

  const sale = await Transaction.findOne({
    publicToken: token,
    isDeleted: false,
    txType: 'SALE',
  })
    .populate('customerId')
    .populate('lineItems.productId');

  if (!sale) throw ApiError.notFound('Invoice not found or link has expired');
  if (sale.tokenExpiresAt && sale.tokenExpiresAt < new Date()) {
    throw ApiError.gone('This invoice link has expired (valid for 7 days)');
  }

  return sale;
};

const generateReturnInvoiceNumber = async () => {
  const result = await Transaction.aggregate([
    { $match: { isDeleted: false, 'returnLogs.0': { $exists: true } } },
    { $unwind: '$returnLogs' },
    { $count: 'total' }
  ]);
  const total = result[0]?.total || 0;
  const num = (total + 1).toString().padStart(5, '0');
  return `RET-${new Date().getFullYear()}-${num}`;
};

export const processReturn = async (saleId, returnData, processedBy = 'system') => {
  const sale = await Transaction.findOne({ _id: saleId, isDeleted: false });
  if (!sale) throw ApiError.notFound('Sale not found');

  let totalRefundForTx = 0;
  if (!sale.returnLogs) sale.returnLogs = [];

  const returnInvoiceNumber = await generateReturnInvoiceNumber();

  for (const ret of returnData.items) {
    // Find line item by lineItemId or by productId / imeiOrSerial
    let lineItem = sale.lineItems.id(ret.lineItemId);
    if (!lineItem) {
      lineItem = sale.lineItems.find(li => 
        (ret.imeiOrSerial && li.imeiOrSerial === ret.imeiOrSerial) || 
        (ret.productId && li.productId?.toString() === ret.productId.toString())
      );
    }
    if (!lineItem) throw ApiError.notFound(`Line item not found: ${ret.lineItemId || ret.productId}`);

    const returnQty = Math.min(ret.quantity || 1, lineItem.qty - (lineItem.returnedQty || 0));
    if (returnQty <= 0) {
      continue; // Item already fully returned
    }

    // Effective unit price calculation:
    // Takes lineItem.totalPrice (which already has item-level discount) and scales by global sale discount factor
    const globalDiscountFactor = (sale.subTotal > 0 && sale.netTotal < sale.subTotal)
      ? (sale.netTotal / sale.subTotal)
      : 1;
    const baseEffectiveUnitPrice = lineItem.qty > 0 ? (lineItem.totalPrice / lineItem.qty) : lineItem.unitPrice;
    const effectiveUnitPrice = Math.round(baseEffectiveUnitPrice * globalDiscountFactor);

    const itemRefund = Math.round(effectiveUnitPrice * returnQty);
    lineItem.returnedQty = (lineItem.returnedQty || 0) + returnQty;
    totalRefundForTx += itemRefund;

    if (ret.imeiOrSerial || lineItem.imeiOrSerial) {
      const targetImei = ret.imeiOrSerial || lineItem.imeiOrSerial;
      const unit = await InventoryUnit.findOne({ imeiOrSerial: targetImei, isDeleted: false });
      if (unit) {
        unit.status = 'Available'; // Returned back to inventory stock!
        unit.soldInvoiceNumber = null;
        unit.soldAt = null;
        unit.passportHistory.push({
          event: 'RETURNED',
          details: `Returned from ${sale.invoiceNumber} (${returnInvoiceNumber}) — Reason: ${ret.reason || 'Customer return'}`,
          amount: itemRefund,
          performedBy: processedBy,
        });
        await unit.save();
      }
      // Sync IMEI stock count for Product
      if (lineItem.productId) {
        const availCount = await InventoryUnit.countDocuments({ productId: lineItem.productId, status: 'Available', isDeleted: false });
        await Product.updateOne({ _id: lineItem.productId }, { stockQuantity: availCount }).catch(() => {});
      }
    } else if (lineItem.productId) {
      // Bulk product — restore stock quantity
      await Product.updateOne(
        { _id: lineItem.productId },
        { $inc: { stockQuantity: Math.abs(returnQty) } }
      ).catch(() => {});
    }

    sale.returnLogs.push({
      returnInvoiceNumber,
      lineItemId: lineItem._id,
      productId: lineItem.productId,
      description: lineItem.description || 'Product',
      imeiOrSerial: ret.imeiOrSerial || lineItem.imeiOrSerial,
      qty: returnQty,
      originalUnitPrice: lineItem.unitPrice,
      effectiveUnitPrice,
      refundAmount: itemRefund,
      reason: ret.reason || 'defective',
      notes: ret.notes || '',
      processedBy,
      returnedAt: new Date(),
    });
  }

  if (totalRefundForTx <= 0) {
    throw ApiError.badRequest('Selected items have already been fully returned');
  }

  sale.returnedAmount = (sale.returnedAmount || 0) + totalRefundForTx;

  // Check if fully returned or partially returned
  const totalItemsCount = sale.lineItems.reduce((acc, li) => acc + li.qty, 0);
  const totalReturnedCount = sale.lineItems.reduce((acc, li) => acc + (li.returnedQty || 0), 0);

  if (totalReturnedCount >= totalItemsCount || sale.returnedAmount >= sale.netTotal) {
    sale.status = 'RETURNED';
  } else if (totalReturnedCount > 0 || sale.returnedAmount > 0) {
    sale.status = 'PARTIALLY_RETURNED';
  }

  // Adjust customer due / total purchases if linked to customer
  if (sale.customerId) {
    const customer = await Customer.findOne({ _id: sale.customerId, isDeleted: false });
    if (customer) {
      customer.dueBalance = Math.max(0, customer.dueBalance - totalRefundForTx);
      customer.totalPurchases = Math.max(0, customer.totalPurchases - totalRefundForTx);
      await customer.save();
    }
  }

  // Adjust sale due amount
  if (sale.paymentBreakdown) {
    sale.paymentBreakdown.dueAmount = Math.max(0, (sale.paymentBreakdown.dueAmount || 0) - totalRefundForTx);
  }

  await sale.save();
  await createAutomatedReturnJournal(sale, totalRefundForTx, returnInvoiceNumber).catch(err => console.error('Return journal failed:', err));

  return { sale, refundAmount: totalRefundForTx, returnInvoiceNumber };
};

export const deleteSale = async (id) => {
  const sale = await Transaction.findOne({ _id: id, isDeleted: false });
  if (!sale) throw ApiError.notFound('Sale not found');
  sale.isDeleted = true;
  await sale.save();
  return sale;
};

export const updateSale = async (id, data) => {
  const sale = await Transaction.findOne({ _id: id, isDeleted: false });
  if (!sale) throw ApiError.notFound('Sale not found');
  if (data.paymentBreakdown) sale.paymentBreakdown = data.paymentBreakdown;
  if (data.status) sale.status = data.status;
  await sale.save();
  return sale;
};
