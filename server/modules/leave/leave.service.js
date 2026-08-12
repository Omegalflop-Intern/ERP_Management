import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

export function formatLeave(row, employeeRow = null) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    branchId: row.branch_id ? String(row.branch_id) : null,
    employee: employeeRow ? {
      _id: String(employeeRow.id),
      id: employeeRow.id,
      name: employeeRow.name,
      employeeId: employeeRow.employee_id,
      department: employeeRow.department || '',
      designation: employeeRow.designation || '',
    } : String(row.employee_id),
    type: row.type,
    fromDate: row.from_date,
    toDate: row.to_date,
    days: Number(row.days || 1),
    reason: row.reason,
    status: row.status || 'pending',
    approvedBy: row.approved_by ? String(row.approved_by) : null,
    rejectionReason: row.rejection_reason || '',
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId, tablePrefix = 'leaves') {
  if (tenantId) {
    query.where(`${tablePrefix}.tenant_id`, tenantId);
  }
}

export const getAllLeaves = async (page = 1, limit = 20, search = '', status = '', employeeId = '', currentUser = null, tenantId = null, branchId = null) => {
  const countQuery = db('leaves').where('leaves.is_deleted', false);
  applyTenantScope(countQuery, tenantId, 'leaves');
  if (status) countQuery.where('leaves.status', status);
  if (employeeId) countQuery.where('leaves.employee_id', employeeId);
  if (branchId) countQuery.where('leaves.branch_id', branchId);

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('leaves')
    .leftJoin('employees', 'leaves.employee_id', 'employees.id')
    .where('leaves.is_deleted', false)
    .select(
      'leaves.*',
      'employees.id as emp_id', 'employees.name as emp_name', 'employees.employee_id as emp_code',
      'employees.department as emp_dept', 'employees.designation as emp_desig'
    );
  applyTenantScope(dataQuery, tenantId, 'leaves');
  if (status) dataQuery.where('leaves.status', status);
  if (employeeId) dataQuery.where('leaves.employee_id', employeeId);
  if (branchId) dataQuery.where('leaves.branch_id', branchId);

  const rows = await dataQuery.orderBy('leaves.created_at', 'desc').limit(limit).offset(offset);

  const leaves = rows.map((row) => {
    const eRow = row.emp_id ? { id: row.emp_id, name: row.emp_name, employee_id: row.emp_code, department: row.emp_dept, designation: row.emp_desig } : null;
    return formatLeave(row, eRow);
  });

  return { leaves, pagination: getPagination(total, page, limit) };
};

export const createLeave = async (data, currentUser = null, tenantId = null) => {
  const empId = data.employee || data.employeeId;
  const empQuery = db('employees').where({ id: empId, is_deleted: false });
  if (tenantId) empQuery.where('tenant_id', tenantId);
  const employee = await empQuery.first();
  if (!employee) throw ApiError.notFound('Employee not found');

  const from = new Date(data.fromDate);
  const to = new Date(data.toDate);
  const diffTime = Math.abs(to - from);
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const [insertedId] = await db('leaves').insert({
    tenant_id: tenantId || data.tenantId || null,
    employee_id: empId,
    type: data.type,
    from_date: from,
    to_date: to,
    days: data.days || days,
    reason: data.reason,
    status: 'pending',
    is_deleted: false,
  });

  const lrq = db('leaves').where({ id: insertedId });
  if (tenantId) lrq.andWhere('tenant_id', tenantId);
  const row = await lrq.first();
  return formatLeave(row, employee);
};

export const updateLeaveStatus = async (id, status, approvedBy, rejectionReason, tenantId = null) => {
  const leaveQuery = db('leaves').where({ id, is_deleted: false });
  applyTenantScope(leaveQuery, tenantId, 'leaves');
  const leave = await leaveQuery.first();
  if (!leave) throw ApiError.notFound('Leave not found');
  if (leave.status !== 'pending') throw ApiError.badRequest('Only pending leaves can be updated');

  const uq = db('leaves').where({ id });
  if (tenantId) uq.andWhere('tenant_id', tenantId);
  await uq.update({
    status,
    approved_by: approvedBy || null,
    rejection_reason: rejectionReason || null,
  });

  const rq = db('leaves').where({ id });
  if (tenantId) rq.andWhere('tenant_id', tenantId);
  const row = await rq.first();
  const empQuery = db('employees').where({ id: leave.employee_id, is_deleted: false });
  if (tenantId) empQuery.where('tenant_id', tenantId);
  const employee = await empQuery.first();
  return formatLeave(row, employee);
};

export const getEmployeeLeaves = async (employeeId, year, tenantId = null) => {
  const query = db('leaves').where({ employee_id: employeeId, is_deleted: false });
  applyTenantScope(query, tenantId, 'leaves');
  const rows = await query.orderBy('from_date', 'desc');

  const leaves = rows.map(r => formatLeave(r));
  const summary = {
    total: leaves.length,
    approved: leaves.filter(l => l.status === 'approved').length,
    pending: leaves.filter(l => l.status === 'pending').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    totalDays: leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
  };

  return { leaves, summary };
};

export const deleteLeave = async (id, tenantId = null) => {
  const query = db('leaves').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId, 'leaves');
  const leave = await query.first();
  if (!leave) throw ApiError.notFound('Leave not found');
  if (leave.status === 'approved') throw ApiError.badRequest('Cannot delete approved leave');

  const dq = db('leaves').where({ id });
  if (tenantId) dq.andWhere('tenant_id', tenantId);
  await dq.update({ is_deleted: true });
  return { ...formatLeave(leave), isDeleted: true };
};
