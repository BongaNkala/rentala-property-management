import { createBrowserRouter, Navigate } from 'react-router-dom';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import Dashboard from '@/pages/Dashboard';
import Properties from '@/pages/Properties';
import Tenants from '@/pages/Tenants';
import Payments from '@/pages/Payments';
import Maintenance from '@/pages/Maintenance';
import FinancialReports from '@/pages/FinancialReports';
import Settings from '@/pages/Settings';

const basename = '/rentala-property-management';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <SignUp />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/properties',
    element: <Properties />,
  },
  {
    path: '/tenants',
    element: <Tenants />,
  },
  {
    path: '/payments',
    element: <Payments />,
  },
  {
    path: '/maintenance',
    element: <Maintenance />,
  },
  {
    path: '/reports',
    element: <FinancialReports />,
  },
  {
    path: '/analytics',
    element: <Dashboard />,
  },
  {
    path: '/settings',
    element: <Settings />,
  },
  {
    path: '/profile',
    element: <Dashboard />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
], {
  basename: basename
});

export { router };
