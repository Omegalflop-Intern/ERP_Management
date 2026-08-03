import * as productService from './product.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { logAction } from '../../utils/auth/auditLog.js';
import XLSX from 'xlsx';
import { Product } from './product.model.js';
import { InventoryUnit } from '../imei/imei.model.js';
import { validateUploadedFile } from '../../config/upload.js';

export const getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', category = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const result = await productService.getAllProducts(Number(page), Number(limit), search, category, tenantId);
    return ApiResponse.paginated(res, result.products, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return ApiResponse.success(res, product);
  } catch (error) { next(error); }
};

export const createProduct = async (req, res, next) => {
  try {
    const productData = {
      ...req.body,
      tenantId: req.user?.tenantId || null,
    };
    const product = await productService.createProduct(productData);

    // If IMEI / Serial number is provided in product creation, create Available InventoryUnit
    if (req.body.imeiOrSerial || req.body.imei) {
      const imei = (req.body.imeiOrSerial || req.body.imei).toString().trim();
      if (imei) {
        await InventoryUnit.create({
          tenantId: req.user?.tenantId || undefined,
          imeiOrSerial: imei,
          productId: product._id,
          purchasePrice: product.costPrice || 0,
          currentSellingPrice: product.sellingPrice || 0,
          status: 'Available',
          warrantyMonths: req.body.warrantyMonths || 12,
        }).catch(() => {});
      }
    }

    // Sync stockQuantity on Product document
    const availableCount = await InventoryUnit.countDocuments({ productId: product._id, status: 'Available', isDeleted: false });
    product.stockQuantity = availableCount > 0 ? availableCount : (req.body.stockQuantity || 0);
    await product.save().catch(() => {});

    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'product', entityId: product._id, entityType: 'Product', details: { name: product.name, sku: product.sku }, req });
    return ApiResponse.created(res, product, 'Product created');
  } catch (error) { next(error); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'product', entityId: product._id, entityType: 'Product', details: { name: product.name }, req });
    return ApiResponse.success(res, product, 'Product updated');
  } catch (error) { next(error); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'product', entityId: req.params.id, entityType: 'Product', req });
    return ApiResponse.success(res, null, 'Product deleted');
  } catch (error) { next(error); }
};

export const uploadImage = async (req, res, next) => {
  try {
    await validateUploadedFile(req);
    if (!req.file) throw ApiError.badRequest('No image file provided');
    const imageUrl = `/uploads/products/${req.file.filename}`;
    const product = await productService.updateProduct(req.params.id, { image: imageUrl });
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPLOAD_IMAGE', module: 'product', entityId: req.params.id, entityType: 'Product', details: { image: imageUrl }, req });
    return ApiResponse.success(res, { image: imageUrl }, 'Image uploaded');
  } catch (error) { next(error); }
};

export const exportProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isDeleted: false }).select('-isDeleted -createdAt -updatedAt -__v').lean();
    const rows = products.map(p => ({
      Name: p.name,
      Brand: p.brand,
      Model: p.model || '',
      SKU: p.sku,
      Barcode: p.barcode || '',
      Category: p.category,
      'Cost Price': p.costPrice,
      'Selling Price': p.sellingPrice,
      'Wholesale Price': p.wholesalePrice || '',
      'VAT Rate': p.vatRate || 0,
      Unit: p.unit || 'piece',
      RAM: p.ram || '',
      Storage: p.storage || '',
      Color: p.color || '',
      'Min Stock Alert': p.minStockAlert || 2,
      Active: p.isActive ? 'Yes' : 'No',
      Description: p.description || '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'EXPORT', module: 'product', entityType: 'Product', details: { count: products.length }, req });
    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  } catch (error) { next(error); }
};

export const importProducts = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest('No file uploaded');
    const tenantId = req.user?.tenantId || null;
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);
    let created = 0, skipped = 0, errors = [];
    for (const row of rows) {
      try {
        if (!row.Name || !row.SKU) { skipped++; continue; }
        const query = { sku: row.SKU, isDeleted: false };
        if (tenantId) query.tenantId = tenantId;
        const exists = await Product.findOne(query);
        if (exists) { skipped++; continue; }
        await Product.create({
          tenantId: tenantId || undefined,
          name: row.Name,
          brand: row.Brand || '',
          model: row.Model || '',
          sku: row.SKU,
          barcode: row.Barcode || '',
          category: row.Category || 'Other',
          costPrice: Number(row['Cost Price']) || 0,
          sellingPrice: Number(row['Selling Price']) || 0,
          wholesalePrice: Number(row['Wholesale Price']) || 0,
          vatRate: Number(row['VAT Rate']) || 0,
          unit: row.Unit || 'piece',
          ram: row.RAM || '',
          storage: row.Storage || '',
          color: row.Color || '',
          minStockAlert: Number(row['Min Stock Alert']) || 2,
          isActive: row.Active === 'No' ? false : true,
          description: row.Description || '',
        });
        created++;
      } catch (e) { errors.push({ row: row.SKU, error: e.message }); }
    }
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'IMPORT', module: 'product', entityType: 'Product', details: { created, skipped, errors: errors.length }, req });
    return ApiResponse.success(res, { created, skipped, errors }, 'Import complete');
  } catch (error) { next(error); }
};

export const bulkImportJSON = async (req, res, next) => {
  try {
    const { rows } = req.body;
    const tenantId = req.user?.tenantId || null;
    const result = await productService.bulkImportProducts(rows, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'BULK_IMPORT', module: 'product', entityType: 'Product', details: result, req });
    return ApiResponse.success(res, result, `Bulk import completed: ${result.createdProductsCount} products and ${result.createdImeisCount} IMEIs added.`);
  } catch (error) { next(error); }
};

export const getProductIMEIUnits = async (req, res, next) => {
  try {
    const { id } = req.params;
    const units = await InventoryUnit.find({ productId: id, isDeleted: false })
      .select('imeiOrSerial color ram storage status purchasePrice currentSellingPrice')
      .sort({ status: 1, createdAt: -1 })
      .lean();
    return ApiResponse.success(res, units);
  } catch (error) { next(error); }
};

