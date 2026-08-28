import * as saleService from './sale.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { ApiError } from '../../utils/http/ApiError.js';
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

    // Fire-and-forget email notification with public invoice link AND attached PDF
    if (sale.customerEmail) {
      const invoiceEmailData = {
        invoiceNo: sale.invoiceNumber,
        grandTotal: sale.netTotal,
        netTotal: sale.netTotal,
        subTotal: sale.subTotal,
        discount: sale.discount,
        tax: sale.tax,
        lineItems: sale.lineItems || [],
        paymentBreakdown: sale.paymentBreakdown || {},
        createdAt: sale.createdAt,
        cashierUsername: sale.cashierUsername,
        customerPhone: sale.customerPhone,
        customerAddress: sale.customerAddress,
        tenantId: sale.tenantId,
        invoiceLink: `${process.env.CLIENT_URL || process.env.APP_URL || ''}/invoice/${sale.publicToken}`,
      };

      generateInvoicePdfBuffer(sale)
        .then((pdfBuffer) => {
          import('../../config/mailer.js')
            .then(({ sendCustomerInvoiceEmail }) =>
              sendCustomerInvoiceEmail(sale.customerEmail, sale.customerName, { ...invoiceEmailData, pdfBuffer })
            )
            .catch(() => {});
        })
        .catch(() => {
          import('../../config/mailer.js')
            .then(({ sendCustomerInvoiceEmail }) =>
              sendCustomerInvoiceEmail(sale.customerEmail, sale.customerName, invoiceEmailData)
            )
            .catch(() => {});
        });
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
    const sale = await saleService.getSaleById(req.params.id, tenantId, req.selectedBranchId);
    return ApiResponse.success(res, sale);
  } catch (error) { next(error); }
};

export const getSalePdf = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const sale = await saleService.getSaleById(req.params.id, tenantId, req.selectedBranchId);
    const pdfBuffer = await generateInvoicePdfBuffer(sale);
    // Bug #25 fixed: Null-check pdfBuffer before attempting to read .length or send it.
    // generateInvoicePdfBuffer can return null if PDF generation fails.
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return next(ApiError.internal('Failed to generate PDF. Please try again.'));
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${sale.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) { next(error); }
};

export const getSaleByInvoice = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const sale = await saleService.getSaleByInvoice(req.params.invoiceNumber, tenantId, req.selectedBranchId);
    return ApiResponse.success(res, sale);
  } catch (error) { next(error); }
};

export const processReturn = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const result = await saleService.processReturn(req.params.id, req.body, tenantId, req.selectedBranchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'RETURN', module: 'sale', entityId: req.params.id, entityType: 'Transaction', details: { refundAmount: result.refundAmount }, req });
    return ApiResponse.success(res, result, `Return processed — ৳${result.refundAmount.toLocaleString()} refunded`);
  } catch (error) { next(error); }
};

export const deleteSale = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await saleService.deleteSale(req.params.id, tenantId, req.selectedBranchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'sale', entityId: req.params.id, entityType: 'Transaction', req });
    return ApiResponse.success(res, null, 'Sale deleted');
  } catch (error) { next(error); }
};

export const updateSale = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const sale = await saleService.updateSale(req.params.id, req.body, tenantId, req.selectedBranchId, req.user?.username || 'system');
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

export const getPublicInvoicePdf = async (req, res, next) => {
  try {
    const { token } = req.params;
    const sale = await saleService.getSaleByPublicToken(token);
    if (!sale) throw ApiError.notFound('Invoice not found or link has expired');
    const pdfBuffer = await generateInvoicePdfBuffer(sale);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${sale.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) { next(error); }
};
