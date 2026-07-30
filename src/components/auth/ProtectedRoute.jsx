import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps a page element and redirects to /login if there's no active
 * session. Remembers where the user was headed via location state, so
 * Login.jsx can send them back after a successful sign in.
 *
 * If Supabase isn't configured yet (VITE_SUPABASE_URL/KEY missing), auth
 * is effectively disabled and every route stays open - this keeps the
 * dashboard usable in demo/mock mode before the backend team wires up
 * real credentials.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, isSupabaseConfigured } = useAuth();
  const location = useLocation();

  if (!isSupabaseConfigured) return children;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-sky-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
