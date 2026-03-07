import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './utils/routes';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { StoreSelectPage } from './pages/auth/StoreSelectPage';
import { HomePage } from './pages/home/HomePage';
import { BranchDetailPage } from './pages/home/BranchDetailPage';
import { CategoryDetailPage } from './pages/home/CategoryDetailPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { StoresPage } from './pages/dashboard/StoresPage';
import { BranchesPage } from './pages/dashboard/BranchesPage';
import { UsersPage } from './pages/dashboard/UsersPage';
import { CategoriesPage } from './pages/dashboard/CategoriesPage';
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
            <Route element={<ProtectedRoute />}>
              <Route path="/store-select" element={<StoreSelectPage />} />
              <Route element={<Layout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/branches/:id" element={<BranchDetailPage />} />
                <Route path="/categories/:id" element={<CategoryDetailPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/stores" element={<StoresPage />} />
                <Route path="/branches" element={<BranchesPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/permissions" element={<PermissionsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
