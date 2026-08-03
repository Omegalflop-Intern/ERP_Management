import { Employee } from './employee.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';
import { withTenant } from '../../utils/tenant.js';

export const getAllEmployees = async (page = 1, limit = 20, search = '', branch = '', tenantId = null) => {
  const query = withTenant({ isDeleted: false }, tenantId);
  if (branch) query.branch = branch;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
      { designation: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Employee.countDocuments(query);
  const employees = await paginate(Employee.find(query), page, limit).sort({ createdAt: -1 });

  return { employees, pagination: getPagination(total, page, limit) };
};

export const getEmployeeById = async (id, tenantId = null) => {
  const employee = await Employee.findOne(withTenant({ _id: id, isDeleted: false }, tenantId)).populate('user', 'username email role');
  if (!employee) throw ApiError.notFound('Employee not found');
  return employee;
};

export const createEmployee = async (data, tenantId = null) => {
  const existingId = await Employee.findOne(withTenant({ employeeId: data.employeeId, isDeleted: false }, tenantId));
  if (existingId) throw ApiError.conflict('Employee ID already exists');

  const existingPhone = await Employee.findOne(withTenant({ phone: data.phone, isDeleted: false }, tenantId));
  if (existingPhone) throw ApiError.conflict('Employee with this phone already exists');

  return Employee.create({ ...data, tenantId: tenantId || null });
};

export const updateEmployee = async (id, data, tenantId = null) => {
  const employee = await Employee.findOne(withTenant({ _id: id, isDeleted: false }, tenantId));
  if (!employee) throw ApiError.notFound('Employee not found');

  if (data.employeeId && data.employeeId !== employee.employeeId) {
    const existing = await Employee.findOne(withTenant({ employeeId: data.employeeId, isDeleted: false, _id: { $ne: id } }, tenantId));
    if (existing) throw ApiError.conflict('Employee ID already exists');
  }

  if (data.phone && data.phone !== employee.phone) {
    const existing = await Employee.findOne(withTenant({ phone: data.phone, isDeleted: false, _id: { $ne: id } }, tenantId));
    if (existing) throw ApiError.conflict('Employee with this phone already exists');
  }

  Object.assign(employee, data);
  await employee.save();
  return employee;
};

export const deleteEmployee = async (id, tenantId = null) => {
  const employee = await Employee.findOne(withTenant({ _id: id, isDeleted: false }, tenantId));
  if (!employee) throw ApiError.notFound('Employee not found');
  employee.isDeleted = true;
  await employee.save();
  return employee;
};

export const getEmployeeStats = async (tenantId = null) => {
  const baseQuery = withTenant({ isDeleted: false }, tenantId);
  const total = await Employee.countDocuments(baseQuery);
  const active = await Employee.countDocuments({ ...baseQuery, isActive: true });
  const inactive = total - active;

  const departments = await Employee.aggregate([
    { $match: baseQuery },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const avgSalary = await Employee.aggregate([
    { $match: baseQuery },
    { $group: { _id: null, avg: { $avg: '$salary' }, total: { $sum: '$salary' } } },
  ]);

  return {
    total,
    active,
    inactive,
    departments,
    avgSalary: avgSalary[0]?.avg || 0,
    totalSalaryExpense: avgSalary[0]?.total || 0,
  };
};
