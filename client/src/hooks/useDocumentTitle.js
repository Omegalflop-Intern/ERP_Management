import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { detectSubdomain } from '../utils/subdomain';

export function useDocumentTitle(pageTitle) {
  const { user } = useAuthStore();
  const isSuperAdmin = !!user && !user.tenantId;
  const isShopUser = !!user && !!user.tenantId;
  const subdomain = detectSubdomain();

  // Fetch real tenant/shop name from /tenants/me for logged in shop users
  const { data: tenantInfo } = useQuery({
    queryKey: ['my-tenant-info-title', user?.tenantId],
    queryFn: async () => {
      const res = await api.get('/tenants/me');
      return res.data?.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: isShopUser,
  });

  // Fetch public tenant info for visitors on a subdomain (e.g. login page)
  const { data: publicTenant } = useQuery({
    queryKey: ['public-tenant-title', subdomain],
    queryFn: async () => {
      const res = await api.get(`/tenants/public/by-subdomain/${subdomain}`);
      return res.data?.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!subdomain && !user,
  });

  useEffect(() => {
    let brand = 'Omegaflop';
    if (isSuperAdmin) {
      brand = 'Super Admin | Omegaflop';
    } else if (isShopUser) {
      const shop = tenantInfo?.shopName || user?.tenant?.shopName || user?.shopName || 'My Shop';
      brand = `${shop} | Omegaflop`;
    } else if (publicTenant?.shopName) {
      brand = `${publicTenant.shopName} | Omegaflop`;
    } else if (subdomain) {
      const formattedSub = subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
      brand = `${formattedSub} Store | Omegaflop`;
    }

    document.title = pageTitle ? `${pageTitle} — ${brand}` : brand;
  }, [user, tenantInfo, publicTenant, pageTitle, isSuperAdmin, isShopUser, subdomain]);
}
