export const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'omnimanage.com';

export function getBaseDomain() {
  const host = window.location.hostname;
  if (host.endsWith('.localhost')) return 'localhost';
  return baseDomain;
}

/**
 * Detect subdomain from current URL.
 * salah.localhost → "salah"
 * mamum.erp.com → "mamum"
 * erp.com → null (main domain / super admin)
 */
export function detectSubdomain() {
  const host = window.location.hostname;

  // Localhost subdomain: salah.localhost
  if (host.endsWith('.localhost')) {
    const sub = host.replace('.localhost', '');
    if (sub && sub !== 'www' && sub !== 'api') return sub;
    return null;
  }

  // Subdomain: mamum.erp.com
  if (host.endsWith(`.${baseDomain}`)) {
    const sub = host.replace(`.${baseDomain}`, '');
    if (sub && sub !== 'www' && sub !== 'api') return sub;
    return null;
  }

  // Custom domain: anything that's not the base domain itself
  if (
    host !== baseDomain &&
    !host.startsWith('www.') &&
    host !== 'localhost' &&
    host !== '127.0.0.1'
  ) {
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
