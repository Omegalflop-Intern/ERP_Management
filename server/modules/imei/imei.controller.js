import * as imeiService from './imei.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { logAction } from '../../utils/auth/auditLog.js';
import XLSX from 'xlsx';
import { Product } from '../product/product.model.js';
import { InventoryUnit } from './imei.model.js';

export const getAllIMEI = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', category = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const result = await imeiService.getAllIMEI(Number(page), Number(limit), search, status, category, tenantId);
    return ApiResponse.paginated(res, result.units, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getIMEIPassport = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const unit = await imeiService.getIMEIPassport(req.params.imei, tenantId);
    return ApiResponse.success(res, unit);
  } catch (error) { next(error); }
};

export const addInventoryUnit = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const unitData = {
      ...req.body,
      tenantId: req.user?.tenantId || null,
    };
    const unit = await imeiService.addInventoryUnit(unitData, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'ADD_IMEI', module: 'imei', entityId: unit._id, entityType: 'InventoryUnit', details: { imeiOrSerial: unit.imeiOrSerial }, req });
    return ApiResponse.created(res, unit, 'Inventory unit added');
  } catch (error) { next(error); }
};

export const importIMEI = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest('No file uploaded');
    const tenantId = req.user?.tenantId || null;
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);
    let created = 0, skipped = 0, errors = [];

    for (const row of rows) {
      try {
        const imei = (row['IMEI'] || row['imei'] || '').toString().trim();
        const sku = (row['SKU'] || row['sku'] || '').toString().trim().toUpperCase();
        if (!imei || !sku) { skipped++; continue; }

        const existsQuery = { imeiOrSerial: imei, isDeleted: false };
        if (tenantId) existsQuery.tenantId = tenantId;
        const exists = await InventoryUnit.findOne(existsQuery);
        if (exists) { skipped++; continue; }

        const productQuery = { sku, isDeleted: false };
        if (tenantId) productQuery.tenantId = tenantId;
        const product = await Product.findOne(productQuery);
        if (!product) { errors.push({ row: imei, error: `Product not found for SKU: ${sku}` }); continue; }

        const warrantyMonths = Number(row['Warranty Months']) || 12;
        const warrantyExpiry = new Date();
        warrantyExpiry.setMonth(warrantyExpiry.getMonth() + warrantyMonths);

        await InventoryUnit.create({
          tenantId: tenantId || null,
          imeiOrSerial: imei,
          productId: product._id,
          branchId: row['Branch ID'] || undefined,
          purchasePrice: Number(row['Purchase Price']) || product.costPrice,
          currentSellingPrice: Number(row['Selling Price']) || product.sellingPrice,
          supplierId: row['Supplier ID'] || undefined,
          warrantyMonths,
          warrantyExpiry,
          status: 'Available',
        });
        created++;
      } catch (e) { errors.push({ row: row['IMEI'] || '?', error: e.message }); }
    }

    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'IMPORT', module: 'imei', entityType: 'InventoryUnit', details: { created, skipped, errors: errors.length }, req });
    return ApiResponse.success(res, { created, skipped, errors }, 'Import complete');
  } catch (error) { next(error); }
};

export const updateIMEIStatus = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const unit = await imeiService.updateIMEIStatus(req.params.id, req.body.status, req.user?.username, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE_STATUS', module: 'imei', entityId: unit._id, entityType: 'InventoryUnit', details: { status: req.body.status }, req });
    return ApiResponse.success(res, unit, 'Status updated');
  } catch (error) { next(error); }
};

export const priceDropAdjustment = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const result = await imeiService.priceDropAdjustment(req.body.productName, req.body.newSellingPrice, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'PRICE_DROP', module: 'imei', entityType: 'InventoryUnit', details: { productName: req.body.productName, newPrice: req.body.newSellingPrice, modifiedCount: result.modifiedCount }, req });
    return ApiResponse.success(res, result, `Price drop applied to ${result.modifiedCount} units`);
  } catch (error) { next(error); }
};

export const deleteIMEI = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await imeiService.deleteIMEI(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'imei', entityId: req.params.id, entityType: 'InventoryUnit', req });
    return ApiResponse.success(res, null, 'IMEI deleted');
  } catch (error) { next(error); }
};
