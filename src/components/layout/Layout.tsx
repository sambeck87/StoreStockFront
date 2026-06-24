import { Link, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common';
import { Sun, Moon, Globe, Store, Building2, Users, Package, LayoutDashboard, LogOut, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Layout() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, permissionResources } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  console.log('Layout - permissionResources:', permissionResources);

  const canViewStoreOrUsers = user && (
    (permissionResources['store']?.includes('update') ?? false) ||
    (permissionResources['user']?.length ?? 0) > 0
  );
  const canViewBranches = user && (permissionResources['branch']?.length ?? 0) > 0;
  const canViewUsers = user && (permissionResources['user']?.length ?? 0) > 0;
  const canViewCategories = user && (
    (permissionResources['category']?.length ?? 0) > 0 ||
    (permissionResources['item']?.length ?? 0) > 0
  );
  const canViewPermissions = user && (
    (permissionResources['permission']?.length ?? 0) > 0 || 
    (permissionResources['role']?.length ?? 0) > 0 || 
    (permissionResources['global_permission']?.length ?? 0) > 0
  );

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', show: canViewStoreOrUsers },
    { path: '/store', icon: Store, labelKey: 'nav.store', show: canViewStoreOrUsers },
    { path: '/branches', icon: Building2, labelKey: 'nav.branches', show: canViewBranches },
    { path: '/users', icon: Users, labelKey: 'nav.users', show: canViewUsers },
    { path: '/categories', icon: Package, labelKey: 'nav.categories', show: canViewCategories },
    { path: '/permissions', icon: Shield, labelKey: 'nav.permissions', show: canViewPermissions },
  ].filter(item => item.show);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="px-4 mx-auto max-w-7xl">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t('app.name')}
              </Link>
              <div className="hidden md:flex gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location.pathname.startsWith(item.path)
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-md'
                    }`}
                  >
                    <item.icon className="w-4 h-4 inline-block mr-2" />
                    {t(item.labelKey)}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleLanguage} title={t('language.toggle')} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                <Globe className="w-5 h-5" />
                <span className="ml-1 text-xs font-medium">{i18n.language.toUpperCase()}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleTheme} title={t('theme.toggle')} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-500" />}
              </Button>
              <div className="hidden md:flex items-center gap-2 ml-2 pl-4 border-l border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.full_name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout} className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-700"
            >
              <div className="px-4 py-3 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      location.pathname.startsWith(item.path)
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {t(item.labelKey)}
                  </Link>
                ))}
                <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.full_name}</span>
                  <Button variant="ghost" size="sm" onClick={logout} className="ml-auto text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-1" />
                    {t('auth.logout')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      <main className="p-6 mx-auto max-w-7xl">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
