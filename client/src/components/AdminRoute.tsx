import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { tokens } from '../themes';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '40vh',
          bgcolor: tokens.bg,
        }}
        role="status"
        aria-label="Checking admin access"
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roleName = typeof user?.role === 'string' ? user.role : (user?.role?.name || '');
  const normalized = String(roleName).toLowerCase();
  const hasPerm = (user?.permissions || []).some(
    (p: { resource?: string; action?: string }) =>
      (p.resource === 'config' || p.resource === 'admin') &&
      (p.action === 'read' || p.action === 'update')
  );

  if (
    normalized === 'admin' ||
    normalized === 'superadmin' ||
    normalized === 'super admin' ||
    hasPerm
  ) {
    return <>{children}</>;
  }

  return <Navigate to="/dashboard" replace />;
};

export default AdminRoute;
