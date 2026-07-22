import { Payroll } from './payroll.model.js';
import { Employee } from '../employee/employee.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

export const getAllPayroll = async (page = 1, limit = 20, branch = '', month = '', year = '', status = '') => {
  const query = {};
  if (status) query.status = status;
  if (month) query.month = Number(month);
  if (year) query.year = Number(year);

  if (branch) {
    const branchEmployees = await Employee.find({ branch, isDeleted: false }).select('_id');
    query.employee = { $in: branchEmployees.map((e) => e._id) };
  }

  const total = await Payroll.countDocuments(query);
  const records = await paginate(Payroll.find(query), page, limit)
    .populate('employee', 'name employeeId department designation salary')
    .sort({ year: -1, month: -1 });

  return { records, pagination: getPagination(total, page, limit) };
};

export const processPayroll = async (employeeIds, month, year, allowances = {}, deductions = {}) => {
  const results = [];
  const skipped = [];

  for (const empId of employeeIds) {
    const existing = await Payroll.findOne({ employee: empId, month, year });
    if (existing) {
      skipped.push(empId);
      continue;
    }

    const employee = await Employee.findOne({ _id: empId, isDeleted: false });
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
    });

    results.push(payroll);
  }

  return { processed: results, skipped };
};

export const markAsPaid = async (id, paidBy) => {
  const payroll = await Payroll.findById(id);
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  if (payroll.status === 'paid') throw ApiError.badRequest('Already paid');

  payroll.status = 'paid';
  payroll.paidDate = new Date();
  payroll.paidBy = paidBy;
  await payroll.save();

  return payroll;
};

export const getPayrollSummary = async (month, year) => {
  const query = { month, year };
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

export const getPayslip = async (id) => {
  const payroll = await Payroll.findById(id)
    .populate('employee', 'name employeeId department designation phone address joiningDate')
    .populate('paidBy', 'username');
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  return payroll;
};

export const deletePayroll = async (id) => {
  const payroll = await Payroll.findById(id);
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  if (payroll.status === 'paid') throw ApiError.badRequest('Cannot delete paid payroll');
  await Payroll.findByIdAndDelete(id);
  return payroll;
};
