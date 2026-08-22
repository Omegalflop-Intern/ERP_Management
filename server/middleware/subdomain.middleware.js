import { db } from '../config/db.knex.js';
import { env } from '../config/env.config.js';

export const extractTenantFromHost = async (req, res, next) => {
  try {
    const rawHost = req.headers.host?.split(':')[0]?.toLowerCase();
    if (!rawHost) return next();

    const baseDomain = (env.BASE_DOMAIN || process.env.BASE_DOMAIN || 'respawnalley.com').toLowerCase();

    if (req.user?.tenantId) return next();

    // Main domain check: respawnalley.com, www.respawnalley.com, api.respawnalley.com, localhost
    if (
      rawHost === baseDomain ||
      rawHost === `www.${baseDomain}` ||
      rawHost === `api.${baseDomain}` ||
      rawHost === 'localhost' ||
      rawHost.startsWith('127.')
    ) {
      return next();
    }

    let subdomain = null;
    let customDomain = null;

    if (rawHost.endsWith(`.${baseDomain}`)) {
      const sub = rawHost.slice(0, rawHost.length - baseDomain.length - 1);
      if (sub && sub !== 'www' && sub !== 'api') {
        subdomain = sub;
      }
    } else {
      customDomain = rawHost.startsWith('www.') ? rawHost.slice(4) : rawHost;
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

