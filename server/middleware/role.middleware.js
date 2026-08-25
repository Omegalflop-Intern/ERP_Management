import { db } from '../config/db.knex.js';
import { ApiError } from '../utils/http/ApiError.js';

export const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required'));
      }

      let userRoleName = req.user.roleName || req.user.role;

      if (userRoleName === 'ADMIN') {
        return next();
      }

      if (roles.length > 0 && !roles.includes(userRoleName)) {
        // Bug #8 fixed: Removed perms.length > 0 fallback. Previously any role with ANY
        // permission passed ADMIN-only routes (CASHIER → ADMIN privilege escalation).
        // Now ONLY roles with wildcard '*' permission can bypass role enforcement.
        const roleId = req.user.role;
        if (roleId) {
          const role = await db('roles').where({ id: roleId, is_deleted: false }).first();
          if (role) {
            let perms = role.permissions;
            if (typeof perms === 'string') { try { perms = JSON.parse(perms); } catch { perms = []; } }
            if (Array.isArray(perms) && perms.includes('*')) {
              return next();
            }
          }
        }
        return next(ApiError.forbidden(`Role '${userRoleName}' is not authorized for this action`));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requirePermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required'));
      }

      let userRoleName = req.user.roleName || req.user.role;
      if (userRoleName === 'ADMIN') {
        return next();
      }

      const roleId = req.user.role;
      if (!roleId) {
        return next(ApiError.forbidden('No role assigned'));
      }

      const role = await db('roles').where({ id: roleId, is_deleted: false }).first();
      if (!role) {
        return next(ApiError.forbidden('Role not found'));
      }

      let perms = role.permissions;
      if (typeof perms === 'string') { try { perms = JSON.parse(perms); } catch { perms = []; } }
      if (!Array.isArray(perms)) perms = [];

      if (perms.includes('*')) {
        return next();
      }

      const hasPermission = permissions.every((p) => perms.includes(p));
      if (!hasPermission) {
        return next(ApiError.forbidden('You do not have permission for this action'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
