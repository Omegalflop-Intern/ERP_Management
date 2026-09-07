export function getBaseDomain() {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_BASE_DOMAIN || 'localhost';
  }
  const host = window.location.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) {
    return 'localhost';
  }
  if (import.meta.env.VITE_BASE_DOMAIN) {
    return import.meta.env.VITE_BASE_DOMAIN;
  }
  const parts = host.split('.');
  if (parts.length > 2) {
    return parts.slice(-2).join('.');
  }
  return host;
}

export const baseDomain = typeof window !== 'undefined' ? getBaseDomain() : (import.meta.env.VITE_BASE_DOMAIN || 'localhost');

/**
 * Detect subdomain from current URL.
 * salah.localhost → "salah"
 * shop.yourdomain.com → "shop"
 * yourdomain.com / www.yourdomain.com → null (main domain)
 */
export function detectSubdomain() {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname.toLowerCase();
  const currentBase = getBaseDomain();

  // Localhost subdomain: salah.localhost
  if (host.endsWith('.localhost')) {
    const sub = host.replace('.localhost', '');
    if (sub && sub !== 'www' && sub !== 'api') return sub;
    return null;
  }

  // Exact main domain or www/api subdomains -> return null (main domain)
  if (host === currentBase || host === `www.${currentBase}` || host === `api.${currentBase}`) {
    return null;
  }

  // Subdomain: shop.yourdomain.com
  if (currentBase !== 'localhost' && host.endsWith(`.${currentBase}`)) {
    const sub = host.replace(`.${currentBase}`, '');
    if (sub && sub !== 'www' && sub !== 'api') return sub;
    return null;
  }

  // Localhost / IP check
  if (host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  // Custom domain: e.g. custombrand.com
  const cleanHost = host.startsWith('www.') ? host.slice(4) : host;
  if (cleanHost !== currentBase) {
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

/**
 * Get URL to the main portal domain from a subdomain/custom domain.
 */
export function getMainPortalUrl(path = '') {
  if (typeof window === 'undefined') return path || '/';
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  const currentBase = getBaseDomain();

  if (currentBase === 'localhost') {
    return `${protocol}//localhost${port}${path}`;
  }
  return `${protocol}//${currentBase}${port}${path}`;
}

