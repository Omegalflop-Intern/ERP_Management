import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '../lib/api.js';

export function useActivePaymentMethods() {
  const { data: activeAccountsRes, isLoading } = useQuery({
    queryKey: ['pos-active-accounts'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/accounting/accounts');
        return data?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const activeMethods = useMemo(() => {
    if (!activeAccountsRes || !Array.isArray(activeAccountsRes) || activeAccountsRes.length === 0) {
      return { hasCash: true, hasBank: true, hasBkash: true, hasNagad: true, hasRocket: true };
    }
    const activeList = activeAccountsRes.filter((a) => a.isActive !== false);
    const codes = activeList.map((a) => String(a.code || ''));
    const names = activeList.map((a) => (a.name || '').toLowerCase());
    return {
      hasCash: names.some((n) => n.includes('cash')) || codes.includes('1000'),
      hasBank:
        names.some((n) => n.includes('bank') || n.includes('card')) || codes.includes('1010'),
      hasBkash: names.some((n) => n.includes('bkash')) || codes.includes('1011'),
      hasNagad: names.some((n) => n.includes('nagad')) || codes.includes('1012'),
      hasRocket: names.some((n) => n.includes('rocket')) || codes.includes('1013'),
    };
  }, [activeAccountsRes]);

  return { ...activeMethods, isLoading };
}
