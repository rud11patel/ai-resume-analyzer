import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useMockAuth } from '../../hooks/useMockAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useMockAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="lg" className="text-indigo-400" />
        <p className="text-xs text-slate-400">Verifying authentication session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page while preserving target path for post-login return
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
