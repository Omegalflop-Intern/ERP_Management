import { Role } from '../modules/role/role.model.js';
import { ApiError } from '../utils/http/ApiError.js';

export const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required'));
      }

      let userRoleName = req.user.roleName || req.user.role;

      // ADMIN role always has full system access
      if (userRoleName === 'ADMIN') {
        return next();
      }

      if (roles.length > 0 && !roles.includes(userRoleName)) {
        // Check if custom role exists and has assigned permissions
        const roleId = req.user.role;
        if (roleId) {
          const role = await Role.findOne({ _id: roleId, isDeleted: false });
          if (role && (role.permissions.includes('*') || role.permissions.length > 0)) {
            return next();
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

      const role = await Role.findOne({ _id: roleId, isDeleted: false });
      if (!role) {
        return next(ApiError.forbidden('Role not found'));
      }

      if (role.permissions.includes('*')) {
        return next();
      }

      const hasPermission = permissions.every((p) => role.permissions.includes(p));
      if (!hasPermission) {
        return next(ApiError.forbidden('You do not have permission for this action'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
