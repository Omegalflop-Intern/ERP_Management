import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { toast } from 'sonner';

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

          if (data.requiresVerification) {
            set({ loading: false });
            return { requiresVerification: true, email: data.email };
          }

          const { token, user: userData } = data;

          if (token) localStorage.setItem('accessToken', token);
          localStorage.setItem('user', JSON.stringify(userData));
          set({ user: userData, token: token || null, loading: false });

          toast.success(`Welcome back, ${userData.username}!`);
          return userData;
        } catch (error) {
          set({ loading: false });
          const message = error.response?.data?.message || 'Login failed';
          toast.error(message);
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // Ignore errors — clear locally regardless
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        set({ user: null, token: null });
        toast.info('Logged out successfully');
      },

      setUser: (user) => set({ user }),

      // Called by api.js after a successful token refresh
      setToken: (token) => {
        if (token) localStorage.setItem('accessToken', token);
        set({ token });
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        if (user.roleName === 'ADMIN') return true;
        return user.permissions?.includes(permission) ?? false;
      },

      hasAnyPermission: (permissions) => {
        const { user } = get();
        if (!user) return false;
        if (user.roleName === 'ADMIN') return true;
        return permissions.some((p) => user.permissions?.includes(p));
      },

      isAuthenticated: () => !!get().user,
    }),
    {
      name: 'auth-storage',
      // Persist both user and token so SSE and API calls always have a valid token on reload
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
