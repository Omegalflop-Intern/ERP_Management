export const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'respawnalley.com';

export function getBaseDomain() {
  const host = window.location.hostname;
  if (host.endsWith('.localhost')) return 'localhost';
  return baseDomain;
}

/**
 * Detect subdomain from current URL.
 * salah.localhost → "salah"
 * shop.respawnalley.com → "shop"
 * respawnalley.com / www.respawnalley.com → null (main domain)
 */
export function detectSubdomain() {
  const host = window.location.hostname.toLowerCase();

  // Localhost subdomain: salah.localhost
  if (host.endsWith('.localhost')) {
    const sub = host.replace('.localhost', '');
    if (sub && sub !== 'www' && sub !== 'api') return sub;
    return null;
  }

  // Exact main domain or www/api subdomains -> return null (main domain)
  if (host === baseDomain || host === `www.${baseDomain}` || host === `api.${baseDomain}`) {
    return null;
  }

  // Subdomain: shop.respawnalley.com
  if (host.endsWith(`.${baseDomain}`)) {
    const sub = host.replace(`.${baseDomain}`, '');
    if (sub && sub !== 'www' && sub !== 'api') return sub;
    return null;
  }

  // Localhost / IP check
  if (host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  // Custom domain: e.g. custombrand.com
  const cleanHost = host.startsWith('www.') ? host.slice(4) : host;
  if (cleanHost !== baseDomain) {
    return cleanHost;
  }

  return null;
}

/**
 * Check if current URL is a subdomain/custom domain access (not main domain).
 */
export function isSubdomainAccess() {
  return detectSubdomain() !== null;
}
