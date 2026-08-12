import * as saleService from './sale.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';
import { generateInvoicePdfBuffer } from '../../services/pdf.service.js';

export const createSale = async (req, res, next) => {
  try {
    const cashierName = req.user?.fullName || req.user?.name || req.user?.username || 'System Admin';
    const saleData = {
      ...req.body,
      tenantId: req.user?.tenantId || null,
      branchId: req.body.branchId || req.selectedBranchId || req.user?.branchId || null,
      sellerName: req.body.sellerName || cashierName,
      sellerId: req.user?._id || req.user?.id || null,
    };
    const sale = await saleService.createSale(saleData, cashierName);

    // Fire-and-forget email notification with public invoice link
    if (sale.customerEmail) {
      import('../../config/mailer.js').then(({ sendCustomerInvoiceEmail }) =>
        sendCustomerInvoiceEmail(sale.customerEmail, sale.customerName, {
          invoiceNo: sale.invoiceNumber,
          grandTotal: sale.netTotal,
          paymentStatus: sale.paymentBreakdown?.dueAmount > 0 ? 'Due' : 'Paid',
          invoiceLink: `${process.env.CLIENT_URL || process.env.APP_URL || ''}/invoice/${sale.publicToken}`,
        })
      ).catch(() => {});
    }

    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'sale', entityId: sale._id, entityType: 'Transaction', details: { invoiceNumber: sale.invoiceNumber, total: sale.netTotal }, req });
    return ApiResponse.created(res, sale, 'Sale completed successfully');
  } catch (error) { next(error); }
};

export const getAllSales = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, from, to, customer, status, paymentMethod, saleType, branchId } = req.query;
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.selectedBranchId || branchId || null;
    const result = await saleService.getAllSales(Number(page), Number(limit), { from, to, customer, status, paymentMethod, saleType, tenantId, branchId: effectiveBranchId });
    return ApiResponse.paginated(res, result.sales, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getSaleById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const sale = await saleService.getSaleById(req.params.id, tenantId);
    return ApiResponse.success(res, sale);
  } catch (error) { next(error); }
};

export const getSalePdf = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const sale = await saleService.getSaleById(req.params.id, tenantId);
    const pdfBuffer = await generateInvoicePdfBuffer(sale);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${sale.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) { next(error); }
};

export const getSaleByInvoice = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const sale = await saleService.getSaleByInvoice(req.params.invoiceNumber, tenantId);
    return ApiResponse.success(res, sale);
  } catch (error) { next(error); }
};

export const processReturn = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const result = await saleService.processReturn(req.params.id, req.body, req.user?.username || 'system', tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'RETURN', module: 'sale', entityId: req.params.id, entityType: 'Transaction', details: { refundAmount: result.refundAmount }, req });
    return ApiResponse.success(res, result, `Return processed — ৳${result.refundAmount.toLocaleString()} refunded`);
  } catch (error) { next(error); }
};

export const deleteSale = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await saleService.deleteSale(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'sale', entityId: req.params.id, entityType: 'Transaction', req });
    return ApiResponse.success(res, null, 'Sale deleted');
  } catch (error) { next(error); }
};

export const updateSale = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const sale = await saleService.updateSale(req.params.id, req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'sale', entityId: sale._id, entityType: 'Transaction', details: { invoiceNumber: sale.invoiceNumber }, req });
    return ApiResponse.success(res, sale, 'Sale updated');
  } catch (error) { next(error); }
};

export const getPublicInvoice = async (req, res, next) => {
  try {
    const { token } = req.params;
    const sale = await saleService.getSaleByPublicToken(token);
    return ApiResponse.success(res, sale);
  } catch (error) { next(error); }
};
