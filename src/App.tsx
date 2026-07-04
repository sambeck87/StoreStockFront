import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './utils/routes';
import { PageLoader } from './components/common/PageLoader';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ConfirmEmailPage } from './pages/auth/ConfirmEmailPage';
import { StoreSelectPage } from './pages/auth/StoreSelectPage';
import './i18n';

const BranchDetailPage = lazy(() => import('./pages/home/BranchDetailPage'));
const CategoryItemsPage = lazy(() => import('./pages/home/CategoryItemsPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const StorePage = lazy(() => import('./pages/dashboard/StorePage'));
const BranchesPage = lazy(() => import('./pages/dashboard/BranchesPage'));
const UsersPage = lazy(() => import('./pages/dashboard/UsersPage'));
const UserDetailPage = lazy(() => import('./pages/dashboard/UserDetailPage'));
const CategoriesPage = lazy(() => import('./pages/dashboard/CategoriesPage'));
const InventoryPage = lazy(() => import('./pages/dashboard/InventoryPage'));
const PermissionsPage = lazy(() => import('./pages/dashboard/PermissionsPage'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/confirm-email" element={<ConfirmEmailPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/store-select" element={<StoreSelectPage />} />
              <Route element={<Layout />}>
                <Route path="/branches/:id" element={<Suspense fallback={<PageLoader />}><BranchDetailPage /></Suspense>} />
                <Route path="/categories/:id/items" element={<Suspense fallback={<PageLoader />}><CategoryItemsPage /></Suspense>} />
                <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
                <Route path="/store" element={<Suspense fallback={<PageLoader />}><StorePage /></Suspense>} />
                <Route path="/branches" element={<Suspense fallback={<PageLoader />}><BranchesPage /></Suspense>} />
                <Route path="/users" element={<Suspense fallback={<PageLoader />}><UsersPage /></Suspense>} />
                <Route path="/users/:id" element={<Suspense fallback={<PageLoader />}><UserDetailPage /></Suspense>} />
                <Route path="/categories" element={<Suspense fallback={<PageLoader />}><CategoriesPage /></Suspense>} />
                <Route path="/inventory" element={<Suspense fallback={<PageLoader />}><InventoryPage /></Suspense>} />
                <Route path="/permissions" element={<Suspense fallback={<PageLoader />}><PermissionsPage /></Suspense>} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/inventory" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
