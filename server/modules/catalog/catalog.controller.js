import * as catalogService from './catalog.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllCatalogItems = async (req, res, next) => {
  try {
    const { type = '', search = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const items = await catalogService.getAllCatalogItems(type, search, tenantId);
    return ApiResponse.success(res, items);
  } catch (error) { next(error); }
};

export const getCatalogItemById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const item = await catalogService.getCatalogItemById(req.params.id, tenantId);
    return ApiResponse.success(res, item);
  } catch (error) { next(error); }
};

export const createCatalogItem = async (req, res, next) => {
  try {
    const itemData = {
      ...req.body,
      tenantId: req.user?.tenantId || null,
    };
    const item = await catalogService.createCatalogItem(itemData);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'catalog', entityId: item._id, entityType: 'CatalogItem', details: { name: item.name, type: item.type }, req });
    return ApiResponse.created(res, item);
  } catch (error) { next(error); }
};

export const updateCatalogItem = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const item = await catalogService.updateCatalogItem(req.params.id, req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'catalog', entityId: item._id, entityType: 'CatalogItem', details: { name: item.name }, req });
    return ApiResponse.success(res, item, 'Catalog item updated');
  } catch (error) { next(error); }
};

export const deleteCatalogItem = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await catalogService.deleteCatalogItem(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'catalog', entityId: req.params.id, entityType: 'CatalogItem', req });
    return ApiResponse.success(res, null, 'Catalog item deleted');
  } catch (error) { next(error); }
};

export const bulkCreateCatalogItems = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const items = await catalogService.bulkCreateCatalogItems(req.body.items, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'BULK_CREATE', module: 'catalog', entityType: 'CatalogItem', details: { count: items.length }, req });
    return ApiResponse.created(res, items, `${items.length} items created`);
  } catch (error) { next(error); }
};

export const getCatalogStats = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const stats = await catalogService.getCatalogStats(tenantId);
    return ApiResponse.success(res, stats);
  } catch (error) { next(error); }
};
