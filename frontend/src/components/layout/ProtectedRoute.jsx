import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import '../../styles/auth.css';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) return (
    <div className="protected-loading">
      <div style={{ textAlign: 'center' }}>
        <div className="protected-spinner" style={{ margin: '0 auto 16px' }} />
        <p className="protected-text">Loading...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requireAdmin && user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}
