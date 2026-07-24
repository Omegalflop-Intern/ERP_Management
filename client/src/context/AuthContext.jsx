/**
 * AuthContext.jsx — Compatibility layer
 * Wraps Zustand authStore and exposes the exact same API shape
 * as the old React Context, so all existing components work unchanged.
 */
import React, { createContext, useContext } from 'react';
import { useAuthStore } from '../store/authStore';

const AuthContext = createContext(null);

export const useAuth = () => {
  // Read directly from Zustand store — returns proper values
  const store = useAuthStore();

  return {
    user: store.user,
    setUser: store.setUser,
    loading: store.loading,
    login: store.login,
    logout: store.logout,
    // isAuthenticated must be a BOOLEAN not a function
    isAuthenticated: !!store.user,
    hasPermission: store.hasPermission,
    hasAnyPermission: store.hasAnyPermission,
    permissions: store.user?.permissions || [],
  };
};

// No-op provider — kept for backward compat with main.jsx
export const AuthProvider = ({ children }) => <>{children}</>;
