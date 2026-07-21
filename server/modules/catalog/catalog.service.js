import { CatalogItem } from './catalog.model.js';
import { ApiError } from '../../utils/http/ApiError.js';

export const getAllCatalogItems = async (type = '', search = '') => {
  const query = { isDeleted: false };
  if (type) query.type = type;
  if (search) query.name = { $regex: search, $options: 'i' };
  return CatalogItem.find(query).sort({ type: 1, name: 1 });
};

export const getCatalogItemById = async (id) => {
  const item = await CatalogItem.findOne({ _id: id, isDeleted: false });
  if (!item) throw ApiError.notFound('Catalog item not found');
  return item;
};

export const createCatalogItem = async (data) => {
  const existing = await CatalogItem.findOne({
    name: { $regex: `^${data.name}$`, $options: 'i' },
    type: data.type,
    isDeleted: false,
  });
  if (existing) throw ApiError.badRequest(`${data.type.toLowerCase()} "${data.name}" already exists`);
  return CatalogItem.create(data);
};

export const updateCatalogItem = async (id, data) => {
  const item = await CatalogItem.findOne({ _id: id, isDeleted: false });
  if (!item) throw ApiError.notFound('Catalog item not found');

  const duplicate = await CatalogItem.findOne({
    _id: { $ne: id },
    name: { $regex: `^${data.name}$`, $options: 'i' },
    type: item.type,
    isDeleted: false,
  });
  if (duplicate) throw ApiError.badRequest(`${item.type.toLowerCase()} "${data.name}" already exists`);

  item.name = data.name;
  await item.save();
  return item;
};

export const deleteCatalogItem = async (id) => {
  const item = await CatalogItem.findOne({ _id: id, isDeleted: false });
  if (!item) throw ApiError.notFound('Catalog item not found');
  item.isDeleted = true;
  await item.save();
  return item;
};

export const bulkCreateCatalogItems = async (items) => {
  const results = [];
  for (const item of items) {
    try {
      const existing = await CatalogItem.findOne({
        name: { $regex: `^${item.name}$`, $options: 'i' },
        type: item.type,
        isDeleted: false,
      });
      if (!existing) {
        const created = await CatalogItem.create(item);
        results.push(created);
      }
    } catch (e) {
      // skip duplicates
    }
  }
  return results;
};

export const getCatalogStats = async () => {
  const categories = await CatalogItem.countDocuments({ type: 'CATEGORY', isDeleted: false });
  const brands = await CatalogItem.countDocuments({ type: 'BRAND', isDeleted: false });
  return { categories, brands, total: categories + brands };
};
