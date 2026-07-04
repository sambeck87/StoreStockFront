import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../../components/common';
import { api } from '../../api';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage('');
    setIsLoading(true);
    try {
      await api.resetPassword(email);
      setMessage('Se ha enviado un correo con las instrucciones para recuperar tu contraseña.');
    } catch (err) { setError(api.getErrorMessage(err)); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)] dark:bg-gray-950">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-sm">
        <div className="bg-[var(--color-surface)] dark:bg-gray-900 rounded-xl border border-[var(--color-border)] dark:border-gray-800 shadow-sm p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-accent)] mb-4 shadow-sm">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Recuperar Contraseña</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ingresa tu correo electrónico y te enviaremos las instrucciones.</p>
          </div>

          {message && <div className="mb-4 p-3 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">{message}</div>}
          {error && <div className="mb-4 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t('auth.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Instrucciones'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a Iniciar Sesión
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPasswordPage;
