import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api, { getAssetUrl } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { detectSubdomain } from '../utils/subdomain';

const ROUTE_TITLE_MAP = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/pos': 'POS & New Sale',
  '/sales': 'Sales Management',
  '/sales/new': 'New Sale POS',
  '/returns': 'Returns & Refunds',
  '/products': 'Inventory & Products',
  '/imei': 'IMEI / Serial Tracker',
  '/categories': 'Product Categories',
  '/stock-overview': 'Stock Overview',
  '/customers': 'Customer CRM',
  '/due-collection': 'Due Collection',
  '/warranty-claims': 'Warranty Claims',
  '/warranty-report': 'Warranty Reports',
  '/sales-report': 'Sales & Revenue Reports',
  '/suppliers': 'Suppliers Management',
  '/purchases': 'Purchase Orders',
  '/accounting/coa': 'Chart of Accounts',
  '/accounting/journal': 'Journal Entries',
  '/accounting/balance-sheet': 'Balance Sheet',
  '/accounting/profit-loss': 'Profit & Loss Statement',
  '/accounting/trial-balance': 'Trial Balance',
  '/accounting/cash-flow': 'Cash Flow Statement',
  '/accounting/investors': 'Investors Management',
  '/accounting/expenses': 'Expense Tracker',
  '/accounting/assets': 'Fixed Assets Management',
  '/accounting/loans': 'Loans & Liabilities',
  '/employees': 'Employee Directory',
  '/attendance': 'Staff Attendance',
  '/leave': 'Leave Management',
  '/payroll': 'Payroll & Salaries',
  '/repairs': 'Device Servicing & Repair',
  '/wholesale': 'Wholesale Orders',
  '/settings': 'Store Settings',
  '/settings/profile': 'My Profile',
  '/settings/logs': 'Activity Logs',
  '/analytics/business': 'Business Analytics',
  '/analytics/inventory': 'Inventory Analytics',
  '/analytics/employees': 'HR & Employee Analytics',
  '/analytics/customers': 'Customer CRM Analytics',
  '/support': 'Help & Support Tickets',
  '/login': 'Login',
  '/register-shop': 'Register Shop',
  '/forgot-password': 'Forgot Password',
  '/reset-password': 'Reset Password',
  '/super-admin': 'Super Admin Portal',
  '/super-admin/shops': 'Shop Management',
  '/super-admin/plans': 'Subscription Plans',
  '/super-admin/kyc': 'KYC Verification',
  '/super-admin/audit-logs': 'Audit Logs',
  '/super-admin/tickets': 'Support Tickets',
  '/super-admin/admins': 'System Administrators',
  '/super-admin/settings': 'Platform Settings',
  '/super-admin/backup': 'Database Backups',
  '/about': 'About Us',
  '/contact': 'Contact Us',
  '/terms': 'Terms of Service',
  '/privacy': 'Privacy Policy',
  '/refund-policy': 'Refund Policy',
  '/developers': 'Developer API',
};

function formatCustomDomainName(domain) {
  if (!domain) return null;
  // If domain is like xyzshop.com or shop.xyz.com, extract main part
  const clean = domain.replace(/^www\./, '').split('.')[0];
  if (!clean) return domain;
  return clean
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const roundedFaviconCache = new Map();

function setFaviconHref(href) {
  try {
    let favicon = document.querySelector("link[rel*='icon']");
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'shortcut icon';
      favicon.type = 'image/png';
      document.getElementsByTagName('head')[0].appendChild(favicon);
    }
    favicon.href = href;
  } catch {
    // ignore
  }
}

