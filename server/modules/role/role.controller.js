import * as roleService from './role.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllRoles = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const tenantId = req.user?.tenantId || null;
    const result = await roleService.getAllRoles(Number(page), Number(limit), tenantId);
    return ApiResponse.paginated(res, result.roles, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getAllRolesFlat = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const roles = await roleService.getAllRolesFlat(tenantId);
    return ApiResponse.success(res, roles);
  } catch (error) { next(error); }
};

export const getRoleById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const role = await roleService.getRoleById(req.params.id, tenantId);
    return ApiResponse.success(res, role);
  } catch (error) { next(error); }
};

export const createRole = async (req, res, next) => {
  try {
    const roleData = {
      ...req.body,
      tenantId: req.user?.tenantId || null,
    };
    const role = await roleService.createRole(roleData);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'role', entityId: role._id, entityType: 'Role', details: { name: role.name, permissions: role.permissions?.length }, req });
    return ApiResponse.created(res, role, 'Role created');
  } catch (error) { next(error); }
};

export const updateRole = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const role = await roleService.updateRole(req.params.id, req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'role', entityId: role._id, entityType: 'Role', details: { name: role.name }, req });
    return ApiResponse.success(res, role, 'Role updated');
  } catch (error) { next(error); }
};

export const deleteRole = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await roleService.deleteRole(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'role', entityId: req.params.id, entityType: 'Role', req });
    return ApiResponse.success(res, null, 'Role deleted');
  } catch (error) { next(error); }
};

export const getPermissions = async (req, res, next) => {
  try {
    const { ALL_PERMISSIONS } = await import('./role.service.js');
    return ApiResponse.success(res, ALL_PERMISSIONS);
  } catch (error) { next(error); }
};
