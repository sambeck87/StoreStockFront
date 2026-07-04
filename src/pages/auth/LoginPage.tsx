import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api';
import { Button, Input } from '../../components/common';
import { Store, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function LoginPage() {
  const { t } = useTranslation();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.store_id ? '/inventory' : '/store-select', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ email, password });
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        navigate(user.store_id ? '/inventory' : '/store-select');
      } else {
        navigate('/store-select');
      }
    } catch (err) {
      setError(api.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)] dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-accent)] mb-4 shadow-sm">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('app.name')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('auth.welcomeBack')}</p>
        </div>

        <div className="bg-[var(--color-surface)] dark:bg-gray-900 rounded-xl border border-[var(--color-border)] dark:border-gray-800 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <Input
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />

            <div>
              <Input
                label={t('auth.password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <div className="text-right mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs text-[var(--color-accent)] hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('auth.login')}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            {t('auth.noAccount')}{' '}
            <Link
              to="/register"
              className="text-[var(--color-accent)] hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors"
            >
              {t('auth.register')}
            </Link>
          </p>
        </div>

        <p className="text-center mt-6 text-xs text-gray-400 dark:text-gray-600">
          &copy; 2026 {t('app.name')}
        </p>
      </motion.div>
    </div>
  );
}

export default LoginPage;
