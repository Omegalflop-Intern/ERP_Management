import { Tenant } from '../modules/tenant/tenant.model.js';
import { ApiError } from '../utils/http/ApiError.js';

export const requireSuperAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    if (req.user?.tenantId) {
      return next(ApiError.forbidden('Only the platform super admin can access this resource'));
    }
    if (req.user?.roleName !== 'ADMIN') {
      return next(ApiError.forbidden('Super admin privileges required'));
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const checkTenantStatus = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

    // Platform Super Admin without tenant restriction can proceed
    if (!tenantId && req.user?.roleName === 'ADMIN') {
      return next();
    }

    if (!tenantId) {
      return next(); // Default single-tenant compatibility
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant || tenant.isDeleted) {
      throw ApiError.notFound('Shop account not found');
    }

    if (tenant.status === 'PAUSED') {
      throw ApiError.forbidden('Your shop account has been suspended by system administrator. Please contact billing support.');
    }

    if (tenant.status === 'PENDING_KYC') {
      throw ApiError.forbidden('Your shop account is pending KYC & document verification approval by administrator.');
    }

    req.tenant = tenant;
    req.tenantId = tenant._id;
    next();
  } catch (error) {
    next(error);
  }
};
