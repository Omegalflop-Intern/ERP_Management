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

    if (!tenantId) {
      return next(ApiError.forbidden('No tenant context found. Access denied.'));
    }

    const tenant = await db('tenants').where({ id: tenantId }).first();
    if (!tenant || Boolean(tenant.is_deleted)) {
      throw ApiError.forbidden('Shop account has been deleted or does not exist. Access denied.');
    }

    // Auto-suspend if subscription expired (dual protection: cron + on-request)
    if (tenant.status === 'ACTIVE' && tenant.expires_at && new Date(tenant.expires_at) < new Date()) {
      await db('tenants').where({ id: tenantId }).update({
        status: 'SUSPENDED',
        paused_reason: 'SUBSCRIPTION_EXPIRED',
        paused_at: new Date(),
      });
      await db('users').where({ tenant_id: tenantId }).update({ is_active: false });
      throw ApiError.forbidden('Your subscription has expired. Please renew to continue.');
    }

    if (tenant.status === 'SUSPENDED') {
      throw ApiError.forbidden('Your shop account has been suspended. Please contact support.');
    }

    if (tenant.status !== 'ACTIVE') {
      throw ApiError.forbidden(`Shop account status is "${tenant.status}". Access denied.`);
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (error) {
    next(error);
  }
};
