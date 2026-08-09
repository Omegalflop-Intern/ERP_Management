import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

export function formatWarrantyClaim(row, imeiRow = null, customerRow = null, invoiceRow = null, userRow = null) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    imei: imeiRow ? {
      _id: String(imeiRow.id),
      id: imeiRow.id,
      imeiOrSerial: imeiRow.imei_or_serial,
      warrantyMonths: Number(imeiRow.warranty_months || 12),
      warrantyExpiry: imeiRow.warranty_expiry || null,
    } : String(row.imei_id),
    customer: customerRow ? {
      _id: String(customerRow.id),
      id: customerRow.id,
      name: customerRow.name,
      phone: customerRow.phone,
      email: customerRow.email || '',
      address: customerRow.address || '',
    } : String(row.customer_id),
    invoiceRef: invoiceRow ? {
      _id: String(invoiceRow.id),
      id: invoiceRow.id,
      invoiceNumber: invoiceRow.invoice_number,
      netTotal: Number(invoiceRow.net_total || 0),
    } : (row.invoice_id ? String(row.invoice_id) : null),
    claimType: row.claim_type,
    description: row.description,
    status: row.status || 'pending',
    resolution: row.resolution || '',
    resolvedBy: userRow ? {
      _id: String(userRow.id),
      id: userRow.id,
      username: userRow.username,
    } : (row.resolved_by ? String(row.resolved_by) : null),
    resolvedAt: row.resolved_at || null,
    notes: row.notes || '',
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId, tablePrefix = 'warranty_claims') {
  if (tenantId) {
    query.where(`${tablePrefix}.tenant_id`, tenantId);
  }
}

export const getAllClaims = async (page = 1, limit = 20, status = '', search = '', tenantId = null) => {
  const countQuery = db('warranty_claims').where({ 'warranty_claims.is_deleted': false });
  applyTenantScope(countQuery, tenantId, 'warranty_claims');
  if (status) countQuery.where('warranty_claims.status', status);

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('warranty_claims')
    .leftJoin('inventory_units', 'warranty_claims.imei_id', 'inventory_units.id')
    .leftJoin('customers', 'warranty_claims.customer_id', 'customers.id')
    .leftJoin('transactions', 'warranty_claims.invoice_id', 'transactions.id')
    .leftJoin('users', 'warranty_claims.resolved_by', 'users.id')
    .where({ 'warranty_claims.is_deleted': false })
    .select(
      'warranty_claims.*',
      'inventory_units.id as i_id', 'inventory_units.imei_or_serial as i_imei', 'inventory_units.warranty_months as i_wm', 'inventory_units.warranty_expiry as i_we',
      'customers.id as c_id', 'customers.name as c_name', 'customers.phone as c_phone', 'customers.email as c_email', 'customers.address as c_address',
      'transactions.id as tx_id', 'transactions.invoice_number as tx_num', 'transactions.net_total as tx_total',
      'users.id as u_id', 'users.username as u_username'
    );
  applyTenantScope(dataQuery, tenantId, 'warranty_claims');
  if (status) dataQuery.where('warranty_claims.status', status);

  const rows = await dataQuery.orderBy('warranty_claims.created_at', 'desc').limit(limit).offset(offset);

  const claims = rows.map((row) => {
    const iRow = row.i_id ? { id: row.i_id, imei_or_serial: row.i_imei, warranty_months: row.i_wm, warranty_expiry: row.i_we } : null;
    const cRow = row.c_id ? { id: row.c_id, name: row.c_name, phone: row.c_phone, email: row.c_email, address: row.c_address } : null;
    const txRow = row.tx_id ? { id: row.tx_id, invoice_number: row.tx_num, net_total: row.tx_total } : null;
    const uRow = row.u_id ? { id: row.u_id, username: row.u_username } : null;
    return formatWarrantyClaim(row, iRow, cRow, txRow, uRow);
  });

  return { claims, pagination: getPagination(total, page, limit) };
};

export const getClaimById = async (id, tenantId = null) => {
  const dataQuery = db('warranty_claims')
    .leftJoin('inventory_units', 'warranty_claims.imei_id', 'inventory_units.id')
    .leftJoin('customers', 'warranty_claims.customer_id', 'customers.id')
    .leftJoin('transactions', 'warranty_claims.invoice_id', 'transactions.id')
    .leftJoin('users', 'warranty_claims.resolved_by', 'users.id')
    .where({ 'warranty_claims.id': id, 'warranty_claims.is_deleted': false })
    .select(
      'warranty_claims.*',
      'inventory_units.id as i_id', 'inventory_units.imei_or_serial as i_imei', 'inventory_units.warranty_months as i_wm', 'inventory_units.warranty_expiry as i_we',
      'customers.id as c_id', 'customers.name as c_name', 'customers.phone as c_phone', 'customers.email as c_email', 'customers.address as c_address',
      'transactions.id as tx_id', 'transactions.invoice_number as tx_num', 'transactions.net_total as tx_total',
      'users.id as u_id', 'users.username as u_username'
    );
  applyTenantScope(dataQuery, tenantId, 'warranty_claims');

  const row = await dataQuery.first();
  if (!row) throw ApiError.notFound('Warranty claim not found');

  const iRow = row.i_id ? { id: row.i_id, imei_or_serial: row.i_imei, warranty_months: row.i_wm, warranty_expiry: row.i_we } : null;
  const cRow = row.c_id ? { id: row.c_id, name: row.c_name, phone: row.c_phone, email: row.c_email, address: row.c_address } : null;
  const txRow = row.tx_id ? { id: row.tx_id, invoice_number: row.tx_num, net_total: row.tx_total } : null;
  const uRow = row.u_id ? { id: row.u_id, username: row.u_username } : null;

  return formatWarrantyClaim(row, iRow, cRow, txRow, uRow);
};

export const createClaim = async (data, tenantId = null) => {
  const [insertedId] = await db('warranty_claims').insert({
    tenant_id: tenantId || data.tenantId || null,
    imei_id: data.imei || data.imeiId,
    customer_id: data.customer || data.customerId,
    invoice_id: data.invoiceRef || data.invoiceId || null,
    claim_type: data.claimType,
    description: data.description,
    status: data.status || 'pending',
    resolution: data.resolution || null,
    notes: data.notes || null,
    is_deleted: false,
  });

  return getClaimById(insertedId, tenantId);
};

export const updateClaim = async (id, data, userId, tenantId = null) => {
  const claim = await getClaimById(id, tenantId);
  if (!claim) throw ApiError.notFound('Warranty claim not found');

  const updateFields = {};
  if (data.status) {
    updateFields.status = data.status;
    if (data.status !== 'pending') {
      updateFields.resolved_by = userId || null;
      updateFields.resolved_at = new Date();
    }
  }
  if (data.resolution !== undefined) updateFields.resolution = data.resolution;
  if (data.notes !== undefined) updateFields.notes = data.notes;

  if (Object.keys(updateFields).length > 0) {
    const q = db('warranty_claims').where({ id });
    if (tenantId) q.andWhere('tenant_id', tenantId);
    await q.update(updateFields);
  }

  return getClaimById(id, tenantId);
};

export const getClaimsByIMEI = async (imeiId, tenantId = null) => {
  const dataQuery = db('warranty_claims').where({ imei_id: imeiId, is_deleted: false });
  applyTenantScope(dataQuery, tenantId, 'warranty_claims');
  const rows = await dataQuery.orderBy('created_at', 'desc');
  return rows.map(r => formatWarrantyClaim(r));
};
