import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export default function RoleBasedRoute({ children, roles = [], permissions = [] }) {
  const { user, isAuthenticated, hasPermission, hasAnyPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.roleName)) {
    if (permissions.length === 0 || !hasAnyPermission(permissions)) {
      toast.error('You do not have permission to access this page');
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (permissions.length > 0 && !hasAnyPermission(permissions)) {
    if (roles.length === 0 || !roles.includes(user.roleName)) {
      toast.error('You do not have permission to access this page');
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
