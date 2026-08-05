import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '../lib/api';

export function useDocumentTitle(pageTitle) {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data?.data || res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const shopName = settings?.companyName || 'Mobile Shop ERP';
    document.title = pageTitle ? `${pageTitle} | ${shopName}` : shopName;
  }, [settings, pageTitle]);
}
