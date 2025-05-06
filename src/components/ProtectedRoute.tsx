import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  redirectTo?: string;
}

const ProtectedRoute = ({ redirectTo = '/auth' }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // --- DEVELOPMENT MODE BYPASS --- 
  if (import.meta.env.DEV) {
    console.warn('ProtectedRoute: Bypassing auth check in development mode.');
    return <Outlet />; // Always allow access in dev mode
  }
  // --- END DEVELOPMENT MODE BYPASS ---

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Render child routes if authenticated
  return <Outlet />;
};

export default ProtectedRoute;
