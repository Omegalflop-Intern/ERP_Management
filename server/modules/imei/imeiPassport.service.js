import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getIMEIBySerial } from './imei.service.js';

export const getImeiPassport = async (imei, tenantId = null) => {
  const unit = await getIMEIBySerial(imei, tenantId);
  if (!unit) {
    throw ApiError.notFound(`IMEI or Serial '${imei}' not found in inventory.`);
  }

  const txQuery = db('transactions').where({ 'transactions.is_deleted': false });
  if (tenantId) txQuery.where('tenant_id', tenantId);

  const sales = await txQuery.whereRaw("JSON_SEARCH(line_items, 'one', ?) IS NOT NULL", [imei]);

  const repQuery = db('repair_tickets').where({ imei_or_serial: imei, is_deleted: false });
  if (tenantId) repQuery.where('tenant_id', tenantId);
  const repairs = await repQuery;

  const timeline = [];
  timeline.push({
    event: 'STOCK_INWARD',
    timestamp: unit.createdAt,
    details: `Purchased at Cost ৳${unit.purchasePrice || 0}`,
    purchasePrice: unit.purchasePrice,
    status: unit.status,
  });

  sales.forEach((sale) => {
    timeline.push({
      event: 'SOLD',
      timestamp: sale.created_at,
      invoiceNumber: sale.invoice_number,
      customer: sale.customer_name || 'Walk-in Customer',
      salePrice: Number(sale.net_total || 0),
    });
  });

  repairs.forEach((repair) => {
    timeline.push({
      event: 'REPAIR_SERVICED',
      timestamp: repair.created_at,
      ticketNumber: repair.ticket_number,
      problem: repair.issue_description,
      cost: Number(repair.estimated_cost || 0),
      status: repair.status,
    });
  });

  timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return {
    imei: unit.imeiOrSerial,
    currentStatus: unit.status,
    product: unit.productId,
    supplier: unit.supplierId,
    branch: unit.branchId,
    timeline,
  };
};
