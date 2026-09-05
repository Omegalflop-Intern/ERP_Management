import * as attendanceService from './attendance.service.js';
import { getMyEmployee } from '../employee/employee.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const checkIn = async (req, res, next) => {
  try {
    let { employeeId, location, notes } = req.body;
    const tenantId = req.user?.tenantId || null;
    const userRole = String(req.user?.roleName || req.user?.role?.name || req.user?.role || '').toUpperCase();
    const isManager = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SUPER_ADMIN';

    if (!isManager || !employeeId) {
      const myEmp = await getMyEmployee(req.user.userId || req.user.id, tenantId);
      if (!myEmp) {
        throw ApiError.badRequest('No linked employee profile found for your user account.');
      }
      employeeId = myEmp._id || myEmp.id;
    }

    const attendance = await attendanceService.checkIn(employeeId, location, notes, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CHECK_IN', module: 'attendance', entityId: attendance._id, entityType: 'Attendance', details: { employeeId, location }, req });
    return ApiResponse.created(res, attendance, 'Checked in successfully');
  } catch (error) { next(error); }
};

export const checkOut = async (req, res, next) => {
  try {
    let { employeeId, location } = req.body;
    const tenantId = req.user?.tenantId || null;
    const userRole = String(req.user?.roleName || req.user?.role?.name || req.user?.role || '').toUpperCase();
    const isManager = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SUPER_ADMIN';

    if (!isManager || !employeeId) {
      const myEmp = await getMyEmployee(req.user.userId || req.user.id, tenantId);
      if (!myEmp) {
        throw ApiError.badRequest('No linked employee profile found for your user account.');
      }
      employeeId = myEmp._id || myEmp.id;
    }

    const attendance = await attendanceService.checkOut(employeeId, location, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CHECK_OUT', module: 'attendance', entityId: attendance._id, entityType: 'Attendance', details: { employeeId, location }, req });
    return ApiResponse.success(res, attendance, 'Checked out successfully');
  } catch (error) { next(error); }
};

export const getMyTodayStatus = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const myEmp = await getMyEmployee(req.user.userId || req.user.id, tenantId);
    if (!myEmp) {
      return ApiResponse.success(res, { employee: null, attendance: null });
    }
    const attendance = await attendanceService.getTodayStatus(myEmp._id || myEmp.id, tenantId);
    return ApiResponse.success(res, { employee: myEmp, attendance });
  } catch (error) { next(error); }
};

export const getAttendanceReport = async (req, res, next) => {
  try {
    let { page = 1, limit = 20, employee: employeeId = '', from = '', to = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const userRole = String(req.user?.roleName || req.user?.role?.name || req.user?.role || '').toUpperCase();
    const isManager = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SUPER_ADMIN';

    if (!isManager && !employeeId) {
      const myEmp = await getMyEmployee(req.user.userId || req.user.id, tenantId);
      if (myEmp) {
        employeeId = myEmp._id || myEmp.id;
      }
    }

    const result = await attendanceService.getAttendanceReport(Number(page), Number(limit), employeeId, '', from, to, tenantId);
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

export const deleteAttendance = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await attendanceService.deleteAttendance(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'attendance', entityId: req.params.id, entityType: 'Attendance', req });
    return ApiResponse.success(res, null, 'Attendance record deleted successfully');
  } catch (error) { next(error); }
};
