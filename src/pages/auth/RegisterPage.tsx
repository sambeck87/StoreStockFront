import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/common';
import { Store, Loader2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${met ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{text}</span>
    </div>
  );
}

export function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password === passwordConfirmation && password.length > 0;
  const allRequirementsMet = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== passwordConfirmation) { setError('Las contraseñas no coinciden'); return; }
    setIsLoading(true);
    try {
      await register({ full_name: name, email, password, password_confirmation: password });
      setSuccess(t('auth.registerSuccess'));
      setName(''); setEmail(''); setPassword(''); setPasswordConfirmation('');
    } catch { setError(t('auth.registerError')); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)] dark:bg-gray-950">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-accent)] mb-4 shadow-sm">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('auth.register')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('auth.welcomeBack')}</p>
        </div>

        <div className="bg-[var(--color-surface)] dark:bg-gray-900 rounded-xl border border-[var(--color-border)] dark:border-gray-800 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">{error}</div>}
            {success && <div className="p-3 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">{success}</div>}

            <Input label={t('auth.name')} type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label={t('auth.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required />

            <div>
              <Input label={t('auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {password && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 space-y-1">
                  <PasswordRequirement met={hasMinLength} text="Mínimo 8 caracteres" />
                  <PasswordRequirement met={hasUppercase} text="Una letra mayúscula" />
                  <PasswordRequirement met={hasLowercase} text="Una letra minúscula" />
                  <PasswordRequirement met={hasNumber} text="Un número" />
                </motion.div>
              )}
            </div>

            <div>
              <Input label="Confirmar Contraseña" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required />
              {passwordConfirmation && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                  <PasswordRequirement met={passwordsMatch} text="Las contraseñas coinciden" />
                </motion.div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !allRequirementsMet}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('auth.register')}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-[var(--color-accent)] hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors">{t('auth.login')}</Link>
          </p>
        </div>

        <p className="text-center mt-6 text-xs text-gray-400 dark:text-gray-600">&copy; 2026 {t('app.name')}</p>
      </motion.div>
    </div>
  );
}

export default RegisterPage;
