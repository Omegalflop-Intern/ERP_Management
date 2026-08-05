import { Product } from './product.model.js';
import { InventoryUnit } from '../imei/imei.model.js';
import { CatalogItem } from '../catalog/catalog.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';
import { escapeRegex } from '../../utils/system/helpers.js';

export function generateSKU(brandName) {
  const prefix = (brandName || 'PROD').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'PROD';
  const random6 = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random6}`;
}

export const getAllProducts = async (page = 1, limit = 50, search = '', category = '', tenantId = null) => {
  const query = { isDeleted: false };
  if (tenantId) {
    query.tenantId = tenantId;
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    query.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { brand: { $regex: safeSearch, $options: 'i' } },
      { model: { $regex: safeSearch, $options: 'i' } },
      { sku: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  if (category && category !== 'ALL') {
    query.category = category;
  }

  const total = await Product.countDocuments(query);
  const products = await paginate(Product.find(query), page, limit).lean().sort({ createdAt: -1 });

  // Attach available inventory units / IMEIs count and IMEIs list for each product
  const productIds = products.map(p => p._id);
  const unitQuery = { productId: { $in: productIds }, isDeleted: false };
  if (tenantId) unitQuery.tenantId = tenantId;
  const units = await InventoryUnit.find(unitQuery).lean();

  const productsWithIMEI = products.map(p => {
    const pUnits = units.filter(u => u.productId?.toString() === p._id?.toString());
    const availableUnits = pUnits.filter(u => u.status === 'Available');
    return {
      ...p,
      stockQuantity: pUnits.length > 0 ? availableUnits.length : (p.stockQuantity || 0),
      availableIMEIs: availableUnits.map(u => u.imeiOrSerial),
      totalUnits: pUnits.length,
    };
  });

  return { products: productsWithIMEI, pagination: getPagination(total, page, limit) };
};

export const getProductById = async (id, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const product = await Product.findOne(query).lean();
  if (!product) throw ApiError.notFound('Product not found');
  const unitQuery = { productId: id, status: 'Available', isDeleted: false };
  if (tenantId) unitQuery.tenantId = tenantId;
  const units = await InventoryUnit.find(unitQuery).lean();
  return {
    ...product,
    availableIMEIs: units.map(u => u.imeiOrSerial),
    stockQuantity: units.length > 0 ? units.length : (product.stockQuantity || 0),
  };
};

export const getProductBySku = async (sku, tenantId = null) => {
  const query = { sku, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  return Product.findOne(query);
};

export const createProduct = async (data) => {
  const tenantId = data.tenantId || null;

  // Auto-generate SKU if missing
  if (!data.sku || !data.sku.trim()) {
    let newSku = generateSKU(data.brand);
    let attempts = 0;
    const skuQuery = { sku: newSku, isDeleted: false };
    if (tenantId) skuQuery.tenantId = tenantId;
    while (await Product.findOne(skuQuery)) {
      newSku = generateSKU(data.brand);
      skuQuery.sku = newSku;
      attempts++;
      if (attempts > 5) break;
    }
    data.sku = newSku;
  }

  // SKU uniqueness check scoped to tenant
  const skuCheckQuery = { sku: data.sku, isDeleted: false };
  if (tenantId) skuCheckQuery.tenantId = tenantId;
  const existing = await Product.findOne(skuCheckQuery);
  if (existing) throw ApiError.conflict(`SKU "${data.sku}" already exists`);

  if (data.category && data.category.trim()) {
    const catName = data.category.trim();
    const catQuery = {
      name: { $regex: `^${catName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, $options: 'i' },
      type: 'CATEGORY',
    };
    if (tenantId) catQuery.tenantId = tenantId;
    const existingCat = await CatalogItem.findOne(catQuery);
    if (!existingCat) {
      await CatalogItem.create({ name: catName, type: 'CATEGORY', tenantId, isDeleted: false }).catch(() => {});
    } else if (existingCat.isDeleted) {
      existingCat.isDeleted = false;
      await existingCat.save().catch(() => {});
    }
  }

  if (data.brand && data.brand.trim()) {
    const brandName = data.brand.trim();
    const brandQuery = {
      name: { $regex: `^${brandName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, $options: 'i' },
      type: 'BRAND',
    };
    if (tenantId) brandQuery.tenantId = tenantId;
    const existingBrand = await CatalogItem.findOne(brandQuery);
    if (!existingBrand) {
      await CatalogItem.create({ name: brandName, type: 'BRAND', tenantId, isDeleted: false }).catch(() => {});
    } else if (existingBrand.isDeleted) {
      existingBrand.isDeleted = false;
      await existingBrand.save().catch(() => {});
    }
  }

  const isPhoneCategory = ['smartphones', 'feature phones', 'phones', 'mobile phones', 'handsets', 'smart phones', 'smartphone'].includes(data.category?.toLowerCase()?.trim());

  if (isPhoneCategory && (!data.imeiOrSerial || !data.imeiOrSerial.trim())) {
    throw ApiError.badRequest('Mobile Phone stock requires entering valid 15-digit IMEIs. You cannot add phone stock without IMEIs!');
  }

  const product = await Product.create(data);

  if (data.imeiOrSerial && data.imeiOrSerial.trim()) {
    const rawLines = data.imeiOrSerial.split(/[\n;]+/).map(s => s.trim()).filter(Boolean);

    let createdUnitsCount = 0;
    for (const rawLine of rawLines) {
      // Parse format: IMEI:Color:RAM/Storage or IMEI,Color,RAM,Storage or plain IMEI
      const parts = rawLine.includes(':') ? rawLine.split(':') : rawLine.split(',');
      const imeiVal = parts[0]?.trim();
      const unitColor = parts[1]?.trim() || data.color || '';
      const unitRam = parts[2]?.trim() || data.ram || '';
      const unitStorage = parts[3]?.trim() || data.storage || '';

      if (!imeiVal) continue;

      const imeiCheckQuery = { imeiOrSerial: imeiVal, isDeleted: false };
      if (tenantId) imeiCheckQuery.tenantId = tenantId;
      const existingImei = await InventoryUnit.findOne(imeiCheckQuery);
      if (!existingImei) {
        await InventoryUnit.create({
          tenantId: data.tenantId || undefined,
          productId: product._id,
          imeiOrSerial: imeiVal,
          color: unitColor,
          ram: unitRam,
          storage: unitStorage,
          purchasePrice: product.costPrice || 0,
          currentSellingPrice: product.sellingPrice || 0,
          status: 'Available',
        }).catch(() => {});
        createdUnitsCount++;
      }
    }

    const totalAvailQuery = { productId: product._id, status: 'Available', isDeleted: false };
    if (tenantId) totalAvailQuery.tenantId = tenantId;
    const totalAvail = await InventoryUnit.countDocuments(totalAvailQuery);
    if (totalAvail > 0) {
      product.stockQuantity = totalAvail;
      await product.save().catch(() => {});
    }
  }

  return product;
};

export const updateProduct = async (id, data, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const product = await Product.findOne(query);
  if (!product) throw ApiError.notFound('Product not found');

  if (data.sku && data.sku !== product.sku) {
    const skuCheckQuery = { sku: data.sku, isDeleted: false, _id: { $ne: id } };
    if (tenantId) skuCheckQuery.tenantId = tenantId;
    const existing = await Product.findOne(skuCheckQuery);
    if (existing) throw ApiError.conflict(`SKU "${data.sku}" already exists`);
  }

  if (data.category && data.category.trim()) {
    const catName = data.category.trim();
    const catQuery = {
      name: { $regex: `^${catName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, $options: 'i' },
      type: 'CATEGORY',
    };
    if (tenantId) catQuery.tenantId = tenantId;
    const existingCat = await CatalogItem.findOne(catQuery);
    if (!existingCat) {
      await CatalogItem.create({ name: catName, type: 'CATEGORY', tenantId, isDeleted: false }).catch(() => {});
    } else if (existingCat.isDeleted) {
      existingCat.isDeleted = false;
      await existingCat.save().catch(() => {});
    }
  }

  if (data.brand && data.brand.trim()) {
    const brandName = data.brand.trim();
    const brandQuery = {
      name: { $regex: `^${brandName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, $options: 'i' },
      type: 'BRAND',
    };
    if (tenantId) brandQuery.tenantId = tenantId;
    const existingBrand = await CatalogItem.findOne(brandQuery);
    if (!existingBrand) {
      await CatalogItem.create({ name: brandName, type: 'BRAND', tenantId, isDeleted: false }).catch(() => {});
    } else if (existingBrand.isDeleted) {
      existingBrand.isDeleted = false;
      await existingBrand.save().catch(() => {});
    }
  }

  if (data.imeiOrSerial && data.imeiOrSerial.trim()) {
    const imeis = data.imeiOrSerial
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(Boolean);

    for (const imeiVal of imeis) {
      const imeiQuery = { imeiOrSerial: imeiVal, isDeleted: false };
      if (tenantId) imeiQuery.tenantId = tenantId;
      const existingImei = await InventoryUnit.findOne(imeiQuery);
      if (!existingImei) {
        await InventoryUnit.create({
          tenantId: tenantId || product.tenantId || undefined,
          productId: product._id,
          imeiOrSerial: imeiVal,
          purchasePrice: data.costPrice || product.costPrice || 0,
          currentSellingPrice: data.sellingPrice || product.sellingPrice || 0,
          status: 'Available',
        }).catch(() => {});
      }
    }

    const countQuery = { productId: product._id, status: 'Available', isDeleted: false };
    if (tenantId) countQuery.tenantId = tenantId;
    const totalAvail = await InventoryUnit.countDocuments(countQuery);
    data.stockQuantity = totalAvail;
  } else {
    const imeiCountQuery = { productId: product._id, isDeleted: false };
    if (tenantId) imeiCountQuery.tenantId = tenantId;
    const imeiCount = await InventoryUnit.countDocuments(imeiCountQuery);
    if (imeiCount > 0) {
      const availCountQuery = { productId: product._id, status: 'Available', isDeleted: false };
      if (tenantId) availCountQuery.tenantId = tenantId;
      const availCount = await InventoryUnit.countDocuments(availCountQuery);
      data.stockQuantity = availCount;
    }
  }

  Object.assign(product, data);
  await product.save();
  return product;
};

export const deleteProduct = async (id, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const product = await Product.findOne(query);
  if (!product) throw ApiError.notFound('Product not found');
  product.isDeleted = true;
  await product.save();
};

export const bulkImportProducts = async (rows, tenantId = null) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw ApiError.badRequest('No products or rows provided for bulk import');
  }

  let createdProductsCount = 0;
  let createdImeisCount = 0;

  for (const row of rows) {
    if (!row.name || !row.brand || !row.sellingPrice) continue;

    const productQuery = {
      name: { $regex: `^${row.name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, $options: 'i' },
      brand: { $regex: `^${row.brand.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, $options: 'i' },
      isDeleted: false,
    };
    if (tenantId) productQuery.tenantId = tenantId;

    let product = await Product.findOne(productQuery);

    if (!product) {
      const sku = generateSKU(row.brand);
      product = await Product.create({
        tenantId: tenantId || undefined,
        name: row.name.trim(),
        brand: row.brand.trim(),
        category: row.category?.trim() || 'Smartphones',
        costPrice: Number(row.costPrice) || 0,
        sellingPrice: Number(row.sellingPrice) || 0,
        wholesalePrice: Number(row.wholesalePrice) || Number(row.sellingPrice) || 0,
        color: row.color?.trim() || '',
        ram: row.ram?.trim() || '',
        storage: row.storage?.trim() || '',
        sku,
        stockQuantity: 0,
      });
      createdProductsCount++;
    }

    if (row.imei && row.imei.trim()) {
      const imeiVal = row.imei.trim();
      const imeiQuery = { imeiOrSerial: imeiVal, isDeleted: false };
      if (tenantId) imeiQuery.tenantId = tenantId;
      const existingImei = await InventoryUnit.findOne(imeiQuery);
      if (!existingImei) {
        await InventoryUnit.create({
          tenantId: tenantId || undefined,
          productId: product._id,
          imeiOrSerial: imeiVal,
          color: row.color?.trim() || product.color || '',
          ram: row.ram?.trim() || product.ram || '',
          storage: row.storage?.trim() || product.storage || '',
          purchasePrice: Number(row.costPrice) || product.costPrice || 0,
          currentSellingPrice: Number(row.sellingPrice) || product.sellingPrice || 0,
          status: 'Available',
        });
        createdImeisCount++;
      }
      const availCount = await InventoryUnit.countDocuments({ productId: product._id, status: 'Available', isDeleted: false });
      product.stockQuantity = availCount;
      await product.save();
    }
  }

  return { createdProductsCount, createdImeisCount, totalImportedRows: rows.length };
};
