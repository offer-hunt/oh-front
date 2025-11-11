import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';

export const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <p className="container">Загрузка…</p>;
  }

  if (!isAuthenticated) {
    sessionStorage.setItem('post_login_redirect', location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
