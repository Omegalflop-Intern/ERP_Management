import * as employeeService from './employee.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', branch = '' } = req.query;
    const result = await employeeService.getAllEmployees(Number(page), Number(limit), search, branch);
    return ApiResponse.paginated(res, result.employees, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    return ApiResponse.success(res, employee);
  } catch (error) { next(error); }
};

export const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'employee', entityId: employee._id, entityType: 'Employee', details: { name: employee.fullName || employee.name }, req });
    return ApiResponse.created(res, employee, 'Employee created');
  } catch (error) { next(error); }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'employee', entityId: employee._id, entityType: 'Employee', details: { name: employee.fullName || employee.name }, req });
    return ApiResponse.success(res, employee, 'Employee updated');
  } catch (error) { next(error); }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    await employeeService.deleteEmployee(req.params.id);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'employee', entityId: req.params.id, entityType: 'Employee', req });
    return ApiResponse.success(res, null, 'Employee deleted');
  } catch (error) { next(error); }
};

export const getEmployeeStats = async (req, res, next) => {
  try {
    const stats = await employeeService.getEmployeeStats();
    return ApiResponse.success(res, stats);
  } catch (error) { next(error); }
};
