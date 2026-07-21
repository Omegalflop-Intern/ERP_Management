import * as catalogService from './catalog.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllCatalogItems = async (req, res, next) => {
  try {
    const { type = '', search = '' } = req.query;
    const items = await catalogService.getAllCatalogItems(type, search);
    return ApiResponse.success(res, items);
  } catch (error) { next(error); }
};

export const getCatalogItemById = async (req, res, next) => {
  try {
    const item = await catalogService.getCatalogItemById(req.params.id);
    return ApiResponse.success(res, item);
  } catch (error) { next(error); }
};

export const createCatalogItem = async (req, res, next) => {
  try {
    const item = await catalogService.createCatalogItem(req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'catalog', entityId: item._id, entityType: 'CatalogItem', details: { name: item.name, type: item.type }, req });
    return ApiResponse.created(res, item);
  } catch (error) { next(error); }
};

export const updateCatalogItem = async (req, res, next) => {
  try {
    const item = await catalogService.updateCatalogItem(req.params.id, req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'catalog', entityId: item._id, entityType: 'CatalogItem', details: { name: item.name }, req });
    return ApiResponse.success(res, item, 'Catalog item updated');
  } catch (error) { next(error); }
};

export const deleteCatalogItem = async (req, res, next) => {
  try {
    await catalogService.deleteCatalogItem(req.params.id);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'catalog', entityId: req.params.id, entityType: 'CatalogItem', req });
    return ApiResponse.success(res, null, 'Catalog item deleted');
  } catch (error) { next(error); }
};

export const bulkCreateCatalogItems = async (req, res, next) => {
  try {
    const items = await catalogService.bulkCreateCatalogItems(req.body.items);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'BULK_CREATE', module: 'catalog', entityType: 'CatalogItem', details: { count: items.length }, req });
    return ApiResponse.created(res, items, `${items.length} items created`);
  } catch (error) { next(error); }
};

export const getCatalogStats = async (req, res, next) => {
  try {
    const stats = await catalogService.getCatalogStats();
    return ApiResponse.success(res, stats);
  } catch (error) { next(error); }
};
