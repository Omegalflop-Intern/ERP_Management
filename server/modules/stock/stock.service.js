import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';
import emitter, { EVENTS } from '../../events/index.js';

export function formatStockTransfer(row, fromBranch = null, toBranch = null, product = null) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    transferNumber: row.transfer_number,
    fromBranchId: fromBranch ? { _id: String(fromBranch.id), id: fromBranch.id, name: fromBranch.name } : String(row.from_branch_id),
    toBranchId: toBranch ? { _id: String(toBranch.id), id: toBranch.id, name: toBranch.name } : String(row.to_branch_id),
    productId: product ? { _id: String(product.id), id: product.id, name: product.name, sku: product.sku } : String(row.product_id),
    imeiOrSerial: row.imei_or_serial || null,
    quantity: Number(row.quantity || 1),
    status: row.status || 'PENDING',
    notes: row.notes || '',
    transferredBy: row.transferred_by || '',
    deliveredAt: row.delivered_at || null,
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId, tablePrefix = 'stock_transfers') {
  if (tenantId) {
    query.where(`${tablePrefix}.tenant_id`, tenantId);
  }
}

export const getAllTransfers = async (page = 1, limit = 20, status = '', tenantId = null, branchId = null) => {
  const countQuery = db('stock_transfers').where('stock_transfers.is_deleted', false);
  applyTenantScope(countQuery, tenantId);
  if (status && status !== 'ALL') countQuery.where('stock_transfers.status', status);
  if (branchId) countQuery.where((b) => b.where('from_branch_id', branchId).orWhere('to_branch_id', branchId));

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('stock_transfers')
    .leftJoin('branches as fb', 'stock_transfers.from_branch_id', 'fb.id')
    .leftJoin('branches as tb', 'stock_transfers.to_branch_id', 'tb.id')
    .leftJoin('products', 'stock_transfers.product_id', 'products.id')
    .where('stock_transfers.is_deleted', false)
    .select(
      'stock_transfers.*',
      'fb.id as fb_id', 'fb.name as fb_name',
      'tb.id as tb_id', 'tb.name as tb_name',
      'products.id as p_id', 'products.name as p_name', 'products.sku as p_sku'
    );
  applyTenantScope(dataQuery, tenantId);
  if (status && status !== 'ALL') dataQuery.where('stock_transfers.status', status);
  if (branchId) dataQuery.where((b) => b.where('from_branch_id', branchId).orWhere('to_branch_id', branchId));

  const rows = await dataQuery.orderBy('stock_transfers.created_at', 'desc').limit(limit).offset(offset);

  const transfers = rows.map((row) => {
    const fb = row.fb_id ? { id: row.fb_id, name: row.fb_name } : null;
    const tb = row.tb_id ? { id: row.tb_id, name: row.tb_name } : null;
    const prod = row.p_id ? { id: row.p_id, name: row.p_name, sku: row.p_sku } : null;
    return formatStockTransfer(row, fb, tb, prod);
  });

  return { transfers, pagination: getPagination(total, page, limit) };
};

export const getTransferById = async (id, tenantId = null, branchId = null) => {
  const dataQuery = db('stock_transfers')
    .leftJoin('branches as fb', 'stock_transfers.from_branch_id', 'fb.id')
    .leftJoin('branches as tb', 'stock_transfers.to_branch_id', 'tb.id')
    .leftJoin('products', 'stock_transfers.product_id', 'products.id')
    .where({ 'stock_transfers.id': id, 'stock_transfers.is_deleted': false })
    .select(
      'stock_transfers.*',
      'fb.id as fb_id', 'fb.name as fb_name',
      'tb.id as tb_id', 'tb.name as tb_name',
      'products.id as p_id', 'products.name as p_name', 'products.sku as p_sku'
    );
  applyTenantScope(dataQuery, tenantId);
  if (branchId) dataQuery.where((b) => b.where('from_branch_id', branchId).orWhere('to_branch_id', branchId));

  const row = await dataQuery.first();
  if (!row) throw ApiError.notFound('Transfer not found');

  const fb = row.fb_id ? { id: row.fb_id, name: row.fb_name } : null;
  const tb = row.tb_id ? { id: row.tb_id, name: row.tb_name } : null;
  const prod = row.p_id ? { id: row.p_id, name: row.p_name, sku: row.p_sku } : null;

  return formatStockTransfer(row, fb, tb, prod);
};

