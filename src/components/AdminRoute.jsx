import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
    <div className="w-8 h-8 border-4 rounded-full animate-spin"
      style={{ borderColor: 'var(--gf-border)', borderTopColor: 'var(--gf-green)' }} />
  </div>
);

export default function AdminRoute({ fallback = <DefaultFallback /> }) {
  const { isAuthenticated, isLoadingAuth, authChecked, user } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}