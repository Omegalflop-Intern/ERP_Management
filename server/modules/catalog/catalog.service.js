import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';

function formatCatalogItem(row) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    name: row.name,
    type: row.type,
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

import { ensureCategoryInCatalog, ensureBrandInCatalog } from '../product/product.service.js';

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where('tenant_id', tenantId);
  }
}

export const getAllCatalogItems = async (type = '', search = '', tenantId = null) => {
  try {
    const prodQuery = db('products').where({ is_deleted: false });
    if (tenantId) prodQuery.where('tenant_id', tenantId);
    const existingProds = await prodQuery.select('category', 'brand');

    const catItems = existingProds.map((p) => p.category?.trim()).filter(Boolean);
    const brandItems = existingProds.map((p) => p.brand?.trim()).filter(Boolean);

    for (const catName of new Set(catItems)) {
      await ensureCategoryInCatalog(catName, tenantId);
    }
    for (const brandName of new Set(brandItems)) {
      await ensureBrandInCatalog(brandName, tenantId);
    }
  } catch (e) {
    // Ignore sync errors
  }

  const query = db('catalog_items').where({ is_deleted: false });
  applyTenantScope(query, tenantId);
  if (type) query.where({ type });
  if (search) query.where('name', 'like', `%${search}%`);

  const rows = await query.orderBy('type', 'asc').orderBy('name', 'asc');
  return rows.map(formatCatalogItem);
};

export const getCatalogItemById = async (id, tenantId = null) => {
  const query = db('catalog_items').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
  const row = await query.first();
  if (!row) throw ApiError.notFound('Catalog item not found');
  return formatCatalogItem(row);
};

export const createCatalogItem = async (data) => {
  const query = db('catalog_items')
    .where({ type: data.type, is_deleted: false })
    .whereRaw('LOWER(name) = ?', [data.name.toLowerCase()]);
  applyTenantScope(query, data.tenantId || null);

  const existing = await query.first();
  if (existing) throw ApiError.badRequest(`${data.type.toLowerCase()} "${data.name}" already exists`);

  const [insertedId] = await db('catalog_items').insert({
    tenant_id: data.tenantId || null,
    name: data.name,
    type: data.type,
    is_deleted: false,
  });

  return getCatalogItemById(insertedId, data.tenantId || null);
};

export const updateCatalogItem = async (id, data, tenantId = null) => {
  const item = await getCatalogItemById(id, tenantId);
  if (!item) throw ApiError.notFound('Catalog item not found');

  const dupQuery = db('catalog_items')
    .where({ type: item.type, is_deleted: false })
    .whereNot({ id })
    .whereRaw('LOWER(name) = ?', [data.name.toLowerCase()]);
  applyTenantScope(dupQuery, tenantId);

  const duplicate = await dupQuery.first();
  if (duplicate) throw ApiError.badRequest(`${item.type.toLowerCase()} "${data.name}" already exists`);

  const uq = db('catalog_items').where({ id });
  if (tenantId) uq.andWhere('tenant_id', tenantId);
  await uq.update({ name: data.name });
  return getCatalogItemById(id, tenantId);
};

export const deleteCatalogItem = async (id, tenantId = null) => {
  const item = await getCatalogItemById(id, tenantId);
  if (!item) throw ApiError.notFound('Catalog item not found');

  const delQ = db('catalog_items').where({ id });
  if (tenantId) delQ.andWhere('tenant_id', tenantId);
  await delQ.update({ is_deleted: true });
  return { ...item, isDeleted: true };
};

export const bulkCreateCatalogItems = async (items, tenantId = null) => {
  const results = [];
  for (const item of items) {
    try {
      const created = await createCatalogItem({ ...item, tenantId });
      results.push(created);
    } catch {
      // skip duplicates
    }
  }
  return results;
};

export const getCatalogStats = async (tenantId = null) => {
  const catQuery = db('catalog_items').where({ type: 'CATEGORY', is_deleted: false });
  applyTenantScope(catQuery, tenantId);
  const catRes = await catQuery.count({ count: '*' }).first();

  const brandQuery = db('catalog_items').where({ type: 'BRAND', is_deleted: false });
  applyTenantScope(brandQuery, tenantId);
  const brandRes = await brandQuery.count({ count: '*' }).first();

  const categories = Number(catRes?.count || 0);
  const brands = Number(brandRes?.count || 0);
  return { categories, brands, total: categories + brands };
};
