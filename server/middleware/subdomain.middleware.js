import { db } from '../config/db.knex.js';

export const extractTenantFromHost = async (req, res, next) => {
  try {
    const host = req.headers.host?.split(':')[0];
    if (!host) return next();

    const baseDomain = process.env.BASE_DOMAIN || 'erp.com';

    if (req.user?.tenantId) return next();

    if (host.endsWith(`.${baseDomain}`)) {
      const subdomain = host.replace(`.${baseDomain}`, '');
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        const tenant = await db('tenants')
          .where({ subdomain, is_deleted: false, status: 'ACTIVE' })
          .select('id', 'shop_name', 'subdomain', 'custom_domain', 'plan', 'status')
          .first();
        if (tenant) {
          req.tenantContext = {
            tenantId: tenant.id,
            tenant: {
              _id: String(tenant.id),
              id: tenant.id,
              shopName: tenant.shop_name,
              subdomain: tenant.subdomain,
              customDomain: tenant.custom_domain,
              plan: tenant.plan,
              status: tenant.status,
            },
          };
          return next();
        }
      }
    }

    if (!host.endsWith(`.${baseDomain}`) && host !== baseDomain) {
      const tenant = await db('tenants')
        .where({ custom_domain: host, is_deleted: false, status: 'ACTIVE' })
        .select('id', 'shop_name', 'subdomain', 'custom_domain', 'plan', 'status')
        .first();
      if (tenant) {
        req.tenantContext = {
          tenantId: tenant.id,
          tenant: {
            _id: String(tenant.id),
            id: tenant.id,
            shopName: tenant.shop_name,
            subdomain: tenant.subdomain,
            customDomain: tenant.custom_domain,
            plan: tenant.plan,
            status: tenant.status,
          },
        };
      }
    }

    next();
  } catch (err) {
    console.error('[Subdomain Middleware Error]:', err.message);
    next();
  }
};
