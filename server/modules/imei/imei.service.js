import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

export function formatInventoryUnit(row, productRow = null, branchRow = null, supplierRow = null) {
  if (!row) return null;
  let history = row.passport_history;
  if (typeof history === 'string') {
    try { history = JSON.parse(history); } catch { history = []; }
  }

  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    imeiOrSerial: row.imei_or_serial,
    productId: productRow ? {
      _id: String(productRow.id),
      id: productRow.id,
      name: productRow.name,
      brand: productRow.brand,
      model: productRow.model || '',
      category: productRow.category,
      sku: productRow.sku,
      sellingPrice: Number(productRow.selling_price || 0),
      costPrice: Number(productRow.cost_price || 0),
    } : String(row.product_id),
    branchId: branchRow ? {
      _id: String(branchRow.id),
      id: branchRow.id,
      name: branchRow.name,
    } : (row.branch_id ? String(row.branch_id) : null),
    supplierId: supplierRow ? {
      _id: String(supplierRow.id),
      id: supplierRow.id,
      name: supplierRow.name,
    } : (row.supplier_id ? String(row.supplier_id) : null),
    status: row.status || 'Available',
    purchasePrice: Number(row.purchase_price || 0),
    currentSellingPrice: Number(row.current_selling_price || 0),
    warrantyMonths: Number(row.warranty_months || 12),
    warrantyExpiry: row.warranty_expiry || null,
    color: row.color || '',
    ram: row.ram || '',
    storage: row.storage || '',
    soldToCustomerId: row.sold_to_customer_id || null,
    soldInvoiceNumber: row.sold_invoice_number || null,
    soldAt: row.sold_at || null,
    passportHistory: Array.isArray(history) ? history : [],
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where('inventory_units.tenant_id', tenantId);
  }
}

export const getAllIMEI = async (page = 1, limit = 20, search = '', status = '', category = '', tenantId = null) => {
  const countQuery = db('inventory_units')
    .leftJoin('products', 'inventory_units.product_id', 'products.id')
    .where('inventory_units.is_deleted', false);
  applyTenantScope(countQuery, tenantId);

  if (search) {
    const term = `%${search}%`;
    countQuery.where((b) => {
      b.where('inventory_units.imei_or_serial', 'like', term)
        .orWhere('products.name', 'like', term)
        .orWhere('products.brand', 'like', term)
        .orWhere('products.sku', 'like', term);
    });
  }

  if (status && status !== 'ALL') countQuery.where('inventory_units.status', status);
  if (category && category !== 'ALL') countQuery.where('products.category', category);

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('inventory_units')
    .leftJoin('products', 'inventory_units.product_id', 'products.id')
    .leftJoin('branches', 'inventory_units.branch_id', 'branches.id')
    .where('inventory_units.is_deleted', false)
    .select(
      'inventory_units.*',
      'products.id as p_id',
      'products.name as p_name',
      'products.brand as p_brand',
      'products.category as p_category',
      'products.model as p_model',
      'products.sku as p_sku',
      'products.selling_price as p_selling_price',
      'products.cost_price as p_cost_price',
      'branches.id as b_id',
      'branches.name as b_name'
    );
  applyTenantScope(dataQuery, tenantId);

  if (search) {
    const term = `%${search}%`;
    dataQuery.where((b) => {
      b.where('inventory_units.imei_or_serial', 'like', term)
        .orWhere('products.name', 'like', term)
        .orWhere('products.brand', 'like', term)
        .orWhere('products.sku', 'like', term);
    });
  }

  if (status && status !== 'ALL') dataQuery.where('inventory_units.status', status);
  if (category && category !== 'ALL') dataQuery.where('products.category', category);

  const rows = await dataQuery.orderBy('inventory_units.created_at', 'desc').limit(limit).offset(offset);

  const units = rows.map((row) => {
    const pRow = row.p_id ? {
      id: row.p_id, name: row.p_name, brand: row.p_brand, category: row.p_category,
      model: row.p_model, sku: row.p_sku, selling_price: row.p_selling_price, cost_price: row.p_cost_price
    } : null;
    const bRow = row.b_id ? { id: row.b_id, name: row.b_name } : null;
    return formatInventoryUnit(row, pRow, bRow);
  });

  return { units, pagination: getPagination(total, page, limit) };
};

