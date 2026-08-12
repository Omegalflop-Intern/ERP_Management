import { db } from '../config/db.knex.js';

export const extractTenantFromHost = async (req, res, next) => {
  try {
    const host = req.headers.host?.split(':')[0];
    if (!host) return next();

    const baseDomain = process.env.BASE_DOMAIN || 'erp.com';

    if (req.user?.tenantId) return next();

    let subdomain = null;
    let customDomain = null;

    if (host.endsWith(`.${baseDomain}`)) {
      const sub = host.replace(`.${baseDomain}`, '');
      if (sub && sub !== 'www' && sub !== 'api') {
        subdomain = sub;
      }
    } else if (host !== baseDomain && host !== 'localhost' && !host.startsWith('127.')) {
      customDomain = host;
    }

    if (subdomain || customDomain) {
      const query = db('tenants');
      if (subdomain) query.where({ subdomain });
      else if (customDomain) query.where({ custom_domain: customDomain });

      const tenant = await query.select('id', 'shop_name', 'subdomain', 'custom_domain', 'plan', 'status', 'is_deleted').first();

      if (tenant) {
        if (Boolean(tenant.is_deleted) || tenant.status !== 'ACTIVE') {
          return res.status(403).json({
            success: false,
            message: `Shop account "${tenant.shop_name || subdomain || customDomain}" is ${tenant.status === 'SUSPENDED' ? 'suspended' : 'deleted/inactive'}. Access denied.`,
          });
        }

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

    next();
  } catch (err) {
    console.error('[Subdomain Middleware Error]:', err.message);
    next();
  }
};
