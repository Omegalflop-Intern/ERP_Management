import { StockTransfer } from './stock.model.js';
import { InventoryUnit } from '../imei/imei.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

export const getAllTransfers = async (page = 1, limit = 20, status = '', tenantId = null) => {
  const query = { isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  if (status && status !== 'ALL') query.status = status;

  const total = await StockTransfer.countDocuments(query);
  const transfers = await paginate(
    StockTransfer.find(query)
      .populate('fromBranchId')
      .populate('toBranchId')
      .populate('productId'),
    page, limit
  ).sort({ createdAt: -1 });

  return { transfers, pagination: getPagination(total, page, limit) };
};

export const getTransferById = async (id, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const transfer = await StockTransfer.findOne(query)
    .populate('fromBranchId')
    .populate('toBranchId')
    .populate('productId');
  if (!transfer) throw ApiError.notFound('Transfer not found');
  return transfer;
};

export const createTransfer = async (data, transferredBy = 'system', tenantId = null) => {
  if (data.fromBranchId === data.toBranchId) throw ApiError.badRequest('Source and destination branches cannot be the same');

  const transferNumber = 'TRF-' + Date.now().toString(36).toUpperCase();

  if (data.imeiOrSerial) {
    const unitQuery = { imeiOrSerial: data.imeiOrSerial, isDeleted: false };
    if (tenantId) unitQuery.tenantId = tenantId;
    const unit = await InventoryUnit.findOne(unitQuery);
    if (!unit) throw ApiError.notFound('IMEI not found');
    if (unit.status !== 'Available') throw ApiError.badRequest(`IMEI is ${unit.status}, cannot transfer`);

    unit.status = 'Transferred';
    unit.passportHistory.push({
      event: 'TRANSFERRED',
      details: `Transferred out — ${transferNumber}`,
      performedBy: transferredBy,
    });
    await unit.save();
  }

  const transfer = await StockTransfer.create({
    ...data,
    transferNumber,
    tenantId: tenantId || data.tenantId || null,
    transferredBy,
  });

  return transfer;
};

export const updateTransferStatus = async (id, status, performedBy = 'system', tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const transfer = await StockTransfer.findOne(query);
  if (!transfer) throw ApiError.notFound('Transfer not found');

  if (status === 'DELIVERED') {
    if (transfer.imeiOrSerial) {
      const unitQuery = { imeiOrSerial: transfer.imeiOrSerial, isDeleted: false };
      if (tenantId) unitQuery.tenantId = tenantId;
      const unit = await InventoryUnit.findOne(unitQuery);
      if (unit) {
        unit.branchId = transfer.toBranchId;
        unit.status = 'Available';
        unit.passportHistory.push({
          event: 'TRANSFERRED',
          details: `Received at destination — ${transfer.transferNumber}`,
          performedBy,
        });
        await unit.save();
      }
    }
    transfer.deliveredAt = new Date();
  } else if (status === 'CANCELLED') {
    if (transfer.imeiOrSerial) {
      const unitQuery = { imeiOrSerial: transfer.imeiOrSerial, isDeleted: false };
      if (tenantId) unitQuery.tenantId = tenantId;
      const unit = await InventoryUnit.findOne(unitQuery);
      if (unit && unit.status === 'Transferred') {
        unit.status = 'Available';
        unit.passportHistory.push({
          event: 'TRANSFER_CANCELLED',
          details: `Transfer cancelled — ${transfer.transferNumber}`,
          performedBy,
        });
        await unit.save();
      }
    }
  }

  transfer.status = status;
  await transfer.save();
  return transfer;
};

export const deleteTransfer = async (id, tenantId = null) => {
  const query = { _id: id, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;
  const transfer = await StockTransfer.findOne(query);
  if (!transfer) throw ApiError.notFound('Transfer not found');
  transfer.isDeleted = true;
  await transfer.save();
  return transfer;
};