function updateRoundedFavicon(logoSrc) {
  if (!logoSrc) {
    setFaviconHref('/logo.svg');
    return;
  }

  const fullUrl = getAssetUrl(logoSrc);
  if (roundedFaviconCache.has(fullUrl)) {
    setFaviconHref(roundedFaviconCache.get(fullUrl));
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = fullUrl;

  img.onload = () => {
    try {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setFaviconHref(fullUrl);
        return;
      }

      ctx.clearRect(0, 0, size, size);

      // Create clean circular clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Clean white circular background so dark/transparent logos pop out cleanly on dark browser tabs
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // Fit image aspect ratio with internal padding so edges never get cut
      const padding = 6;
      const drawAreaSize = size - padding * 2;
      const hRatio = drawAreaSize / img.width;
      const vRatio = drawAreaSize / img.height;
      const ratio = Math.min(hRatio, vRatio);

      const drawW = img.width * ratio;
      const drawH = img.height * ratio;
      const drawX = (size - drawW) / 2;
      const drawY = (size - drawH) / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Draw subtle circular border outline
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const dataUrl = canvas.toDataURL('image/png');
      roundedFaviconCache.set(fullUrl, dataUrl);
      setFaviconHref(dataUrl);
    } catch {
      // Fall back to direct image URL if canvas is tainted by CORS
      setFaviconHref(fullUrl);
    }
  };

  img.onerror = () => {
    setFaviconHref(fullUrl || '/logo.svg');
  };
}

export function useDocumentTitle(explicitPageTitle) {
  const location = useLocation();
  const { user } = useAuthStore();
  const isSuperAdmin = !!user && !user.tenantId;
  const isShopUser = !!user && !!user.tenantId;
  const subdomain = detectSubdomain();

  // Fetch real tenant/shop info from /tenants/me for logged in shop users
  const { data: tenantInfo } = useQuery({
    queryKey: ['my-tenant-info-title', user?.tenantId],
    queryFn: async () => {
      const res = await api.get('/tenants/me');
      return res.data?.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: isShopUser,
  });

  // Fetch public tenant info for visitors on a subdomain / custom domain
  const {
    data: publicTenant,
    isLoading: isPublicLoading,
    isError: isPublicError,
  } = useQuery({
    queryKey: ['public-tenant-title', subdomain],
    queryFn: async () => {
      const res = await api.get(`/tenants/public/by-subdomain/${subdomain}`);
      return res.data?.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!subdomain && !user,
    retry: false,
  });

  useEffect(() => {
    // 1. Determine the Brand Name / Shop Name
    let brand = 'OmniManage';
    let currentLogo = null;

    if (isSuperAdmin) {
      brand = 'Super Admin | OmniManage';
    } else if (isShopUser) {
      const shop = tenantInfo?.shopName || user?.tenant?.shopName || user?.shopName || 'My Shop';
      brand = `${shop} | OmniManage`;
      currentLogo = tenantInfo?.logo || user?.tenant?.logo || null;
    } else if (publicTenant?.shopName) {
      brand = `${publicTenant.shopName} | OmniManage`;
      currentLogo = publicTenant.logo || null;
    } else if (subdomain) {
      if (isPublicError || (!isPublicLoading && !publicTenant)) {
        brand = 'Shop Not Found | OmniManage';
      } else {
        const formattedDomainName = formatCustomDomainName(subdomain);
        brand = `${formattedDomainName} | OmniManage`;
      }
    }

    // 2. Determine Page Title
    let pageTitle = explicitPageTitle;
    if (!pageTitle && location?.pathname) {
      const path = location.pathname.toLowerCase();
      if (ROUTE_TITLE_MAP[path]) {
        pageTitle = ROUTE_TITLE_MAP[path];
      } else if (path.startsWith('/sales/invoices/') || path.startsWith('/sales/')) {
        pageTitle = 'Invoice Details';
      } else if (path.startsWith('/customers/')) {
        pageTitle = 'Customer Profile';
      } else if (path.startsWith('/invoices/public/')) {
        pageTitle = 'Invoice';
      }
    }

    // 3. Format Document Title
    if (pageTitle && pageTitle !== 'Home' && pageTitle !== 'Dashboard') {
      document.title = `${pageTitle} — ${brand}`;
    } else {
      document.title = brand;
    }

    // 4. Dynamically update Favicon with Auto-Rounded Circular badge
    updateRoundedFavicon(currentLogo);
  }, [
    user,
    tenantInfo,
    publicTenant,
    explicitPageTitle,
    location?.pathname,
    isSuperAdmin,
    isShopUser,
    subdomain,
  ]);
}
