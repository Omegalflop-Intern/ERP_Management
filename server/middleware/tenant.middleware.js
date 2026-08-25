import { db } from '../config/db.knex.js';
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

    if (!tenantId && req.user?.roleName === 'ADMIN') {
      return next();
    }

    // Bug #31 fixed: Removed silent next() for null tenantId on non-admin users.
    // A non-admin user without a tenant has no business accessing tenant-scoped routes.
    if (!tenantId) {
      return next(ApiError.forbidden('No tenant context found. Access denied.'));
    }

    const tenant = await db('tenants').where({ id: tenantId }).first();
    if (!tenant || Boolean(tenant.is_deleted)) {
      throw ApiError.forbidden('Shop account has been deleted or does not exist. Access denied.');
    }

    if (tenant.status !== 'ACTIVE') {
      if (tenant.status === 'PAUSED' || tenant.status === 'SUSPENDED') {
        throw ApiError.forbidden('Your shop account has been suspended by system administrator. Please contact support.');
      }
      if (tenant.status === 'PENDING_KYC') {
        throw ApiError.forbidden('Your shop account is pending KYC & document verification approval by administrator.');
      }
      throw ApiError.forbidden(`Shop account status is "${tenant.status}". Access denied.`);
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (error) {
    next(error);
  }
};
