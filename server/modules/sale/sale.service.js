import { Transaction } from './sale.model.js';
import { InventoryUnit } from '../imei/imei.model.js';
import { Customer } from '../customer/customer.model.js';
import { Product } from '../product/product.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';
import { escapeRegex } from '../../utils/system/helpers.js';
import { hashText } from '../../utils/crypto.utils.js';
import {
  createAutomatedSaleJournal,
  createAutomatedReturnJournal,
  createAutomatedDueCollectionJournal,
} from '../accounting/accounting.service.js';
import crypto from 'crypto';

const generateInvoiceNumber = async (tenantId = null) => {
  // Count ALL sales (including soft-deleted) so numbers are never reused after a delete
  const query = { txType: 'SALE' };
  if (tenantId) query.tenantId = tenantId;
  const count = await Transaction.countDocuments(query);
  const num = (count + 1).toString().padStart(5, '0');
  return `INV-${new Date().getFullYear()}-${num}`;
};

const withTenant = (query, tenantId) => {
  if (tenantId) query.tenantId = tenantId;
  return query;
};

export const createSale = async (data, createdBy = 'system') => {
  const tenantId = data.tenantId || null;

  let subTotal = 0;
  const lineItems = [];
  const soldImeis = [];
  const productWarrantyMonths = {};

  // Pass 1 — validate products and compute line items WITHOUT side effects.
  // This guarantees no inventory mutation happens for a request that fails validation.
  for (const item of data.items) {
    const productQuery = { _id: item.productId, isDeleted: false };
    withTenant(productQuery, tenantId);
    const product = await Product.findOne(productQuery);
    if (!product) throw ApiError.notFound(`Product not found: ${item.productId}`);
    productWarrantyMonths[item.productId] = product.warrantyMonths || 0;

    let unitCost = product.costPrice || 0;

    if (item.imeiOrSerial) {
      const unit = await InventoryUnit.findOne(
        withTenant({ imeiOrSerial: item.imeiOrSerial, isDeleted: false, status: 'Available' }, tenantId)
      );
      if (!unit) throw ApiError.badRequest(`IMEI ${item.imeiOrSerial} is not available for sale`);
      unitCost = unit.purchasePrice || product.costPrice || 0;
    } else {
      // Bulk product (stockQuantity-based) — verify sufficient stock
      const requestedQty = Math.abs(item.qty || 1);
      if (product.stockQuantity < requestedQty) {
        throw ApiError.badRequest(`Insufficient stock for "${product.name}". Available: ${product.stockQuantity} pcs, Requested: ${requestedQty} pcs`);
      }
    }

    const itemTotal = (item.unitPrice * item.qty) - (item.discount || 0);
    subTotal += itemTotal;
    lineItems.push({
      productId: item.productId,
      imeiOrSerial: item.imeiOrSerial,
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
      unitCost,
      totalPrice: itemTotal,
    });
  }

  const netTotal = subTotal - (data.discount || 0) + (data.tax || 0);
  const paidAmount = (data.paymentBreakdown?.cash || 0) +
    (data.paymentBreakdown?.bkash || 0) +
    (data.paymentBreakdown?.rocket || 0) +
    (data.paymentBreakdown?.nagad || 0) +
    (data.paymentBreakdown?.bank || 0);

  // Overpayment guard — never store a negative dueAmount / unbalanced journal
  if (paidAmount > netTotal + 0.01) {
    throw ApiError.badRequest(`Paid amount (৳${paidAmount.toLocaleString()}) exceeds sale total (৳${netTotal.toLocaleString()})`);
  }
  const dueAmount = netTotal - paidAmount;

  if (dueAmount > 0 && !data.customerPhone) {
    throw ApiError.badRequest('Customer phone is required for due amount');
  }

  // Resolve customer (create if needed) — but DON'T touch balances yet;
  // those only move once the sale record actually persists.
  let customerId = data.customerId;
  let customerObj = null;

  if (customerId) {
    customerObj = await Customer.findOne(withTenant({ _id: customerId, isDeleted: false }, tenantId));
    if (!customerObj) throw ApiError.badRequest('Customer not found');
  } else if (data.customerPhone && data.customerPhone.trim()) {
    const phoneVal = data.customerPhone.trim();
    customerObj = await Customer.findOne(withTenant({ phoneHash: hashText(phoneVal), isDeleted: false }, tenantId));
    if (!customerObj) {
      customerObj = await Customer.create({
        tenantId,
        name: data.customerName || 'Walk-in Customer',
        phone: phoneVal,
        phoneHash: hashText(phoneVal),
        email: data.customerEmail || '',
        address: data.customerAddress || '',
      });
    }
    customerId = customerObj._id;
  }

  const finalCustomerName = data.customerName || customerObj?.name || 'Walk-in Customer';
  const finalCustomerPhone = data.customerPhone || customerObj?.phone || 'N/A';
  const finalCustomerEmail = data.customerEmail || customerObj?.email || '';
  const finalCustomerAddress = data.customerAddress || customerObj?.address || '';

  // Pass 2 — persist with retry. Each attempt flips inventory atomically and is
  // fully compensated (IMEI restored, stock added back) before retrying or throwing.
  let sale = null;
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const invoiceNumber = await generateInvoiceNumber(tenantId);
    const attemptedImeis = [];
    try {
      const soldDate = new Date();
      for (const item of data.items) {
        if (item.imeiOrSerial) {
          // Atomic sell: only flips if still Available (prevents double-sale race)
          const unitUpdate = {
            status: 'Sold',
            soldInvoiceNumber: invoiceNumber,
            soldAt: soldDate,
            $push: {
              passportHistory: {
                event: 'SOLD',
                details: `Sold on ${invoiceNumber} to ${finalCustomerName}`,
                amount: item.unitPrice,
                performedBy: createdBy,
              },
            },
          };
          const warrantyMonths = productWarrantyMonths[item.productId] || 0;
          if (warrantyMonths) {
            const expiry = new Date(soldDate);
            expiry.setMonth(expiry.getMonth() + warrantyMonths);
            unitUpdate.warrantyExpiry = expiry;
          }
          const unit = await InventoryUnit.findOneAndUpdate(
            withTenant({ imeiOrSerial: item.imeiOrSerial, isDeleted: false, status: 'Available' }, tenantId),
            unitUpdate,
            { new: true }
          );
          if (!unit) {
            throw ApiError.badRequest(`IMEI ${item.imeiOrSerial} is not available for sale`);
          }
          attemptedImeis.push(unit.imeiOrSerial);

          const availCount = await InventoryUnit.countDocuments(
            withTenant({ productId: item.productId, status: 'Available', isDeleted: false }, tenantId)
          );
          await Product.updateOne({ _id: item.productId }, { stockQuantity: availCount }).catch(() => {});
        } else {
          // Bulk product — deduct stock (re-validated already in pass 1)
          const requestedQty = Math.abs(item.qty || 1);
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { stockQuantity: -requestedQty } }
          ).catch(() => {});
        }
      }

      if (attemptedImeis.length > 0 && customerId) {
        await InventoryUnit.updateMany(
          withTenant({ imeiOrSerial: { $in: attemptedImeis } }, tenantId),
          { soldToCustomerId: customerId }
        ).catch(() => {});
      }

      sale = await Transaction.create({
        tenantId,
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
      break;
    } catch (err) {
      // Compensate ALL inventory side-effects from this attempt
      if (attemptedImeis.length > 0) {
        await InventoryUnit.updateMany(
          withTenant({ imeiOrSerial: { $in: attemptedImeis }, isDeleted: false, status: 'Sold' }, tenantId),
          {
            $set: { status: 'Available', soldInvoiceNumber: null, soldAt: null, soldToCustomerId: null },
            $pull: { passportHistory: { event: 'SOLD', details: { $regex: `Sold on ${invoiceNumber}` } } },
          }
        ).catch(() => {});
        for (const imei of attemptedImeis) {
          const availCount = await InventoryUnit.countDocuments(
            withTenant({ productId: lineItems.find((li) => li.imeiOrSerial === imei)?.productId, status: 'Available', isDeleted: false }, tenantId)
          );
          await Product.updateOne({ _id: lineItems.find((li) => li.imeiOrSerial === imei)?.productId }, { stockQuantity: availCount }).catch(() => {});
        }
      }
      for (const item of data.items) {
        if (!item.imeiOrSerial) {
          const q = Math.abs(item.qty || 1);
          await Product.updateOne({ _id: item.productId }, { $inc: { stockQuantity: q } }).catch(() => {});
        }
      }
      if (err?.code === 11000) {
        lastError = err;
        continue; // invoice collision — retry with a fresh number
      }
      throw err;
    }
  }

  if (!sale) {
    if (lastError) throw lastError;
    throw ApiError.badRequest('Could not create sale due to invoice number collision');
  }

  // Now that the sale exists, move customer balances
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

  await createAutomatedSaleJournal(sale).catch((err) => {
    console.error('Sale journal failed (manual reconcile via Sync needed):', sale?.invoiceNumber, err);
  });

  return sale;
};

