import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

export function useDocumentTitle(pageTitle) {
  const { user } = useAuthStore();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data?.data || res.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user && !!user.tenantId,
  });

  useEffect(() => {
    let brand = 'Omni-Manage';
    if (user) {
      if (!user.tenantId && user.roleName === 'ADMIN') {
        brand = 'Super Admin | Omni-Manage';
      } else {
        const shop = user.tenant?.shopName || user.shopName || settings?.companyName || 'Shop ERP';
        brand = `${shop} | Omni-Manage`;
      }
    }

    document.title = pageTitle ? `${pageTitle} - ${brand}` : brand;
  }, [user, settings, pageTitle]);
}
