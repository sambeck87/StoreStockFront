import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './utils/routes';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { StoreSelectPage } from './pages/auth/StoreSelectPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ConfirmEmailPage } from './pages/auth/ConfirmEmailPage';
import { BranchDetailPage } from './pages/home/BranchDetailPage';
import { CategoryItemsPage } from './pages/home/CategoryItemsPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { StorePage } from './pages/dashboard/StorePage';
import { BranchesPage } from './pages/dashboard/BranchesPage';
import { UsersPage } from './pages/dashboard/UsersPage';
import { UserDetailPage } from './pages/dashboard/UserDetailPage';
import { CategoriesPage } from './pages/dashboard/CategoriesPage';
import { InventoryPage } from './pages/dashboard/InventoryPage';
import { PermissionsPage } from './pages/dashboard/PermissionsPage';
import './i18n';

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
                <Route path="/branches/:id" element={<BranchDetailPage />} />
                <Route path="/categories/:id/items" element={<CategoryItemsPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/store" element={<StorePage />} />
                <Route path="/branches" element={<BranchesPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/:id" element={<UserDetailPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/permissions" element={<PermissionsPage />} />
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