export const getAllSales = async (page = 1, limit = 20, filters = {}) => {
  const query = { isDeleted: false, txType: 'SALE' };
  if (filters.tenantId) {
    query.tenantId = filters.tenantId;
  }

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

export const getSaleById = async (id, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const sale = await Transaction.findOne(query)
    .populate('customerId')
    .populate('lineItems.productId');
  if (!sale) throw ApiError.notFound('Sale not found');
  return sale;
};

export const getSaleByInvoice = async (invoiceQuery, tenantId = null) => {
  if (!invoiceQuery || !invoiceQuery.trim()) {
    throw ApiError.badRequest('Invoice search query is required');
  }

  const safeQuery = escapeRegex(invoiceQuery.trim());
  const regex = new RegExp(safeQuery, 'i');

  const searchQuery = {
    isDeleted: false,
    txType: 'SALE',
    $or: [
      { invoiceNumber: { $regex: regex } },
      { customerName: { $regex: regex } },
      { customerPhone: { $regex: regex } },
      { 'lineItems.imeiOrSerial': { $regex: regex } },
    ],
  };
  if (tenantId) searchQuery.tenantId = tenantId;

  let sale = await Transaction.findOne(searchQuery)
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

const generateReturnInvoiceNumber = async (tenantId = null) => {
  const match = { isDeleted: false, 'returnLogs.0': { $exists: true } };
  if (tenantId) match.tenantId = tenantId;
  const result = await Transaction.aggregate([
    { $match: match },
    { $unwind: '$returnLogs' },
    { $count: 'total' }
  ]);
  const total = result[0]?.total || 0;
  const num = (total + 1).toString().padStart(5, '0');
  return `RET-${new Date().getFullYear()}-${num}`;
};

export const processReturn = async (saleId, returnData, processedBy = 'system', tenantId = null) => {
  const saleQuery = { _id: saleId, isDeleted: false };
  withTenant(saleQuery, tenantId);
  const sale = await Transaction.findOne(saleQuery);
  if (!sale) throw ApiError.notFound('Sale not found');

  let totalRefundForTx = 0;
  let costOfReturned = 0;
  if (!sale.returnLogs) sale.returnLogs = [];

  const returnInvoiceNumber = await generateReturnInvoiceNumber(tenantId);

  for (const ret of returnData.items) {
    // Find line item by lineItemId or by productId / imeiOrSerial
    let lineItem = sale.lineItems.id(ret.lineItemId);
    if (!lineItem) {
      lineItem = sale.lineItems.find(li => 
        (ret.imeiOrSerial && li.imeiOrSerial === ret.imeiOrSerial) || 
        (ret.productId && li.productId?.toString() === ret.productId.toString())
      );
    }
    if (!lineItem) {
      const missing = ret.imeiOrSerial ? `IMEI ${ret.imeiOrSerial}` : (ret.lineItemId ? `line item ${ret.lineItemId}` : 'line item');
      throw ApiError.badRequest(`${missing} is not part of ${sale.invoiceNumber} and cannot be returned`);
    }

    const returnQty = Math.min(ret.quantity || 1, lineItem.qty - (lineItem.returnedQty || 0));
    if (returnQty <= 0) {
      continue; // Item already fully returned
    }

    // Effective unit price calculation:
    // Takes lineItem.totalPrice (which already has item-level discount) and scales by global sale discount factor.
    // A return always refunds the DISCOUNTED price, proportional to quantity returned.
    const hasGlobalDiscount = sale.subTotal > 0 && sale.netTotal < sale.subTotal;
    const globalDiscountFactor = hasGlobalDiscount ? (sale.netTotal / sale.subTotal) : 1;
    const baseEffectiveUnitPrice = lineItem.qty > 0 ? (lineItem.totalPrice / lineItem.qty) : lineItem.unitPrice;
    const effectiveUnitPrice = Math.round(baseEffectiveUnitPrice * globalDiscountFactor);

    const itemRefund = Math.round(effectiveUnitPrice * returnQty);
    lineItem.returnedQty = (lineItem.returnedQty || 0) + returnQty;
    totalRefundForTx += itemRefund;
    costOfReturned += Math.round((lineItem.unitCost || 0) * returnQty);

    if (ret.imeiOrSerial || lineItem.imeiOrSerial) {
      const targetImei = ret.imeiOrSerial || lineItem.imeiOrSerial;
      // Only restore units that were actually sold on THIS invoice (prevents re-activating
      // supplier-returned, transferred, or another-invoice units)
      const unit = await InventoryUnit.findOneAndUpdate(
        withTenant({ imeiOrSerial: targetImei, isDeleted: false, status: 'Sold', soldInvoiceNumber: sale.invoiceNumber }, tenantId),
        {
          $set: {
            status: 'Available',
            soldInvoiceNumber: null,
            soldAt: null,
            soldToCustomerId: null,
          },
          $push: {
            passportHistory: {
              event: 'RETURNED',
              details: `Returned from ${sale.invoiceNumber} (${returnInvoiceNumber}) — Reason: ${ret.reason || 'Customer return'}`,
              amount: itemRefund,
              performedBy: processedBy,
            },
          },
        },
        { new: true }
      );
      if (!unit) {
        throw ApiError.badRequest(`IMEI ${targetImei} was not sold on ${sale.invoiceNumber} and cannot be returned`);
      }
      // Sync IMEI stock count for Product
      if (lineItem.productId) {
        const availCount = await InventoryUnit.countDocuments(
          withTenant({ productId: lineItem.productId, status: 'Available', isDeleted: false }, tenantId)
        );
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

  // Allocate the refund: first reduce THIS sale's remaining due (AR), then bank, then cash.
  const breakdown = sale.paymentBreakdown || { cash: 0, bank: 0, bkash: 0, rocket: 0, nagad: 0, dueAmount: 0 };
  let remaining = totalRefundForTx;
  const arReduction = Math.min(remaining, Math.max(0, breakdown.dueAmount || 0));
  remaining -= arReduction;
  const bankReduction = Math.min(remaining, Math.max(0, breakdown.bank || 0));
  remaining -= bankReduction;
  const cashReduction = Math.max(0, remaining);
  const allocation = { ar: arReduction, bank: bankReduction, cash: cashReduction };

  breakdown.dueAmount = Math.max(0, (breakdown.dueAmount || 0) - arReduction);
  breakdown.bank = Math.max(0, (breakdown.bank || 0) - bankReduction);
  breakdown.cash = Math.max(0, (breakdown.cash || 0) - cashReduction);

  // Reduce customer balance ONLY by what was actually still owed on this sale
  if (sale.customerId && arReduction > 0) {
    const customer = await Customer.findOne(withTenant({ _id: sale.customerId, isDeleted: false }, tenantId));
    if (customer) {
      customer.dueBalance = Math.max(0, customer.dueBalance - arReduction);
      await customer.save();
    }
  }

  await sale.save();
  await createAutomatedReturnJournal(sale, totalRefundForTx, returnInvoiceNumber, {
    allocation,
    costOfReturned,
    processedBy,
  }).catch(err => console.error('Return journal failed:', err));

  return { sale, refundAmount: totalRefundForTx, returnInvoiceNumber, allocation };
};

export const deleteSale = async (id, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  withTenant(query, tenantId);
  const sale = await Transaction.findOne(query);
  if (!sale) throw ApiError.notFound('Sale not found');

  // Never hard-delete a sale with financial history silently — reverse it instead.
  if (sale.status === 'RETURNED') {
    throw ApiError.badRequest('Cannot delete a fully returned sale');
  }
  if ((sale.returnedAmount || 0) > 0 || (sale.lineItems || []).some((li) => (li.returnedQty || 0) > 0)) {
    throw ApiError.badRequest('Cannot delete a sale with partial returns. Use return flow instead.');
  }

  // Reverse inventory: restore IMEIs / bulk stock for items that were sold on this invoice
  for (const li of sale.lineItems || []) {
    if (li.imeiOrSerial) {
      await InventoryUnit.updateMany(
        withTenant({ imeiOrSerial: li.imeiOrSerial, isDeleted: false, status: 'Sold', soldInvoiceNumber: sale.invoiceNumber }, tenantId),
        { $set: { status: 'Available', soldInvoiceNumber: null, soldAt: null, soldToCustomerId: null } }
      );
      const availCount = await InventoryUnit.countDocuments(
        withTenant({ productId: li.productId, status: 'Available', isDeleted: false }, tenantId)
      );
      await Product.updateOne({ _id: li.productId }, { stockQuantity: availCount }).catch(() => {});
    } else if (li.productId) {
      await Product.updateOne({ _id: li.productId }, { $inc: { stockQuantity: li.qty || 0 } }).catch(() => {});
    }
  }

  sale.isDeleted = true;
  await sale.save();
  return sale;
};

export const updateSale = async (id, data, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  withTenant(query, tenantId);
  const sale = await Transaction.findOne(query);
  if (!sale) throw ApiError.notFound('Sale not found');

  if (sale.status === 'RETURNED') {
    throw ApiError.badRequest('Cannot edit a fully returned sale');
  }

  // ── Step 1: Restore old inventory (IMEI → Available, bulk → stock back) ──
  for (const oldItem of sale.lineItems) {
    if (oldItem.imeiOrSerial) {
      await InventoryUnit.findOneAndUpdate(
        withTenant({ imeiOrSerial: oldItem.imeiOrSerial, isDeleted: false, status: 'Sold' }, tenantId),
        {
          $set: { status: 'Available', soldInvoiceNumber: null, soldAt: null, soldToCustomerId: null },
          $pull: { passportHistory: { event: 'SOLD', details: { $regex: `Sold on ${sale.invoiceNumber}` } } },
        }
      ).catch(() => {});
      // Recount product stock from available IMEI units
      if (oldItem.productId) {
        const availCount = await InventoryUnit.countDocuments(
          withTenant({ productId: oldItem.productId, status: 'Available', isDeleted: false }, tenantId)
        );
        await Product.updateOne({ _id: oldItem.productId }, { stockQuantity: availCount }).catch(() => {});
      }
    } else if (oldItem.productId) {
      // Bulk product — restore stock
      await Product.updateOne(
        { _id: oldItem.productId },
        { $inc: { stockQuantity: oldItem.qty || 1 } }
      ).catch(() => {});
    }
  }

  // ── Step 2: Resolve customer ──
  let customerId = data.customerId !== undefined ? data.customerId : sale.customerId;
  let customerObj = null;

  if (customerId) {
    customerObj = await Customer.findOne(withTenant({ _id: customerId, isDeleted: false }, tenantId));
  } else if (data.customerPhone && data.customerPhone.trim()) {
    const phoneVal = data.customerPhone.trim();
    customerObj = await Customer.findOne(withTenant({ phoneHash: hashText(phoneVal), isDeleted: false }, tenantId));
    if (!customerObj) {
      customerObj = await Customer.create({
        tenantId,
        name: data.customerName || 'Walk-in Customer',
        phone: phoneVal,
        phoneHash: hashText(phoneVal),
        email: data.customerEmail || '',
        address: data.customerAddress || '',
      });
    }
    customerId = customerObj._id;
  }

  // ── Step 3: Build new line items & validate products ──
  const newItems = data.items || sale.lineItems.map((li) => ({
    productId: li.productId?._id || li.productId,
    imeiOrSerial: li.imeiOrSerial || undefined,
    description: li.description,
    qty: li.qty,
    unitPrice: li.unitPrice,
    unitCost: li.unitCost || 0,
  }));

  let subTotal = 0;
  const lineItems = [];
  const soldImeis = [];
  const productWarrantyMonths = {};

  for (const item of newItems) {
    const productQuery = { _id: item.productId, isDeleted: false };
    withTenant(productQuery, tenantId);
    const product = await Product.findOne(productQuery);
    if (!product) throw ApiError.notFound(`Product not found: ${item.productId}`);
    productWarrantyMonths[item.productId] = product.warrantyMonths || 0;

    let unitCost = item.unitCost || product.costPrice || 0;

    if (item.imeiOrSerial) {
      const unit = await InventoryUnit.findOne(
        withTenant({ imeiOrSerial: item.imeiOrSerial, isDeleted: false, status: 'Available' }, tenantId)
      );
      if (!unit) throw ApiError.badRequest(`IMEI ${item.imeiOrSerial} is not available for sale`);
      unitCost = unit.purchasePrice || product.costPrice || 0;
    } else {
      const requestedQty = Math.abs(item.qty || 1);
      if (product.stockQuantity < requestedQty) {
        throw ApiError.badRequest(`Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${requestedQty}`);
      }
    }

    const itemTotal = (item.unitPrice * item.qty);
    subTotal += itemTotal;
    lineItems.push({
      productId: item.productId,
      imeiOrSerial: item.imeiOrSerial || '',
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
      unitCost,
      totalPrice: itemTotal,
    });
  }

  const discount = data.discount ?? sale.discount ?? 0;
  const tax = data.tax ?? sale.tax ?? 0;
  const netTotal = subTotal - discount + tax;

  // ── Step 4: Apply new inventory (IMEI → Sold, bulk → deduct) ──
  const soldDate = new Date();
  for (let i = 0; i < newItems.length; i++) {
    const item = newItems[i];
    if (item.imeiOrSerial) {
      const unitUpdate = {
        status: 'Sold',
        soldInvoiceNumber: sale.invoiceNumber,
        soldAt: soldDate,
        $push: {
          passportHistory: {
            event: 'SOLD',
            details: `Sold on ${sale.invoiceNumber} (edited)`,
            amount: item.unitPrice,
            performedBy: 'system',
          },
        },
      };
      const warrantyMonths = productWarrantyMonths[item.productId] || 0;
      if (warrantyMonths) {
        const expiry = new Date(soldDate);
        expiry.setMonth(expiry.getMonth() + warrantyMonths);
        unitUpdate.warrantyExpiry = expiry;
      }
      const unit = await InventoryUnit.findOneAndUpdate(
        withTenant({ imeiOrSerial: item.imeiOrSerial, isDeleted: false, status: 'Available' }, tenantId),
        unitUpdate,
        { new: true }
      );
      if (!unit) throw ApiError.badRequest(`IMEI ${item.imeiOrSerial} is not available`);
      soldImeis.push(unit.imeiOrSerial);

      const availCount = await InventoryUnit.countDocuments(
        withTenant({ productId: item.productId, status: 'Available', isDeleted: false }, tenantId)
      );
      await Product.updateOne({ _id: item.productId }, { stockQuantity: availCount }).catch(() => {});
    } else {
      const requestedQty = Math.abs(item.qty || 1);
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stockQuantity: -requestedQty } }
      ).catch(() => {});
    }
  }

  // Mark sold IMEIs with customer
  if (soldImeis.length > 0 && customerId) {
    await InventoryUnit.updateMany(
      withTenant({ imeiOrSerial: { $in: soldImeis } }, tenantId),
      { soldToCustomerId: customerId }
    ).catch(() => {});
  }

  // ── Step 5: Update payment breakdown ──
  const newBreakdown = data.paymentBreakdown || sale.paymentBreakdown;
  const paidAmount = (newBreakdown.cash || 0) + (newBreakdown.bkash || 0) +
    (newBreakdown.rocket || 0) + (newBreakdown.nagad || 0) + (newBreakdown.bank || 0);
  const dueAmount = Math.max(0, netTotal - paidAmount);

  // ── Step 6: Save sale ──
  const finalCustomerName = data.customerName || customerObj?.name || sale.customerName;
  const finalCustomerPhone = data.customerPhone || customerObj?.phone || sale.customerPhone;
  const finalCustomerEmail = data.customerEmail ?? sale.customerEmail;
  const finalCustomerAddress = data.customerAddress ?? sale.customerAddress;

  sale.customerId = customerId || null;
  sale.customerName = finalCustomerName;
  sale.customerPhone = finalCustomerPhone;
  sale.customerEmail = finalCustomerEmail;
  sale.customerAddress = finalCustomerAddress;
  sale.saleType = data.saleType || sale.saleType;
  sale.lineItems = lineItems;
  sale.subTotal = subTotal;
  sale.discount = discount;
  sale.tax = tax;
  sale.netTotal = netTotal;
  sale.paymentBreakdown = {
    cash: newBreakdown.cash || 0,
    bkash: newBreakdown.bkash || 0,
    rocket: newBreakdown.rocket || 0,
    nagad: newBreakdown.nagad || 0,
    bank: newBreakdown.bank || 0,
    dueAmount,
  };

  await sale.save();

  // ── Step 7: Update customer balances ──
  if (customerObj) {
    // Recalculate due balance from all non-deleted sales for this customer
    const allSales = await Transaction.find(
      withTenant({ customerId: customerObj._id, isDeleted: false, txType: 'SALE' }, tenantId)
    );
    let totalDue = 0;
    for (const s of allSales) {
      totalDue += s.paymentBreakdown?.dueAmount || 0;
    }
    customerObj.dueBalance = totalDue;
    await customerObj.save();
  }

  return sale;
};
