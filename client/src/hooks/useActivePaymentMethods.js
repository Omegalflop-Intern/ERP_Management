import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import api from '../lib/api.js';

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
      const defaultMethods = [
        { id: 'CASH', label: 'Cash Payment' },
        { id: 'BANK', label: 'Bank Transfer / Card' },
        { id: 'BKASH', label: 'bKash Merchant' },
        { id: 'NAGAD', label: 'Nagad' },
        { id: 'ROCKET', label: 'Rocket' },
      ];
      return {
        hasCash: true,
        hasBank: true,
        hasBkash: true,
        hasNagad: true,
        hasRocket: true,
        methods: defaultMethods,
      };
    }

    const activeList = activeAccountsRes.filter(
      (a) => a.isActive !== false && a.is_active !== false && !a.isDeleted
    );
    const codes = activeList.map((a) => String(a.code || ''));
    const names = activeList.map((a) => (a.name || '').toLowerCase());

    const hasCash = names.some((n) => n.includes('cash')) || codes.includes('1000');
    const hasBank =
      names.some((n) => n.includes('bank') || n.includes('card')) || codes.includes('1010');
    const hasBkash = names.some((n) => n.includes('bkash')) || codes.includes('1011');
    const hasNagad = names.some((n) => n.includes('nagad')) || codes.includes('1012');
    const hasRocket = names.some((n) => n.includes('rocket')) || codes.includes('1013');

    const methods = [];
    if (hasCash) methods.push({ id: 'CASH', label: 'Cash Payment' });
    if (hasBank) methods.push({ id: 'BANK', label: 'Bank Transfer / Card' });
    if (hasBkash) methods.push({ id: 'BKASH', label: 'bKash Merchant' });
    if (hasNagad) methods.push({ id: 'NAGAD', label: 'Nagad' });
    if (hasRocket) methods.push({ id: 'ROCKET', label: 'Rocket' });

    if (methods.length === 0) {
      methods.push({ id: 'CASH', label: 'Cash Payment' });
    }

    return {
      hasCash,
      hasBank,
      hasBkash,
      hasNagad,
      hasRocket,
      methods,
    };
  }, [activeAccountsRes]);

  return { ...activeMethods, isLoading };
}