export const createTransfer = async (data, transferredBy = 'system', tenantId = null, branchId = null) => {
  if (data.fromBranchId === data.toBranchId) throw ApiError.badRequest('Source and destination branches cannot be the same');

  const transferNumber = 'TRF-' + Date.now().toString(36).toUpperCase();

  if (data.imeiOrSerial) {
    const unitQuery = db('inventory_units').where({ imei_or_serial: data.imeiOrSerial, is_deleted: false });
    applyTenantScope(unitQuery, tenantId, 'inventory_units');
    const unit = await unitQuery.first();
    if (!unit) throw ApiError.notFound('IMEI not found');
    if (unit.status !== 'Available') throw ApiError.badRequest(`IMEI is ${unit.status}, cannot transfer`);

    let history = [];
    try { history = typeof unit.passport_history === 'string' ? JSON.parse(unit.passport_history) : (unit.passport_history || []); } catch { history = []; }
    history.push({
      event: 'TRANSFERRED',
      details: `Transferred out — ${transferNumber}`,
      performedBy: transferredBy,
      timestamp: new Date().toISOString(),
    });

    const uq1 = db('inventory_units').where({ id: unit.id });
    if (tenantId) uq1.andWhere('tenant_id', tenantId);
    await uq1.update({
      status: 'Transferred',
      passport_history: JSON.stringify(history),
    });
  }

  // Bug #35 fixed: For non-IMEI transfers, decrement source branch stock_quantity.
  // IMEI items are already handled above by marking the unit as 'Transferred'.
  if (!data.imeiOrSerial && data.productId) {
    const qty = Number(data.quantity || 1);
    const srcDecrQ = db('products').where({ id: data.productId });
    if (tenantId) srcDecrQ.andWhere('tenant_id', tenantId);
    await srcDecrQ.decrement('stock_quantity', qty);
  }

  const [insertedId] = await db('stock_transfers').insert({
    tenant_id: tenantId || data.tenantId || null,
    transfer_number: transferNumber,
    from_branch_id: data.fromBranchId,
    to_branch_id: data.toBranchId,
    product_id: data.productId,
    imei_or_serial: data.imeiOrSerial || null,
    quantity: data.quantity || 1,
    status: 'PENDING',
    notes: data.notes || null,
    transferred_by: transferredBy,
    is_deleted: false,
  });

  return getTransferById(insertedId, tenantId, branchId);
};

export const updateTransferStatus = async (id, status, performedBy = 'system', tenantId = null, branchId = null) => {
  const transfer = await getTransferById(id, tenantId, branchId);
  if (!transfer) throw ApiError.notFound('Transfer not found');

  const updateFields = { status };

  if (status === 'DELIVERED') {
    const toBranchId = transfer.toBranchId?.id || transfer.toBranchId;
    const fromBranchId = transfer.fromBranchId?.id || transfer.fromBranchId;
    const productId = transfer.productId?.id || transfer.productId;

    if (transfer.imeiOrSerial) {
      const unitQuery = db('inventory_units').where({ imei_or_serial: transfer.imeiOrSerial, is_deleted: false });
      if (tenantId) unitQuery.where('tenant_id', tenantId);
      const unit = await unitQuery.first();
      if (unit) {
        let history = [];
        try { history = typeof unit.passport_history === 'string' ? JSON.parse(unit.passport_history) : (unit.passport_history || []); } catch { history = []; }
        history.push({
          event: 'TRANSFERRED',
          details: `Received at destination — ${transfer.transferNumber}`,
          performedBy,
          timestamp: new Date().toISOString(),
        });
        const uq2 = db('inventory_units').where({ id: unit.id });
        if (tenantId) uq2.andWhere('tenant_id', tenantId);
        await uq2.update({
          branch_id: toBranchId,
          status: 'Available',
          passport_history: JSON.stringify(history),
        });
      }
    } else if (productId) {
      // General quantity transfer: move inventory units from source branch to destination branch
      const availUnits = await db('inventory_units')
        .where({ product_id: productId, is_deleted: false })
        .where((b) => b.where({ branch_id: fromBranchId }).orWhereNull('branch_id'))
        .whereIn('status', ['Available', 'Transferred'])
        .limit(transfer.quantity || 1);

      if (availUnits.length > 0) {
        const unitIds = availUnits.map((u) => u.id);
        await db('inventory_units')
          .whereIn('id', unitIds)
          .update({ branch_id: toBranchId, status: 'Available' });
      }
    }
    updateFields.delivered_at = new Date();
  } else if (status === 'CANCELLED') {
    if (transfer.imeiOrSerial) {
      const unitQuery = db('inventory_units').where({ imei_or_serial: transfer.imeiOrSerial, is_deleted: false });
      if (tenantId) unitQuery.where('tenant_id', tenantId);
      const unit = await unitQuery.first();
      if (unit && unit.status === 'Transferred') {
        let history = [];
        try { history = typeof unit.passport_history === 'string' ? JSON.parse(unit.passport_history) : (unit.passport_history || []); } catch { history = []; }
        history.push({
          event: 'TRANSFER_CANCELLED',
          details: `Transfer cancelled — ${transfer.transferNumber}`,
          performedBy,
          timestamp: new Date().toISOString(),
        });
        const uq3 = db('inventory_units').where({ id: unit.id });
        if (tenantId) uq3.andWhere('tenant_id', tenantId);
        await uq3.update({
          status: 'Available',
          passport_history: JSON.stringify(history),
        });
      }
    }
  }

  const tq = db('stock_transfers').where({ id });
  if (tenantId) tq.andWhere('tenant_id', tenantId);
  await tq.update(updateFields);
  const updated = await getTransferById(id, tenantId, branchId);
  emitter.emit(EVENTS.STOCK_UPDATED, { ...updated, tenantId });
  return updated;
};

export const deleteTransfer = async (id, tenantId = null, branchId = null) => {
  const transfer = await getTransferById(id, tenantId, branchId);
  if (!transfer) throw ApiError.notFound('Transfer not found');

  const delQ = db('stock_transfers').where({ id });
  if (tenantId) delQ.andWhere('tenant_id', tenantId);
  await delQ.update({ is_deleted: true });
  return { ...transfer, isDeleted: true };
};
