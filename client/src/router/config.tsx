import { RouteObject, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { ProtectedRoute } from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import { Layout } from '../components/Layout';

const LoginPage = lazy(() => import('../pages/login/page'));
const ResetPasswordPage = lazy(() => import('../pages/reset-password/page'));
const DashboardPage = lazy(() => import('../pages/dashboard/page'));
const MISEntryPage = lazy(() => import('../pages/mis-entry/page'));
const FinalMISPage = lazy(() => import('../pages/final-mis/page'));
const AdminPage = lazy(() => import('../pages/admin/page'));
const NotificationConfigPage = lazy(() => import('../pages/admin/notifications/page'));
const CustomerPage = lazy(() => import('../pages/customer/page'));
const NotFound = lazy(() => import('../pages/NotFound'));

/** Content-area loader — chrome stays mounted via persistent Layout */
export const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '40vh',
    }}
    role="status"
    aria-label="Loading page"
  >
    <CircularProgress color="primary" />
  </Box>
);

const withSuspense = (el: ReactNode) => (
  <Suspense fallback={<PageLoader />}>{el}</Suspense>
);

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: withSuspense(<LoginPage />),
  },
  {
    path: '/reset-password',
    element: withSuspense(<ResetPasswordPage />),
  },
  {
    path: '/consolidated-mis-view',
    element: <Navigate to="/final-mis" replace />,
  },
  {
    path: '/consolidated-mis-v2',
    element: <Navigate to="/final-mis" replace />,
  },
  {
    path: '/audit-logs',
    element: <Navigate to="/admin" replace />,
  },
  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: withSuspense(<DashboardPage />),
      },
      {
        path: '/mis-entry',
        element: withSuspense(<MISEntryPage />),
      },
      {
        path: '/final-mis',
        element: withSuspense(<FinalMISPage />),
      },
      {
        path: '/customers',
        element: withSuspense(<CustomerPage />),
      },
      {
        path: '/admin',
        element: <AdminRoute>{withSuspense(<AdminPage />)}</AdminRoute>,
      },
      {
        path: '/admin/notifications',
        element: <AdminRoute>{withSuspense(<NotificationConfigPage />)}</AdminRoute>,
      },
    ],
  },
  {
    path: '*',
    element: withSuspense(<NotFound />),
  },
];

export default routes;
