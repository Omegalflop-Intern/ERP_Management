import { toast } from 'sonner';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,

      login: async (loginField, password) => {
        set({ loading: true });
        try {
          const res = await api.post('/auth/login-direct', { login: loginField, password });
          const data = res.data.data;

          if (data.requiresOtp) {
            set({ loading: false });
            return { requiresOtp: true, email: data.email };
          }

          const { token, user: userData } = data;

          if (token) localStorage.setItem('accessToken', token);
          localStorage.setItem('user', JSON.stringify(userData));
          set({ user: userData, token: token || null, loading: false });

          toast.success(`Welcome back, ${userData.fullName || userData.username}!`);
          return userData;
        } catch (error) {
          set({ loading: false });
          const message = error.response?.data?.message || 'Login failed';
          toast.error(message);
          throw error;
        }
      },

      logout: async () => {
        const tokenToRevoke = get().token || localStorage.getItem('accessToken');

        // 1. Immediately clear local storage and state synchronously to avoid route re-render flickering
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        set({ user: null, token: null });

        // 2. Non-blocking call to backend to clear cookie/session
        try {
          if (tokenToRevoke) {
            api.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${tokenToRevoke}` } }).catch(() => {});
          } else {
            api.post('/auth/logout').catch(() => {});
          }
        } catch {
          // Ignore background logout errors
        }

        toast.info('Logged out successfully');
      },

      setUser: (userOrFn) =>
        set((state) => {
          const nextUser = typeof userOrFn === 'function' ? userOrFn(state.user) : userOrFn;
          if (nextUser && typeof nextUser === 'object') {
            try {
              localStorage.setItem('user', JSON.stringify(nextUser));
            } catch {
              // Ignore storage errors
            }
          }
          return { user: nextUser };
        }),

      // Called by api.js after a successful token refresh
      setToken: (token) => {
        if (token) localStorage.setItem('accessToken', token);
        set({ token });
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user || typeof user !== 'object') return false;
        if (user.roleName === 'ADMIN' || user.permissions?.includes('*')) return true;
        return user.permissions?.includes(permission) ?? false;
      },

      hasAnyPermission: (permissions) => {
        const { user } = get();
        if (!user || typeof user !== 'object') return false;
        if (user.roleName === 'ADMIN' || user.permissions?.includes('*')) return true;
        return permissions.some((p) => user.permissions?.includes(p));
      },

      isAuthenticated: () => !!get().user && typeof get().user === 'object',
    }),
    {
      name: 'auth-storage',
      // Persist both user and token so SSE and API calls always have a valid token on reload
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
