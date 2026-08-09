import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

export function formatAttendance(row, employeeRow = null) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    employee: employeeRow ? {
      _id: String(employeeRow.id),
      id: employeeRow.id,
      name: employeeRow.name,
      employeeId: employeeRow.employee_id,
      department: employeeRow.department || '',
      designation: employeeRow.designation || '',
    } : String(row.employee_id),
    date: row.date,
    checkIn: row.check_in || null,
    checkOut: row.check_out || null,
    location: (row.lat || row.lng) ? { lat: Number(row.lat || 0), lng: Number(row.lng || 0) } : null,
    status: row.status || 'present',
    notes: row.notes || '',
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId, tablePrefix = 'attendances') {
  if (tenantId) {
    query.where(`${tablePrefix}.tenant_id`, tenantId);
  }
}

export const checkIn = async (employeeId, location, notes, tenantId = null) => {
  const empQuery = db('employees').where({ id: employeeId, is_deleted: false });
  if (tenantId) empQuery.where('tenant_id', tenantId);
  const employee = await empQuery.first();
  if (!employee) throw ApiError.notFound('Employee not found');

  const todayStr = new Date().toISOString().slice(0, 10);
  const existQuery = db('attendances').where({ employee_id: employeeId, date: todayStr, is_deleted: false });
  if (tenantId) existQuery.where('tenant_id', tenantId);
  const existing = await existQuery.first();
  if (existing) throw ApiError.badRequest('Already checked in today');

  const now = new Date();
  const isLate = now.getHours() >= 10;

  const [insertedId] = await db('attendances').insert({
    tenant_id: tenantId || employee.tenant_id || null,
    employee_id: employeeId,
    date: todayStr,
    check_in: now,
    lat: location?.lat || null,
    lng: location?.lng || null,
    status: isLate ? 'late' : 'present',
    notes: notes || null,
    is_deleted: false,
  });

  const rq = db('attendances').where({ id: insertedId });
  if (tenantId) rq.andWhere('tenant_id', tenantId);
  const row = await rq.first();
  return formatAttendance(row, employee);
};

export const checkOut = async (employeeId, location, tenantId = null) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const attQuery = db('attendances').where({ employee_id: employeeId, date: todayStr, is_deleted: false });
  if (tenantId) attQuery.where('tenant_id', tenantId);
  const attendance = await attQuery.first();
  if (!attendance) throw ApiError.badRequest('No check-in found for today');
  if (attendance.check_out) throw ApiError.badRequest('Already checked out today');

  const coQ = db('attendances').where({ id: attendance.id });
  if (tenantId) coQ.andWhere('tenant_id', tenantId);
  await coQ.update({
    check_out: new Date(),
    lat: location?.lat || attendance.lat,
    lng: location?.lng || attendance.lng,
  });

  const coRQ = db('attendances').where({ id: attendance.id });
  if (tenantId) coRQ.andWhere('tenant_id', tenantId);
  const row = await coRQ.first();
  const empQuery = db('employees').where({ id: employeeId, is_deleted: false });
  if (tenantId) empQuery.where('tenant_id', tenantId);
  const employee = await empQuery.first();
  return formatAttendance(row, employee);
};

export const getAttendanceReport = async (page = 1, limit = 20, employeeId = '', branch = '', from = '', to = '', tenantId = null) => {
  const countQuery = db('attendances').where('attendances.is_deleted', false);
  applyTenantScope(countQuery, tenantId, 'attendances');
  if (employeeId) countQuery.where('attendances.employee_id', employeeId);

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('attendances')
    .leftJoin('employees', 'attendances.employee_id', 'employees.id')
    .where('attendances.is_deleted', false)
    .select(
      'attendances.*',
      'employees.id as emp_id', 'employees.name as emp_name', 'employees.employee_id as emp_code',
      'employees.department as emp_dept', 'employees.designation as emp_desig'
    );
  applyTenantScope(dataQuery, tenantId, 'attendances');
  if (employeeId) dataQuery.where('attendances.employee_id', employeeId);

  const rows = await dataQuery.orderBy('attendances.date', 'desc').limit(limit).offset(offset);

  const records = rows.map((row) => {
    const eRow = row.emp_id ? { id: row.emp_id, name: row.emp_name, employee_id: row.emp_code, department: row.emp_dept, designation: row.emp_desig } : null;
    return formatAttendance(row, eRow);
  });

  return { records, pagination: getPagination(total, page, limit) };
};

export const getTodayStatus = async (employeeId, tenantId = null) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const query = db('attendances').where({ employee_id: employeeId, date: todayStr, is_deleted: false });
  if (tenantId) query.where('tenant_id', tenantId);
  const row = await query.first();
  return formatAttendance(row);
};

export const updateAttendance = async (id, data, tenantId = null) => {
  const query = db('attendances').where({ id, is_deleted: false });
  if (tenantId) query.where('tenant_id', tenantId);
  const attendance = await query.first();
  if (!attendance) throw ApiError.notFound('Attendance record not found');

  const updateFields = {};
  if (data.status !== undefined) updateFields.status = data.status;
  if (data.notes !== undefined) updateFields.notes = data.notes;

  if (Object.keys(updateFields).length > 0) {
    const q = db('attendances').where({ id });
    if (tenantId) q.andWhere('tenant_id', tenantId);
    await q.update(updateFields);
  }

  const uq = db('attendances').where({ id });
  if (tenantId) uq.andWhere('tenant_id', tenantId);
  const updated = await uq.first();
  return formatAttendance(updated);
};
