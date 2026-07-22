import { Leave } from './leave.model.js';
import { Employee } from '../employee/employee.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

export const getAllLeaves = async (page = 1, limit = 20, search = '', status = '', employeeId = '') => {
  const query = {};
  if (status) query.status = status;
  if (employeeId) query.employee = employeeId;

  if (search) {
    const employees = await Employee.find({
      isDeleted: false,
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    query.employee = { $in: employees.map((e) => e._id) };
  }

  const total = await Leave.countDocuments(query);
  const leaves = await paginate(Leave.find(query), page, limit)
    .populate('employee', 'name employeeId department designation')
    .sort({ createdAt: -1 });

  return { leaves, pagination: getPagination(total, page, limit) };
};

export const createLeave = async (data) => {
  const employee = await Employee.findOne({ _id: data.employee, isDeleted: false });
  if (!employee) throw ApiError.notFound('Employee not found');

  const overlapping = await Leave.findOne({
    employee: data.employee,
    status: { $ne: 'rejected' },
    $or: [
      { fromDate: { $lte: new Date(data.toDate) }, toDate: { $gte: new Date(data.fromDate) } },
    ],
  });
  if (overlapping) throw ApiError.badRequest('Leave already exists for this period');

  return Leave.create(data);
};

export const updateLeaveStatus = async (id, status, approvedBy, rejectionReason) => {
  const leave = await Leave.findById(id);
  if (!leave) throw ApiError.notFound('Leave not found');
  if (leave.status !== 'pending') throw ApiError.badRequest('Only pending leaves can be updated');

  leave.status = status;
  if (status === 'approved') leave.approvedBy = approvedBy;
  if (status === 'rejected') leave.rejectionReason = rejectionReason;
  await leave.save();

  return leave;
};

export const getEmployeeLeaves = async (employeeId, year) => {
  const query = { employee: employeeId };
  if (year) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    query.fromDate = { $gte: start, $lte: end };
  }

  const leaves = await Leave.find(query).sort({ fromDate: -1 });

  const summary = {
    total: leaves.length,
    approved: leaves.filter((l) => l.status === 'approved').length,
    pending: leaves.filter((l) => l.status === 'pending').length,
    rejected: leaves.filter((l) => l.status === 'rejected').length,
    totalDays: leaves.filter((l) => l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
  };

  return { leaves, summary };
};

export const deleteLeave = async (id) => {
  const leave = await Leave.findById(id);
  if (!leave) throw ApiError.notFound('Leave not found');
  if (leave.status === 'approved') throw ApiError.badRequest('Cannot delete approved leave');
  await Leave.findByIdAndDelete(id);
  return leave;
};
