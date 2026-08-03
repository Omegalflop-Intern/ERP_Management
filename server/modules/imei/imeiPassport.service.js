import { InventoryUnit } from './imei.model.js';
import { Transaction } from '../sale/sale.model.js';
import { RepairTicket } from '../../models/RepairTicket.js';
import { WarrantyClaim } from '../warranty/warranty.model.js';
import { ApiError } from '../../utils/http/ApiError.js';

export const getImeiPassport = async (imei, tenantId = null) => {
  const unitQuery = { imeiOrSerial: imei };
  if (tenantId) unitQuery.tenantId = tenantId;
  const unit = await InventoryUnit.findOne(unitQuery)
    .populate('productId', 'name brand model category price costPrice')
    .populate('supplierId', 'name phone companyName')
    .populate('branchId', 'name code');

  if (!unit) {
    throw ApiError.notFound(`IMEI or Serial '${imei}' not found in inventory.`);
  }

  // Gather sales history
  const saleQuery = { 'items.imeiOrSerial': imei };
  if (tenantId) saleQuery.tenantId = tenantId;
  const sales = await Transaction.find(saleQuery)
    .populate('customerId', 'name phone email customerType')
    .populate('soldBy', 'username fullName');

  // Gather repair history
  const repairQuery = { imeiOrSerial: imei };
  if (tenantId) repairQuery.tenantId = tenantId;
  const repairs = await RepairTicket.find(repairQuery);

  // Gather warranty claim history
  const warrantyQuery = { imeiOrSerial: imei };
  if (tenantId) warrantyQuery.tenantId = tenantId;
  const warrantyClaims = await WarrantyClaim.find(warrantyQuery);

  // Build sequential timeline events
  const timeline = [];

  // Event 1: Inward / Purchase
  timeline.push({
    event: 'STOCK_INWARD',
    timestamp: unit.createdAt,
    details: `Purchased from ${unit.supplierId?.name || 'Supplier'} at Cost TK ${unit.costPrice || 0}`,
    costPrice: unit.costPrice,
    status: unit.status,
  });

  // Event 2: Sales history
  sales.forEach((sale) => {
    timeline.push({
      event: 'SOLD',
      timestamp: sale.createdAt,
      invoiceNumber: sale.invoiceNumber,
      customer: sale.customerId?.name || 'Walk-in Customer',
      soldBy: sale.soldBy?.fullName || sale.soldBy?.username,
      salePrice: sale.netTotal,
    });
  });

  // Event 3: Repairs
  repairs.forEach((repair) => {
    timeline.push({
      event: 'REPAIR_SERVICED',
      timestamp: repair.createdAt,
      ticketNumber: repair.ticketNumber,
      problem: repair.problemDescription,
      cost: repair.cost,
      status: repair.status,
    });
  });

  // Event 4: Warranty Claims
  warrantyClaims.forEach((claim) => {
    timeline.push({
      event: 'WARRANTY_CLAIMED',
      timestamp: claim.createdAt,
      issue: claim.issueDescription,
      status: claim.status,
      resolution: claim.resolutionNotes,
    });
  });

  // Sort timeline chronologically
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
