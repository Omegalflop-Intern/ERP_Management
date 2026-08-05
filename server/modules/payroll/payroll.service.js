import { Payroll } from './payroll.model.js';
import { Employee } from '../employee/employee.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';
import { withTenant } from '../../utils/tenant.js';
import { createAutomatedPayrollJournal } from '../accounting/accounting.service.js';

export const getAllPayroll = async (page = 1, limit = 20, branch = '', month = '', year = '', status = '', tenantId = null) => {
  const query = withTenant({}, tenantId);
  if (status) query.status = status;
  if (month) query.month = Number(month);
  if (year) query.year = Number(year);

  if (branch) {
    const empQuery = { branch, isDeleted: false };
    if (tenantId) empQuery.tenantId = tenantId;
    const branchEmployees = await Employee.find(empQuery).select('_id');
    query.employee = { $in: branchEmployees.map((e) => e._id) };
  }

  const total = await Payroll.countDocuments(query);
  const records = await paginate(Payroll.find(query), page, limit)
    .populate('employee', 'name employeeId department designation salary')
    .sort({ year: -1, month: -1 });

  return { records, pagination: getPagination(total, page, limit) };
};

export const processPayroll = async (employeeIds, month, year, allowances = {}, deductions = {}, tenantId = null) => {
  const results = [];
  const skipped = [];

  for (const empId of employeeIds) {
    const existing = await Payroll.findOne(withTenant({ employee: empId, month, year }, tenantId));
    if (existing) {
      skipped.push(empId);
      continue;
    }

    const employee = await Employee.findOne(withTenant({ _id: empId, isDeleted: false }, tenantId));
    if (!employee) {
      skipped.push(empId);
      continue;
    }

    const totalAllowances = Object.values(allowances).reduce((s, v) => s + (v || 0), 0);
    const totalDeductions = Object.values(deductions).reduce((s, v) => s + (v || 0), 0);
    const netSalary = employee.salary + totalAllowances - totalDeductions;

    const payroll = await Payroll.create({
      employee: empId,
      month,
      year,
      basicSalary: employee.salary,
      allowances,
      deductions,
      totalAllowances,
      totalDeductions,
      netSalary: Math.max(0, netSalary),
      tenantId: tenantId || null,
    });

    await createAutomatedPayrollJournal(payroll, tenantId).catch(err => console.error('Payroll journal failed:', err));

    results.push(payroll);
  }

  return { processed: results, skipped };
};

export const markAsPaid = async (id, paidBy, tenantId = null) => {
  const payroll = await Payroll.findOne(withTenant({ _id: id, isDeleted: false }, tenantId));
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  if (payroll.status === 'paid') throw ApiError.badRequest('Already paid');

  payroll.status = 'paid';
  payroll.paidDate = new Date();
  payroll.paidBy = paidBy;
  await payroll.save();

  return payroll;
};

export const getPayrollSummary = async (month, year, tenantId = null) => {
  const query = withTenant({ month, year }, tenantId);
  const records = await Payroll.find(query).populate('employee', 'name employeeId department');

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

export const getPayslip = async (id, tenantId = null) => {
  const payroll = await Payroll.findOne(withTenant({ _id: id, isDeleted: false }, tenantId))
    .populate('employee', 'name employeeId department designation phone address joiningDate')
    .populate('paidBy', 'username');
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  return payroll;
};

export const deletePayroll = async (id, tenantId = null) => {
  const payroll = await Payroll.findOne(withTenant({ _id: id, isDeleted: false }, tenantId));
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  if (payroll.status === 'paid') throw ApiError.badRequest('Cannot delete paid payroll');
  await Payroll.findOneAndDelete(withTenant({ _id: id, isDeleted: false }, tenantId));
  return payroll;
};
