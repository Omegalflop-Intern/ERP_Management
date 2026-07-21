import * as roleService from './role.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllRoles = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await roleService.getAllRoles(Number(page), Number(limit));
    return ApiResponse.paginated(res, result.roles, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getAllRolesFlat = async (req, res, next) => {
  try {
    const roles = await roleService.getAllRolesFlat();
    return ApiResponse.success(res, roles);
  } catch (error) { next(error); }
};

export const getRoleById = async (req, res, next) => {
  try {
    const role = await roleService.getRoleById(req.params.id);
    return ApiResponse.success(res, role);
  } catch (error) { next(error); }
};

export const createRole = async (req, res, next) => {
  try {
    const role = await roleService.createRole(req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'role', entityId: role._id, entityType: 'Role', details: { name: role.name, permissions: role.permissions?.length }, req });
    return ApiResponse.created(res, role, 'Role created');
  } catch (error) { next(error); }
};

export const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.updateRole(req.params.id, req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'role', entityId: role._id, entityType: 'Role', details: { name: role.name }, req });
    return ApiResponse.success(res, role, 'Role updated');
  } catch (error) { next(error); }
};

export const deleteRole = async (req, res, next) => {
  try {
    await roleService.deleteRole(req.params.id);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'role', entityId: req.params.id, entityType: 'Role', req });
    return ApiResponse.success(res, null, 'Role deleted');
  } catch (error) { next(error); }
};

export const getPermissions = async (req, res, next) => {
  try {
    const { ALL_PERMISSIONS } = await import('./role.model.js');
    return ApiResponse.success(res, ALL_PERMISSIONS);
  } catch (error) { next(error); }
};
