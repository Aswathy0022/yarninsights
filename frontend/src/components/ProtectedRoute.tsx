import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../utils/roleAccess';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (!canAccess(location.pathname, user.role)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 40 }}>⛔</div>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Access Denied</h2>
        <p style={{ color: '#64748b' }}>Your role ({user.role}) cannot access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
