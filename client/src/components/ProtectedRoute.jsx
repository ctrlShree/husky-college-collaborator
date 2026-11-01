import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { session, loading, profileComplete } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <Navigate to="/" replace state={{ from: location, reason: 'auth-required' }} />;
  }

  if (profileComplete === null) {
    return <p>Loading...</p>;
  }

  if (!profileComplete && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  return children;
}