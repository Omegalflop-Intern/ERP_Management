import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';
import { createAutomatedExpenseJournal } from '../accounting/accounting.service.js';

function parseJSON(str) {
  if (typeof str === 'string') {
    try { return JSON.parse(str); } catch { return {}; }
  }
  return str || {};
}

export function formatPayroll(row, employeeRow = null, paidByRow = null) {
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
      salary: Number(employeeRow.salary || 0),
    } : String(row.employee_id),
    month: Number(row.month),
    year: Number(row.year),
    basicSalary: Number(row.basic_salary || 0),
    allowances: parseJSON(row.allowances),
    deductions: parseJSON(row.deductions),
    totalAllowances: Number(row.total_allowances || 0),
    totalDeductions: Number(row.total_deductions || 0),
    netSalary: Number(row.net_salary || 0),
    status: row.status || 'pending',
    paidDate: row.paid_date || null,
    paidBy: paidByRow ? {
      _id: String(paidByRow.id),
      id: paidByRow.id,
      username: paidByRow.username,
    } : (row.paid_by ? String(row.paid_by) : null),
    notes: row.notes || '',
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId, tablePrefix = 'payrolls') {
  if (tenantId) {
    query.where(`${tablePrefix}.tenant_id`, tenantId);
  }
}

export const getAllPayroll = async (page = 1, limit = 20, branch = '', month = '', year = '', status = '', tenantId = null, branchId = null) => {
  const countQuery = db('payrolls').where('payrolls.is_deleted', false);
  applyTenantScope(countQuery, tenantId, 'payrolls');
  if (status) countQuery.where('payrolls.status', status);
  if (month) countQuery.where('payrolls.month', Number(month));
  if (year) countQuery.where('payrolls.year', Number(year));
  if (branchId) countQuery.where('payrolls.branch_id', branchId);

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('payrolls')
    .leftJoin('employees', 'payrolls.employee_id', 'employees.id')
    .leftJoin('users', 'payrolls.paid_by', 'users.id')
    .where('payrolls.is_deleted', false)
    .select(
      'payrolls.*',
      'employees.id as emp_id', 'employees.name as emp_name', 'employees.employee_id as emp_code',
      'employees.department as emp_dept', 'employees.designation as emp_desig', 'employees.salary as emp_salary',
      'users.id as u_id', 'users.username as u_username'
    );
  applyTenantScope(dataQuery, tenantId, 'payrolls');
  if (status) dataQuery.where('payrolls.status', status);
  if (month) dataQuery.where('payrolls.month', Number(month));
  if (year) dataQuery.where('payrolls.year', Number(year));
  if (branchId) dataQuery.where('payrolls.branch_id', branchId);

  const rows = await dataQuery.orderBy('payrolls.created_at', 'desc').limit(limit).offset(offset);

  const payrolls = rows.map((row) => {
    const eRow = row.emp_id ? { id: row.emp_id, name: row.emp_name, employee_id: row.emp_code, department: row.emp_dept, designation: row.emp_desig, salary: row.emp_salary } : null;
    const uRow = row.u_id ? { id: row.u_id, username: row.u_username } : null;
    return formatPayroll(row, eRow, uRow);
  });

  return { payrolls, pagination: getPagination(total, page, limit) };
};

export const generatePayroll = async (month, year, employeeIds = [], tenantId = null, branchId = null, customAllowances = null, customDeductions = null) => {
  let empQuery = db('employees').where('employees.is_deleted', false).where('employees.is_active', true);
  if (tenantId) empQuery.where((b) => b.where('employees.tenant_id', tenantId).orWhereNull('employees.tenant_id'));
  if (branchId) empQuery.where('employees.branch_id', branchId);

  if (Array.isArray(employeeIds) && employeeIds.length > 0) {
    empQuery.whereIn('employees.id', employeeIds);
  }

  const employees = await empQuery;
  const results = [];
  const skipped = [];

  for (const employee of employees) {
    const empId = employee.id;
    const existingQuery = db('payrolls').where({ employee_id: empId, month: Number(month), year: Number(year), is_deleted: false });
    if (tenantId) existingQuery.where('tenant_id', tenantId);
    const existing = await existingQuery.first();

    if (existing) {
      skipped.push({ employeeId: empId, name: employee.name, reason: 'Already generated' });
      continue;
    }

    const basicSalary = Number(employee.salary || 0);
    const allowances = customAllowances && typeof customAllowances === 'object' && Object.keys(customAllowances).length > 0
      ? customAllowances
      : { housing: Math.round(basicSalary * 0.1), transport: 0, medical: 1000, food: 0, other: 0 };
    const deductions = customDeductions && typeof customDeductions === 'object' && Object.keys(customDeductions).length > 0
      ? customDeductions
      : { advance: 0, loan: 0, tax: Math.round(basicSalary * 0.02), absentDeduction: 0, other: 0 };
    const totalAllowances = Object.values(allowances).reduce((a, b) => a + Number(b || 0), 0);
    const totalDeductions = Object.values(deductions).reduce((a, b) => a + Number(b || 0), 0);
    const netSalary = Math.max(0, basicSalary + totalAllowances - totalDeductions);

    const [insertedId] = await db('payrolls').insert({
      tenant_id: tenantId || employee.tenant_id || null,
      branch_id: branchId || employee.branch_id || null,
      employee_id: empId,
      month: Number(month),
      year: Number(year),
      basic_salary: basicSalary,
      allowances: JSON.stringify(allowances),
      deductions: JSON.stringify(deductions),
      total_allowances: totalAllowances,
      total_deductions: totalDeductions,
      net_salary: netSalary,
      status: 'pending',
      is_deleted: false,
    });

    const prq = db('payrolls').where({ id: insertedId });
    if (tenantId) prq.andWhere('tenant_id', tenantId);
    const row = await prq.first();
    results.push(formatPayroll(row, employee));
  }

  return { processed: results, skipped };
};

