import * as attendanceService from './attendance.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const checkIn = async (req, res, next) => {
  try {
    const { employeeId, location, notes } = req.body;
    const tenantId = req.user?.tenantId || null;
    const attendance = await attendanceService.checkIn(employeeId, location, notes, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CHECK_IN', module: 'attendance', entityId: attendance._id, entityType: 'Attendance', details: { employeeId, location }, req });
    return ApiResponse.created(res, attendance, 'Checked in successfully');
  } catch (error) { next(error); }
};

export const checkOut = async (req, res, next) => {
  try {
    const { employeeId, location } = req.body;
    const tenantId = req.user?.tenantId || null;
    const attendance = await attendanceService.checkOut(employeeId, location, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CHECK_OUT', module: 'attendance', entityId: attendance._id, entityType: 'Attendance', details: { employeeId, location }, req });
    return ApiResponse.success(res, attendance, 'Checked out successfully');
  } catch (error) { next(error); }
};

export const getAttendanceReport = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, employee: employeeId = '', branch = '', from = '', to = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const result = await attendanceService.getAttendanceReport(Number(page), Number(limit), employeeId, branch, from, to, tenantId);
    return ApiResponse.paginated(res, result.records, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getTodayStatus = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const tenantId = req.user?.tenantId || null;
    const attendance = await attendanceService.getTodayStatus(employeeId, tenantId);
    return ApiResponse.success(res, attendance);
  } catch (error) { next(error); }
};

export const updateAttendance = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const attendance = await attendanceService.updateAttendance(req.params.id, req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'attendance', entityId: attendance._id, entityType: 'Attendance', req });
    return ApiResponse.success(res, attendance, 'Attendance updated');
  } catch (error) { next(error); }
};
