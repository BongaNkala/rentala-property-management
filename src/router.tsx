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
import Invoices from '@/pages/Invoices';
import Arrears from '@/pages/Arrears';
import Expenses from '@/pages/Expenses';
import Screening from '@/pages/Screening';

const basename = '/rentala-property-management';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
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
    path: '/invoices',
    element: <Invoices />,
  },
  {
    path: '/arrears',
    element: <Arrears />,
  },
  {
    path: '/expenses',
    element: <Expenses />,
  },
  {
    path: '/screening',
    element: <Screening />,
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
    element: <Navigate to="/reports" replace />,
  },
  {
    path: '/settings',
    element: <Settings />,
  },
  {
    path: '/profile',
    element: <Navigate to="/settings" replace />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
], {
  basename: basename
});

export { router };
