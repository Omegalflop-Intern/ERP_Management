import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import api from '../lib/api';

export const useBranchStore = create(
  persist(
    (set, get) => ({
      activeBranchId: 'all',
      branches: [],
      loading: false,
      tenantPlan: 'ENTERPRISE',
      maxBranches: 999,

      setActiveBranchId: (branchId, branchName = '') => {
        const current = get().activeBranchId;
        if (current === branchId) return;

        set({ activeBranchId: String(branchId) });
        if (branchId === 'all') {
          toast.info('Viewing data across All Outlets');
        } else if (branchName) {
          toast.success(`Active outlet set to: ${branchName}`);
        } else {
          const match = get().branches.find((b) => String(b.id || b._id) === String(branchId));
          toast.success(`Active outlet set to: ${match?.name || 'Selected Outlet'}`);
        }
      },

      fetchBranches: async () => {
        set({ loading: true });
        try {
          // Fetch branches list
          const res = await api.get('/branches/flat');
          const list = res.data?.data || [];

          const currentActive = get().activeBranchId;
          const validBranch =
            currentActive === 'all' ||
            list.some((b) => String(b.id || b._id) === String(currentActive));
          const nextActive = validBranch ? currentActive : list[0]?.id ? String(list[0].id) : 'all';

          set({ branches: list, activeBranchId: nextActive, loading: false });

          // Attempt to fetch current tenant plan info if available
          try {
            const tenantRes = await api.get('/tenants/me');
            const tenantData = tenantRes.data?.data;
            if (tenantData) {
              const plan = (tenantData.plan || 'ENTERPRISE').toUpperCase();
              const maxB =
                tenantData.maxBranches !== undefined && tenantData.maxBranches !== null
                  ? Number(tenantData.maxBranches)
                  : plan === 'ENTERPRISE'
                    ? 999
                    : 2;
              set({
                tenantPlan: plan,
                maxBranches: maxB,
              });
            }
          } catch {
            // Ignore tenant info fetch error
          }
        } catch (error) {
          set({ loading: false });
        }
      },

      syncUserBranch: (user) => {
        if (!user || typeof user !== 'object') return;
        const roleName = (user.roleName || user.role?.name || '').toUpperCase();
        const isAdmin = roleName === 'ADMIN' || user.isSuperAdmin;

        // If staff/manager is assigned to a specific branch, force activeBranchId to that branch
        if (!isAdmin && user.branchId) {
          set({ activeBranchId: String(user.branchId) });
        }
      },
    }),
    {
      name: 'branch-storage',
      partialize: (state) => ({ activeBranchId: state.activeBranchId }),
    }
  )
);