export const markAsPaid = async (id, paidBy = null, tenantId = null, branchId = null) => {
  const query = db('payrolls').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId, 'payrolls');
  if (branchId) query.where('payrolls.branch_id', branchId);
  const payroll = await query.first();
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  if (payroll.status === 'paid') throw ApiError.badRequest('Already paid');

  const mq = db('payrolls').where({ id });
  if (tenantId) mq.andWhere('tenant_id', tenantId);
  if (branchId) mq.andWhere('branch_id', branchId);
  await mq.update({
    status: 'paid',
    paid_date: new Date(),
    paid_by: paidBy || null,
  });

  const urq = db('payrolls').where({ id });
  if (tenantId) urq.andWhere('tenant_id', tenantId);
  if (branchId) urq.andWhere('branch_id', branchId);
  const updated = await urq.first();
  const empQuery = db('employees').where({ id: payroll.employee_id, is_deleted: false });
  applyTenantScope(empQuery, tenantId, 'employees');
  const employee = await empQuery.first();

  // Bug #37 fixed: Create an accounting journal entry for the payroll payment
  // so salary expenses are reflected in the general ledger.
  try {
    await createAutomatedExpenseJournal({
      tenantId,
      branchId,
      expenseCategory: 'Staff Salaries & Payroll',
      amount: Number(updated.net_salary || updated.net_pay || 0),
      paymentMethod: 'CASH',
      notes: `Payroll payment — ${employee?.full_name || employee?.name || `Employee #${payroll.employee_id}`} (${updated.month}/${updated.year})`,
      createdBy: paidBy || 'system',
    });
  } catch (err) {
    console.error('[Payroll] Failed to create accounting journal for payroll payment:', err.message);
  }

  return formatPayroll(updated, employee);
};

export const getPayrollSummary = async (month, year, tenantId = null, branchId = null) => {
  const query = db('payrolls').where({ month: Number(month), year: Number(year), is_deleted: false });
  applyTenantScope(query, tenantId, 'payrolls');
  if (branchId) query.where('payrolls.branch_id', branchId);

  const rows = await query;
  const records = rows.map(r => formatPayroll(r));

  const totalPaid = records.filter((r) => r.status === 'paid').reduce((s, r) => s + r.netSalary, 0);
  const totalPending = records.filter((r) => r.status === 'pending').reduce((s, r) => s + r.netSalary, 0);
  const totalDeductions = records.reduce((s, r) => s + r.totalDeductions, 0);
  const totalAllowances = records.reduce((s, r) => s + r.totalAllowances, 0);

  return {
    totalEmployees: records.length,
    paid: records.filter((r) => r.status === 'paid').length,
    pending: records.filter((r) => r.status === 'pending').length,
    totalPaid,
    totalPending,
    totalDeductions,
    totalAllowances,
    grandTotal: totalPaid + totalPending,
  };
};

export const getPayslip = async (id, tenantId = null, branchId = null) => {
  const query = db('payrolls').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId, 'payrolls');
  if (branchId) query.where('payrolls.branch_id', branchId);
  const row = await query.first();
  if (!row) throw ApiError.notFound('Payroll record not found');
  const empQuery = db('employees').where({ id: row.employee_id, is_deleted: false });
  applyTenantScope(empQuery, tenantId, 'employees');
  const employee = await empQuery.first();
  return formatPayroll(row, employee);
};

export const deletePayroll = async (id, tenantId = null, branchId = null) => {
  const query = db('payrolls').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId, 'payrolls');
  if (branchId) query.where('payrolls.branch_id', branchId);
  const payroll = await query.first();
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  if (payroll.status === 'paid') throw ApiError.badRequest('Cannot delete paid payroll');

  const dq = db('payrolls').where({ id });
  if (tenantId) dq.andWhere('tenant_id', tenantId);
  if (branchId) dq.andWhere('branch_id', branchId);
  await dq.update({ is_deleted: true });
  return { ...formatPayroll(payroll), isDeleted: true };
};
