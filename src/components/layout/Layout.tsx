import { Link, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api';
import { Button } from '../common';
import { Sun, Moon, Globe, Store, Building2, Users, Package, LayoutDashboard, LogOut, Menu, X, Shield, ClipboardList } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function Layout() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, permissionResources } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [storeName, setStoreName] = useState<string | null>(() => localStorage.getItem('storeName'));

  useEffect(() => {
    if (user?.store_id) {
      api.getStore(user.store_id).then(store => {
        setStoreName(store.name);
        localStorage.setItem('storeName', store.name);
      }).catch(() => {});
    }
  }, [user?.store_id]);

  const canViewStore = user && (permissionResources['store']?.length ?? 0) > 0;
  const canViewBranches = user && (permissionResources['branch']?.length ?? 0) > 0;
  const canViewUsers = user && (permissionResources['user']?.length ?? 0) > 0;
  const canViewCategories = user && (
    (permissionResources['category']?.length ?? 0) > 0 ||
    (permissionResources['item']?.length ?? 0) > 0
  );
  const canViewInventory = user && (permissionResources['item']?.length ?? 0) > 0;
  const canViewPermissions = user && (
    (permissionResources['permission']?.length ?? 0) > 0 ||
    (permissionResources['role']?.length ?? 0) > 0 ||
    (permissionResources['global_permission']?.length ?? 0) > 0
  );

  const hasAnyPageAccess = canViewStore || canViewBranches || canViewUsers || canViewCategories || canViewInventory || canViewPermissions;

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', show: hasAnyPageAccess },
    { path: '/store', icon: Store, labelKey: 'nav.store', show: canViewStore },
    { path: '/branches', icon: Building2, labelKey: 'nav.branches', show: canViewBranches },
    { path: '/users', icon: Users, labelKey: 'nav.users', show: canViewUsers },
    { path: '/categories', icon: Package, labelKey: 'nav.categories', show: canViewCategories },
    { path: '/inventory', icon: ClipboardList, labelKey: 'nav.inventory', show: canViewInventory },
    { path: '/permissions', icon: Shield, labelKey: 'nav.permissions', show: canViewPermissions },
  ].filter(item => item.show);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const mobileSidebarVariants = {
    open: { x: 0, transition: { duration: 0.25, ease: 'easeInOut' as const } },
    closed: { x: '-100%', transition: { duration: 0.25, ease: 'easeInOut' as const } },
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] dark:bg-gray-950 lg:flex">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="colored" />
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={`hidden lg:flex flex-col bg-white dark:bg-gray-900 shrink-0 overflow-hidden ${
          sidebarOpen ? 'border-r border-[var(--color-border)] dark:border-gray-800' : ''
        }`}
      >
        <div className="h-16 flex items-center px-4 border-b border-[var(--color-border)] dark:border-gray-800 shrink-0 overflow-hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
              {storeName || t('app.name')}
            </span>
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin w-60">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] dark:bg-[var(--color-accent)]/20 dark:text-[var(--color-accent-light)]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.aside
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileSidebarVariants}
            className="fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-gray-900 shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--color-border)] dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{storeName || t('app.name')}</span>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] dark:bg-[var(--color-accent)]/20 dark:text-[var(--color-accent-light)]'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[var(--color-border)] dark:border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-medium shrink-0">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <LogOut className="w-4 h-4 mr-2" />
                {t('auth.logout')}
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-[var(--color-border)] dark:border-gray-800 sticky top-0 z-20">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={t('language.toggle')}
              >
                <Globe className="w-4 h-4" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={t('theme.toggle')}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
              <div className="hidden sm:flex items-center gap-3 ml-3 pl-3 border-l border-[var(--color-border)] dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-xs font-medium">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.full_name}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title={t('auth.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
