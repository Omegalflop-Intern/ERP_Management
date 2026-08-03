import { CatalogItem } from './catalog.model.js';
import { ApiError } from '../../utils/http/ApiError.js';

export const getAllCatalogItems = async (type = '', search = '', tenantId = null) => {
  const query = { isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  if (type) query.type = type;
  if (search) query.name = { $regex: search, $options: 'i' };
  return CatalogItem.find(query).sort({ type: 1, name: 1 });
};

export const getCatalogItemById = async (id, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const item = await CatalogItem.findOne(query);
  if (!item) throw ApiError.notFound('Catalog item not found');
  return item;
};

export const createCatalogItem = async (data) => {
  const existing = await CatalogItem.findOne({
    name: { $regex: `^${data.name}$`, $options: 'i' },
    type: data.type,
    isDeleted: false,
    ...(data.tenantId ? { tenantId: data.tenantId } : {}),
  });
  if (existing) throw ApiError.badRequest(`${data.type.toLowerCase()} "${data.name}" already exists`);
  return CatalogItem.create(data);
};

export const updateCatalogItem = async (id, data, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const item = await CatalogItem.findOne(query);
  if (!item) throw ApiError.notFound('Catalog item not found');

  const duplicate = await CatalogItem.findOne({
    _id: { $ne: id },
    name: { $regex: `^${data.name}$`, $options: 'i' },
    type: item.type,
    isDeleted: false,
    ...(tenantId ? { tenantId } : {}),
  });
  if (duplicate) throw ApiError.badRequest(`${item.type.toLowerCase()} "${data.name}" already exists`);

  item.name = data.name;
  await item.save();
  return item;
};

export const deleteCatalogItem = async (id, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const item = await CatalogItem.findOne(query);
  if (!item) throw ApiError.notFound('Catalog item not found');
  item.isDeleted = true;
  await item.save();
  return item;
};

export const bulkCreateCatalogItems = async (items, tenantId = null) => {
  const results = [];
  for (const item of items) {
    try {
      const existing = await CatalogItem.findOne({
        name: { $regex: `^${item.name}$`, $options: 'i' },
        type: item.type,
        isDeleted: false,
        ...(tenantId ? { tenantId } : {}),
      });
      if (!existing) {
        const created = await CatalogItem.create({ ...item, tenantId: tenantId || null });
        results.push(created);
      }
    } catch (e) {
      // skip duplicates
    }
  }
  return results;
};

export const getCatalogStats = async (tenantId = null) => {
  const query = { isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const categories = await CatalogItem.countDocuments({ ...query, type: 'CATEGORY' });
  const brands = await CatalogItem.countDocuments({ ...query, type: 'BRAND' });
  return { categories, brands, total: categories + brands };
};
