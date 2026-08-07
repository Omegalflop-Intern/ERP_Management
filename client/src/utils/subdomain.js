const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'erp.com';

/**
 * Detect subdomain from current URL.
 * mamum.erp.com → "mamum"
 * mamumerp.com → "mamumerp" (custom domain)
 * erp.com → null (main domain / super admin)
 */
export function detectSubdomain() {
  const host = window.location.hostname;

  // Subdomain: mamum.erp.com
  if (host.endsWith(`.${baseDomain}`)) {
    const sub = host.replace(`.${baseDomain}`, '');
    if (sub && sub !== 'www' && sub !== 'api') return sub;
    return null;
  }

  // Custom domain: anything that's not the base domain itself
  if (host !== baseDomain && !host.startsWith('www.') && host !== 'localhost' && host !== '127.0.0.1') {
    return host;
  }

  return null;
}

/**
 * Check if current URL is a subdomain/custom domain access (not main domain).
 */
export function isSubdomainAccess() {
  return detectSubdomain() !== null;
}
