import { Role } from '../modules/role/role.model.js';
import { ApiError } from '../utils/http/ApiError.js';

export const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required'));
      }

      // Legacy: check if role is a string (old system) or ObjectId (new system)
      let userRoleName = req.user.roleName || req.user.role;

      if (roles.length > 0 && !roles.includes(userRoleName)) {
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

      const roleId = req.user.role;
      if (!roleId) {
        return next(ApiError.forbidden('No role assigned'));
      }

      const role = await Role.findOne({ _id: roleId, isDeleted: false });
      if (!role) {
        return next(ApiError.forbidden('Role not found'));
      }

      const hasPermission = permissions.every(p => role.permissions.includes(p));
      if (!hasPermission) {
        return next(ApiError.forbidden('You do not have permission for this action'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
