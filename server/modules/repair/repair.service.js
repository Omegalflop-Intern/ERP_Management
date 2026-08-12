import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

const generateTicketNumber = async (tenantId = null) => {
  const countQuery = db('repair_tickets');
  if (tenantId) countQuery.where('tenant_id', tenantId);
  const countRes = await countQuery.count({ count: '*' }).first();

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = Number(countRes?.count || 0) + 1;
  return `RPR-${dateStr}-${String(seq).padStart(3, '0')}`;
};

function parseJSON(str) {
  if (typeof str === 'string') {
    try { return JSON.parse(str); } catch { return []; }
  }
  return str || [];
}

export function formatRepairTicket(row) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    branchId: row.branch_id ? String(row.branch_id) : null,
    ticketNumber: row.ticket_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deviceModel: row.device_model,
    imeiOrSerial: row.imei_or_serial || null,
    issueDescription: row.issue_description,
    estimatedCost: Number(row.estimated_cost || 0),
    advancePaid: Number(row.advance_paid || 0),
    status: row.status || 'RECEIVED',
    technicianName: row.technician_name || '',
    partsUsed: parseJSON(row.parts_used),
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where('tenant_id', tenantId);
  }
}

export const getAllRepairs = async (page = 1, limit = 50, status = '', search = '', tenantId = null, branchId = null) => {
  const countQuery = db('repair_tickets').where({ is_deleted: false });
  applyTenantScope(countQuery, tenantId);
  if (branchId) countQuery.where({ branch_id: branchId });
  if (status) countQuery.where({ status });
  if (search) {
    const term = `%${search}%`;
    countQuery.where((b) => {
      b.where('customer_name', 'like', term)
        .orWhere('customer_phone', 'like', term)
        .orWhere('device_model', 'like', term)
        .orWhere('ticket_number', 'like', term)
        .orWhere('technician_name', 'like', term);
    });
  }

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('repair_tickets').where({ is_deleted: false });
  applyTenantScope(dataQuery, tenantId);
  if (branchId) dataQuery.where({ branch_id: branchId });
  if (status) dataQuery.where({ status });
  if (search) {
    const term = `%${search}%`;
    dataQuery.where((b) => {
      b.where('customer_name', 'like', term)
        .orWhere('customer_phone', 'like', term)
        .orWhere('device_model', 'like', term)
        .orWhere('ticket_number', 'like', term)
        .orWhere('technician_name', 'like', term);
    });
  }

  const rows = await dataQuery.orderBy('created_at', 'desc').limit(limit).offset(offset);
  const repairs = rows.map(formatRepairTicket);

  return { repairs, pagination: getPagination(total, page, limit) };
};

export const getRepairById = async (id, tenantId = null, branchId = null) => {
  const query = db('repair_tickets').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
  if (branchId) query.where('branch_id', branchId);
  const row = await query.first();
  if (!row) throw ApiError.notFound('Repair ticket not found');
  return formatRepairTicket(row);
};

export const createRepair = async (data, tenantId = null) => {
  const ticketNumber = await generateTicketNumber(tenantId);
  const [insertedId] = await db('repair_tickets').insert({
    tenant_id: tenantId || data.tenantId || null,
    branch_id: data.branchId || null,
    ticket_number: ticketNumber,
    customer_name: data.customerName,
    customer_phone: data.customerPhone,
    device_model: data.deviceModel,
    imei_or_serial: data.imeiOrSerial || null,
    issue_description: data.issueDescription,
    estimated_cost: data.estimatedCost || 0,
    advance_paid: data.advancePaid || 0,
    status: data.status || 'RECEIVED',
    technician_name: data.technicianName || null,
    parts_used: JSON.stringify(data.partsUsed || []),
    is_deleted: false,
  });

  return getRepairById(insertedId, tenantId, data.branchId);
};

export const updateRepairStatus = async (id, status, tenantId = null, branchId = null) => {
  const ticket = await getRepairById(id, tenantId, branchId);
  if (!ticket) throw ApiError.notFound('Repair ticket not found');

  const q1 = db('repair_tickets').where({ id });
  if (tenantId) q1.andWhere('tenant_id', tenantId);
  await q1.update({ status });
  return getRepairById(id, tenantId, branchId);
};

export const updateRepair = async (id, data, tenantId = null, branchId = null) => {
  const ticket = await getRepairById(id, tenantId, branchId);
  if (!ticket) throw ApiError.notFound('Repair ticket not found');

  const updateFields = {};
  if (data.customerName !== undefined) updateFields.customer_name = data.customerName;
  if (data.customerPhone !== undefined) updateFields.customer_phone = data.customerPhone;
  if (data.deviceModel !== undefined) updateFields.device_model = data.deviceModel;
  if (data.issueDescription !== undefined) updateFields.issue_description = data.issueDescription;
  if (data.estimatedCost !== undefined) updateFields.estimated_cost = data.estimatedCost;
  if (data.advancePaid !== undefined) updateFields.advance_paid = data.advancePaid;
  if (data.status !== undefined) updateFields.status = data.status;
  if (data.technicianName !== undefined) updateFields.technician_name = data.technicianName;
  if (data.partsUsed !== undefined) updateFields.parts_used = JSON.stringify(data.partsUsed);

  if (Object.keys(updateFields).length > 0) {
    const q = db('repair_tickets').where({ id });
    if (tenantId) q.andWhere('tenant_id', tenantId);
    await q.update(updateFields);
  }

  return getRepairById(id, tenantId, branchId);
};

export const deleteRepair = async (id, tenantId = null, branchId = null) => {
  const ticket = await getRepairById(id, tenantId, branchId);
  if (!ticket) throw ApiError.notFound('Repair ticket not found');

  const q2 = db('repair_tickets').where({ id });
  if (tenantId) q2.andWhere('tenant_id', tenantId);
  await q2.update({ is_deleted: true });
  return { ...ticket, isDeleted: true };
};

export const getRepairStats = async (tenantId = null, branchId = null) => {
  const countQuery = db('repair_tickets').where({ is_deleted: false });
  applyTenantScope(countQuery, tenantId);
  if (branchId) countQuery.where('branch_id', branchId);
  const totalRes = await countQuery.count({ total: '*' }).first();

  const activeQuery = db('repair_tickets').where({ is_deleted: false }).whereNotIn('status', ['DELIVERED', 'CANCELLED']);
  applyTenantScope(activeQuery, tenantId);
  if (branchId) activeQuery.where('branch_id', branchId);
  const activeRes = await activeQuery.count({ count: '*' }).first();

  const deliveredQuery = db('repair_tickets').where({ is_deleted: false, status: 'DELIVERED' });
  applyTenantScope(deliveredQuery, tenantId);
  if (branchId) deliveredQuery.where('branch_id', branchId);
  const deliveredRes = await deliveredQuery.count({ count: '*' }).first();

  const revQuery = db('repair_tickets').where({ is_deleted: false, status: 'DELIVERED' });
  applyTenantScope(revQuery, tenantId);
  if (branchId) revQuery.where('branch_id', branchId);
  const revRes = await revQuery.sum({ total: 'estimated_cost' }).sum({ collected: 'advance_paid' }).first();

  return {
    total: Number(totalRes?.total || 0),
    active: Number(activeRes?.count || 0),
    delivered: Number(deliveredRes?.count || 0),
    totalRevenue: Number(revRes?.total || 0),
    totalCollected: Number(revRes?.collected || 0),
  };
};
