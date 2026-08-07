import { Tenant } from '../modules/tenant/tenant.model.js';

/**
 * Extracts tenant context from the Host header (subdomain or custom domain).
 * Sets req.tenantContext if a matching tenant is found.
 * Does NOT replace JWT auth — supplements it with URL-based tenant identification.
 */
export const extractTenantFromHost = async (req, res, next) => {
  try {
    const host = req.headers.host?.split(':')[0];
    if (!host) return next();

    const baseDomain = process.env.BASE_DOMAIN || 'erp.com';

    // Skip if already authenticated with JWT tenant
    if (req.user?.tenantId) return next();

    // Check subdomain: mamum.erp.com → "mamum"
    if (host.endsWith(`.${baseDomain}`)) {
      const subdomain = host.replace(`.${baseDomain}`, '');
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        const tenant = await Tenant.findOne({ subdomain, isDeleted: false, status: 'ACTIVE' })
          .select('_id shopName subdomain customDomain plan status')
          .lean();
        if (tenant) {
          req.tenantContext = { tenantId: tenant._id, tenant };
          return next();
        }
      }
    }

    // Check custom domain: mamumerp.com
    if (!host.endsWith(`.${baseDomain}`) && host !== baseDomain) {
      const tenant = await Tenant.findOne({ customDomain: host, isDeleted: false, status: 'ACTIVE' })
        .select('_id shopName subdomain customDomain plan status')
        .lean();
      if (tenant) {
        req.tenantContext = { tenantId: tenant._id, tenant };
      }
    }

    next();
  } catch (err) {
    // Don't break the request on middleware errors
    console.error('[Subdomain Middleware Error]:', err.message);
    next();
  }
};
