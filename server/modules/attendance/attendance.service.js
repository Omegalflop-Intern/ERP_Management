import { Attendance } from './attendance.model.js';
import { Employee } from '../employee/employee.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

export const checkIn = async (employeeId, location, notes) => {
  const employee = await Employee.findOne({ _id: employeeId, isDeleted: false });
  if (!employee) throw ApiError.notFound('Employee not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await Attendance.findOne({ employee: employeeId, date: today });
  if (existing) throw ApiError.badRequest('Already checked in today');

  const now = new Date();
  const isLate = now.getHours() >= 10;

  const attendance = await Attendance.create({
    employee: employeeId,
    date: today,
    checkIn: now,
    location,
    status: isLate ? 'late' : 'present',
    notes,
  });

  return attendance;
};

export const checkOut = async (employeeId, location) => {
  const employee = await Employee.findOne({ _id: employeeId, isDeleted: false });
  if (!employee) throw ApiError.notFound('Employee not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({ employee: employeeId, date: today });
  if (!attendance) throw ApiError.badRequest('No check-in found for today');
  if (attendance.checkOut) throw ApiError.badRequest('Already checked out today');

  attendance.checkOut = new Date();
  if (location) attendance.location = location;
  await attendance.save();

  return attendance;
};

export const getAttendanceReport = async (page = 1, limit = 20, employeeId = '', branch = '', from = '', to = '') => {
  const query = {};
  if (employeeId) query.employee = employeeId;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.date.$lte = toDate;
    }
  }

  if (branch) {
    const branchEmployees = await Employee.find({ branch, isDeleted: false }).select('_id');
    query.employee = { $in: branchEmployees.map((e) => e._id) };
  }

  const total = await Attendance.countDocuments(query);
  const records = await paginate(
    Attendance.find(query).populate('employee', 'name employeeId department designation'),
    page,
    limit
  ).sort({ date: -1 });

  return { records, pagination: getPagination(total, page, limit) };
};

export const getTodayStatus = async (employeeId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({ employee: employeeId, date: today });
  return attendance;
};

export const updateAttendance = async (id, data) => {
  const attendance = await Attendance.findById(id);
  if (!attendance) throw ApiError.notFound('Attendance record not found');
  Object.assign(attendance, data);
  await attendance.save();
  return attendance;
};