export const getIMEIBySerial = async (imeiOrSerial, tenantId = null) => {
  const dataQuery = db('inventory_units')
    .leftJoin('products', 'inventory_units.product_id', 'products.id')
    .leftJoin('branches', 'inventory_units.branch_id', 'branches.id')
    .where({ 'inventory_units.imei_or_serial': imeiOrSerial, 'inventory_units.is_deleted': false })
    .select(
      'inventory_units.*',
      'products.id as p_id', 'products.name as p_name', 'products.brand as p_brand',
      'products.category as p_category', 'products.model as p_model', 'products.sku as p_sku',
      'products.selling_price as p_selling_price', 'products.cost_price as p_cost_price',
      'branches.id as b_id', 'branches.name as b_name'
    );
  applyTenantScope(dataQuery, tenantId);

  const row = await dataQuery.first();
  if (!row) throw ApiError.notFound('IMEI not found');

  const pRow = row.p_id ? {
    id: row.p_id, name: row.p_name, brand: row.p_brand, category: row.p_category,
    model: row.p_model, sku: row.p_sku, selling_price: row.p_selling_price, cost_price: row.p_cost_price
  } : null;
  const bRow = row.b_id ? { id: row.b_id, name: row.b_name } : null;

  return formatInventoryUnit(row, pRow, bRow);
};

export const getIMEIPassport = async (imeiOrSerial, tenantId = null) => {
  return getIMEIBySerial(imeiOrSerial, tenantId);
};

export const addInventoryUnit = async (data, tenantId = null) => {
  const existingQuery = db('inventory_units').where({ imei_or_serial: data.imeiOrSerial, is_deleted: false });
  applyTenantScope(existingQuery, tenantId);
  if (await existingQuery.first()) throw ApiError.conflict('IMEI already exists');

  const prodQuery = db('products').where({ id: data.productId, is_deleted: false });
  if (tenantId) prodQuery.where('tenant_id', tenantId);
  const product = await prodQuery.first();
  if (!product) throw ApiError.notFound('Product not found');

  const warrantyExpiry = new Date();
  warrantyExpiry.setMonth(warrantyExpiry.getMonth() + (data.warrantyMonths || 12));

  const history = [{
    event: 'PURCHASED',
    details: `Stock inward — ${product.name}`,
    amount: data.purchasePrice || product.cost_price,
    performedBy: 'system',
    timestamp: new Date().toISOString(),
  }];

  const [insertedId] = await db('inventory_units').insert({
    tenant_id: tenantId || data.tenantId || null,
    imei_or_serial: data.imeiOrSerial,
    product_id: data.productId,
    branch_id: data.branchId || null,
    supplier_id: data.supplierId || null,
    status: data.status || 'Available',
    purchase_price: data.purchasePrice || product.cost_price,
    current_selling_price: data.currentSellingPrice || product.selling_price,
    warranty_months: data.warrantyMonths || 12,
    warranty_expiry: warrantyExpiry,
    color: data.color || product.color || '',
    ram: data.ram || product.ram || '',
    storage: data.storage || product.storage || '',
    passport_history: JSON.stringify(history),
    is_deleted: false,
  });

  return getIMEIBySerial(data.imeiOrSerial, tenantId);
};

export const updateIMEIStatus = async (id, status, performedBy = 'system', tenantId = null) => {
  const query = db('inventory_units').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
  const unit = await query.first();
  if (!unit) throw ApiError.notFound('IMEI not found');

  let history = [];
  try { history = typeof unit.passport_history === 'string' ? JSON.parse(unit.passport_history) : (unit.passport_history || []); } catch { history = []; }

  history.push({
    event: status.toUpperCase(),
    details: `Status changed to ${status}`,
    performedBy,
    timestamp: new Date().toISOString(),
  });

  const uq = db('inventory_units').where({ id });
  if (tenantId) uq.andWhere('tenant_id', tenantId);
  await uq.update({
    status,
    passport_history: JSON.stringify(history),
  });

  return getIMEIBySerial(unit.imei_or_serial, tenantId);
};

export const lookupIMEI = async (imeiOrSerial, tenantId = null) => {
  try {
    const unit = await getIMEIBySerial(imeiOrSerial, tenantId);
    return { found: true, source: 'inventory', unit };
  } catch {
    return { found: false, unit: null, source: null };
  }
};

export const deleteIMEI = async (id, tenantId = null) => {
  const query = db('inventory_units').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
  const unit = await query.first();
  if (!unit) throw ApiError.notFound('IMEI not found');

  const dq = db('inventory_units').where({ id });
  if (tenantId) dq.andWhere('tenant_id', tenantId);
  await dq.update({ is_deleted: true });
  return { id, isDeleted: true };
};
