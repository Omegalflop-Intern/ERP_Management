import { InventoryUnit } from './imei.model.js';
import { Product } from '../product/product.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';
import { escapeRegex } from '../../utils/system/helpers.js';
import { getImeiPassport as getFullPassport } from './imeiPassport.service.js';

export const getAllIMEI = async (page = 1, limit = 20, search = '', status = '', category = '') => {
  const query = { isDeleted: false };

  if (search) {
    const safeSearch = escapeRegex(search);
    const matchingProducts = await Product.find({
      $or: [
        { name: { $regex: safeSearch, $options: 'i' } },
        { brand: { $regex: safeSearch, $options: 'i' } },
        { model: { $regex: safeSearch, $options: 'i' } },
        { sku: { $regex: safeSearch, $options: 'i' } },
      ],
      isDeleted: false,
    }).select('_id');

    const matchingProductIds = matchingProducts.map(p => p._id);

    query.$or = [
      { imeiOrSerial: { $regex: safeSearch, $options: 'i' } },
      { productId: { $in: matchingProductIds } },
    ];
  }

  if (status && status !== 'ALL') {
    query.status = status;
  }

  if (category && category !== 'ALL') {
    const productIds = await Product.find({ category, isDeleted: false }).select('_id');
    query.productId = { $in: productIds.map(p => p._id) };
  }

  const total = await InventoryUnit.countDocuments(query);
  const units = await paginate(
    InventoryUnit.find(query).populate('productId').populate('branchId'),
    page, limit
  ).sort({ createdAt: -1 });

  // Attach available stock count for each product
  const productIds = units.map(u => u.productId?._id).filter(Boolean);
  const counts = await InventoryUnit.aggregate([
    { $match: { productId: { $in: productIds }, status: 'Available', isDeleted: false } },
    { $group: { _id: '$productId', count: { $sum: 1 } } }
  ]);
  const countMap = {};
  counts.forEach(c => { countMap[c._id.toString()] = c.count; });

  const enrichedUnits = units.map(u => {
    const uObj = u.toObject ? u.toObject() : u;
    const pId = uObj.productId?._id?.toString();
    const availableStock = (pId && countMap[pId] !== undefined) ? countMap[pId] : (uObj.productId?.stockQuantity || 1);
    return {
      ...uObj,
      productStockCount: availableStock,
    };
  });

  return { units: enrichedUnits, pagination: getPagination(total, page, limit) };
};

export const getIMEIBySerial = async (imeiOrSerial) => {
  const unit = await InventoryUnit.findOne({ imeiOrSerial, isDeleted: false })
    .populate('productId')
    .populate('branchId')
    .populate('supplierId');
  if (!unit) throw ApiError.notFound('IMEI not found');
  return unit;
};

export const getIMEIPassport = async (imeiOrSerial) => {
  return await getFullPassport(imeiOrSerial);
};

export const addInventoryUnit = async (data) => {
  const existing = await InventoryUnit.findOne({ imeiOrSerial: data.imeiOrSerial, isDeleted: false });
  if (existing) throw ApiError.conflict('IMEI already exists');

  const product = await Product.findOne({ _id: data.productId, isDeleted: false });
  if (!product) throw ApiError.notFound('Product not found');

  const warrantyExpiry = new Date();
  warrantyExpiry.setMonth(warrantyExpiry.getMonth() + (data.warrantyMonths || 12));

  const unit = await InventoryUnit.create({
    ...data,
    currentSellingPrice: data.currentSellingPrice || product.sellingPrice,
    purchasePrice: data.purchasePrice || product.costPrice,
    warrantyExpiry,
    passportHistory: [{
      event: 'PURCHASED',
      details: `Stock inward — ${product.name}`,
      amount: data.purchasePrice,
      performedBy: 'system',
    }],
  });

  return unit;
};

export const updateIMEIStatus = async (id, status, performedBy = 'system') => {
  const unit = await InventoryUnit.findOne({ _id: id, isDeleted: false });
  if (!unit) throw ApiError.notFound('IMEI not found');

  unit.status = status;
  unit.passportHistory.push({
    event: status.toUpperCase(),
    details: `Status changed to ${status}`,
    performedBy,
  });
  await unit.save();
  return unit;
};

export const priceDropAdjustment = async (productName, newSellingPrice) => {
  const product = await Product.findOne({ name: productName, isDeleted: false });
  if (!product) throw ApiError.notFound('Product not found');

  product.sellingPrice = newSellingPrice;
  await product.save();

  const result = await InventoryUnit.updateMany(
    { productId: product._id, status: 'Available', isDeleted: false },
    {
      $set: { currentSellingPrice: newSellingPrice },
      $push: {
        passportHistory: {
          event: 'PRICE_DROPPED',
          details: `Price drop to ৳${newSellingPrice}`,
          amount: newSellingPrice,
          performedBy: 'admin',
        },
      },
    }
  );

  return { modifiedCount: result.modifiedCount, productName };
};

export const deleteIMEI = async (id) => {
  const unit = await InventoryUnit.findOne({ _id: id, isDeleted: false });
  if (!unit) throw ApiError.notFound('IMEI not found');
  unit.isDeleted = true;
  await unit.save();
  return unit;
};
