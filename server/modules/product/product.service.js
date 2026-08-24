import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

export function generateSKU(brandName) {
  const prefix = (brandName || 'PROD').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'PROD';
  const random6 = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random6}`;
}

export function formatProduct(row, availableIMEIs = [], branchId = null, totalUnitsGlobal = 0) {
  if (!row) return null;
  const imeiCountInBranch = availableIMEIs.length;
  const isSerialTracked = totalUnitsGlobal > 0 || imeiCountInBranch > 0;

  let branchStock = 0;
  if (isSerialTracked) {
    branchStock = imeiCountInBranch;
  } else {
    branchStock = Number(row.stock_quantity || 0);
  }

  const globalStock = isSerialTracked ? totalUnitsGlobal : Number(row.stock_quantity || 0);

  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    name: row.name,
    brand: row.brand,
    category: row.category,
    model: row.model || '',
    sku: row.sku,
    barcode: row.barcode || null,
    ram: row.ram || '',
    storage: row.storage || '',
    color: row.color || '',
    costPrice: Number(row.cost_price || 0),
    sellingPrice: Number(row.selling_price || 0),
    wholesalePrice: Number(row.wholesale_price || row.selling_price || 0),
    vatRate: Number(row.vat_rate || 0),
    unit: row.unit || 'piece',
    minStockAlert: Number(row.min_stock_alert || 2),
    stockQuantity: branchId ? branchStock : globalStock,
    branchStockQuantity: branchStock,
    globalStockQuantity: globalStock,
    warrantyMonths: Number(row.warranty_months || 12),
    image: row.image || null,
    description: row.description || '',
    isActive: Boolean(row.is_active),
    isDeleted: Boolean(row.is_deleted),
    availableIMEIs,
    totalUnits: availableIMEIs.length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where('tenant_id', tenantId);
  }
}

export const getAllProducts = async (page = 1, limit = 50, search = '', category = '', tenantId = null, branchId = null) => {
  const countQuery = db('products').where({ is_deleted: false });
  applyTenantScope(countQuery, tenantId);
  if (branchId && branchId !== 'all') {
    countQuery.where((b) => b.where('branch_id', branchId).orWhereNull('branch_id'));
  }

  if (search) {
    const term = `%${search}%`;
    countQuery.where((b) => {
      b.where('name', 'like', term)
        .orWhere('brand', 'like', term)
        .orWhere('model', 'like', term)
        .orWhere('sku', 'like', term);
    });
  }

  if (category && category !== 'ALL') {
    countQuery.where({ category });
  }

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('products').where({ is_deleted: false });
  applyTenantScope(dataQuery, tenantId);
  if (branchId && branchId !== 'all') {
    dataQuery.where((b) => b.where('branch_id', branchId).orWhereNull('branch_id'));
  }

  if (search) {
    const term = `%${search}%`;
    dataQuery.where((b) => {
      b.where('name', 'like', term)
        .orWhere('brand', 'like', term)
        .orWhere('model', 'like', term)
        .orWhere('sku', 'like', term);
    });
  }

  if (category && category !== 'ALL') {
    dataQuery.where({ category });
  }

  const rows = await dataQuery.orderBy('created_at', 'desc').limit(limit).offset(offset);

  const productIds = rows.map(r => r.id);
  let allUnits = [];
  let branchUnits = [];
  if (productIds.length > 0) {
    const allUnitQuery = db('inventory_units').whereIn('product_id', productIds).where({ status: 'Available', is_deleted: false });
    if (tenantId) allUnitQuery.where('tenant_id', tenantId);
    allUnits = await allUnitQuery;

    if (branchId && branchId !== 'all') {
      branchUnits = allUnits.filter(u => !u.branch_id || String(u.branch_id) === String(branchId));
    } else {
      branchUnits = allUnits;
    }
  }

  const products = rows.map((row) => {
    const availIMEIs = branchUnits.filter(u => u.product_id === row.id).map(u => u.imei_or_serial);
    const globalCount = allUnits.filter(u => u.product_id === row.id).length;
    return formatProduct(row, availIMEIs, branchId, globalCount);
  });

  return { products, pagination: getPagination(total, page, limit) };
};

export const getProductById = async (id, tenantId = null, branchId = null) => {
  const query = db('products').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
  const row = await query.first();
  if (!row) throw ApiError.notFound('Product not found');

  const allUnitQuery = db('inventory_units').where({ product_id: id, status: 'Available', is_deleted: false });
  if (tenantId) allUnitQuery.where('tenant_id', tenantId);
  const allUnits = await allUnitQuery;

  let branchUnits = allUnits;
  if (branchId) {
    branchUnits = allUnits.filter(u => String(u.branch_id) === String(branchId));
  }

  const availIMEIs = branchUnits.map(u => u.imei_or_serial);
  return formatProduct(row, availIMEIs, branchId, allUnits.length);
};

export const getProductBySku = async (sku, tenantId = null) => {
  const query = db('products').where({ sku, is_deleted: false });
  applyTenantScope(query, tenantId);
  const row = await query.first();
  return row ? formatProduct(row) : null;
};

export async function ensureCategoryInCatalog(categoryName, tenantId = null) {
  if (!categoryName || typeof categoryName !== 'string' || !categoryName.trim()) return;
  const cleanName = categoryName.trim();
  try {
    const query = db('catalog_items').where({ type: 'CATEGORY', is_deleted: false })
      .whereRaw('LOWER(name) = ?', [cleanName.toLowerCase()]);
    if (tenantId) query.andWhere({ tenant_id: tenantId });
    const exists = await query.first();
    if (!exists) {
      await db('catalog_items').insert({
        tenant_id: tenantId,
        type: 'CATEGORY',
        name: cleanName,
        is_deleted: false,
      });
    }
  } catch (err) {
    console.error('Failed to auto-sync category into catalog_items:', err.message);
  }
}

export async function ensureBrandInCatalog(brandName, tenantId = null) {
  if (!brandName || typeof brandName !== 'string' || !brandName.trim()) return;
  const cleanName = brandName.trim();
  try {
    const query = db('catalog_items').where({ type: 'BRAND', is_deleted: false })
      .whereRaw('LOWER(name) = ?', [cleanName.toLowerCase()]);
    if (tenantId) query.andWhere({ tenant_id: tenantId });
    const exists = await query.first();
    if (!exists) {
      await db('catalog_items').insert({
        tenant_id: tenantId,
        type: 'BRAND',
        name: cleanName,
        is_deleted: false,
      });
    }
  } catch (err) {
    console.error('Failed to auto-sync brand into catalog_items:', err.message);
  }
}

export const createProduct = async (data) => {
  const tenantId = data.tenantId || null;

  if (!data.sku || !data.sku.trim()) {
    data.sku = generateSKU(data.brand);
  }

  const skuQuery = db('products').where({ sku: data.sku, is_deleted: false });
  applyTenantScope(skuQuery, tenantId);
  if (await skuQuery.first()) throw ApiError.conflict(`SKU "${data.sku}" already exists`);

  if (data.category) {
    await ensureCategoryInCatalog(data.category, tenantId);
  }
  if (data.brand) {
    await ensureBrandInCatalog(data.brand, tenantId);
  }

  const [insertedId] = await db('products').insert({
    tenant_id: tenantId,
    name: data.name,
    brand: data.brand,
    category: data.category,
    model: data.model || null,
    sku: data.sku,
    barcode: data.barcode || null,
    ram: data.ram || null,
    storage: data.storage || null,
    color: data.color || null,
    cost_price: data.costPrice,
    selling_price: data.sellingPrice,
    wholesale_price: data.wholesalePrice || data.sellingPrice,
    vat_rate: data.vatRate || 0,
    unit: data.unit || 'piece',
    min_stock_alert: data.minStockAlert || 2,
    stock_quantity: data.stockQuantity || 0,
    warranty_months: data.warrantyMonths || 12,
    image: data.image || null,
    description: data.description || null,
    is_active: data.isActive !== undefined ? Boolean(data.isActive) : true,
    is_deleted: false,
  });

  if (data.imeiOrSerial && data.imeiOrSerial.trim()) {
    const rawLines = data.imeiOrSerial.split(/[\n;]+/).map(s => s.trim()).filter(Boolean);
    for (const rawLine of rawLines) {
      const parts = rawLine.includes(':') ? rawLine.split(':') : rawLine.split(',');
      const imeiVal = parts[0]?.trim();
      if (!imeiVal) continue;

      const imeiCheckQuery = db('inventory_units').where({ imei_or_serial: imeiVal, is_deleted: false });
      if (tenantId) imeiCheckQuery.andWhere('tenant_id', tenantId);
      const existing = await imeiCheckQuery.first();
      if (!existing) {
        await db('inventory_units').insert({
          tenant_id: tenantId,
          branch_id: data.branchId || null,
          product_id: insertedId,
          imei_or_serial: imeiVal,
          color: parts[1]?.trim() || data.color || null,
          ram: parts[2]?.trim() || data.ram || null,
          storage: parts[3]?.trim() || data.storage || null,
          purchase_price: data.costPrice || 0,
          current_selling_price: data.sellingPrice || 0,
          status: 'Available',
          is_deleted: false,
        });
      }
    }

    const availCountQuery = db('inventory_units').where({ product_id: insertedId, status: 'Available', is_deleted: false });
    if (tenantId) availCountQuery.andWhere('tenant_id', tenantId);
    const availCountRes = await availCountQuery.count({ count: '*' }).first();
    const count = Number(availCountRes?.count || 0);
    if (count > 0) {
      const stockUpdate = db('products').where({ id: insertedId });
      if (tenantId) stockUpdate.andWhere('tenant_id', tenantId);
      await stockUpdate.update({ stock_quantity: count });
    }
  }

  return getProductById(insertedId, tenantId);
};

export const updateProduct = async (id, data, tenantId = null) => {
  const product = await getProductById(id, tenantId);
  if (!product) throw ApiError.notFound('Product not found');

  const updateFields = {};

  if (data.sku && data.sku !== product.sku) {
    const skuQuery = db('products').where({ sku: data.sku, is_deleted: false }).whereNot({ id });
    applyTenantScope(skuQuery, tenantId);
    if (await skuQuery.first()) throw ApiError.conflict(`SKU "${data.sku}" already exists`);
    updateFields.sku = data.sku;
  }

  if (data.name !== undefined) updateFields.name = data.name;
  if (data.brand !== undefined) {
    updateFields.brand = data.brand;
    if (data.brand) await ensureBrandInCatalog(data.brand, tenantId);
  }
  if (data.category !== undefined) {
    updateFields.category = data.category;
    if (data.category) await ensureCategoryInCatalog(data.category, tenantId);
  }
  if (data.model !== undefined) updateFields.model = data.model;
  if (data.costPrice !== undefined) updateFields.cost_price = data.costPrice;
  if (data.sellingPrice !== undefined) updateFields.selling_price = data.sellingPrice;
  if (data.wholesalePrice !== undefined) updateFields.wholesale_price = data.wholesalePrice;
  if (data.stockQuantity !== undefined) updateFields.stock_quantity = data.stockQuantity;

  if (Object.keys(updateFields).length > 0) {
    const prodUpdate = db('products').where({ id });
    if (tenantId) prodUpdate.andWhere('tenant_id', tenantId);
    await prodUpdate.update(updateFields);
  }

  return getProductById(id, tenantId);
};

export const deleteProduct = async (id, tenantId = null) => {
  const product = await getProductById(id, tenantId);
  if (!product) throw ApiError.notFound('Product not found');

  const prodDel = db('products').where({ id });
  if (tenantId) prodDel.andWhere('tenant_id', tenantId);
  await prodDel.update({ is_deleted: true });
  return { ...product, isDeleted: true };
};

export const bulkImportProducts = async (rows, tenantId = null) => {
  let createdProductsCount = 0;
  let createdImeisCount = 0;

  for (const row of rows) {
    if (!row.name || !row.brand || !row.sellingPrice) continue;
    const sku = generateSKU(row.brand);
    const product = await createProduct({
      tenantId,
      name: row.name.trim(),
      brand: row.brand.trim(),
      category: row.category?.trim() || 'Smartphones',
      costPrice: Number(row.costPrice) || 0,
      sellingPrice: Number(row.sellingPrice) || 0,
      sku,
      imeiOrSerial: row.imei || '',
    }).catch(() => null);

    if (product) createdProductsCount++;
  }

  return { createdProductsCount, createdImeisCount, totalImportedRows: rows.length };
};
