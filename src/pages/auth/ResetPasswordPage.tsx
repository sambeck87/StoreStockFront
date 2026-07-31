import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Input, PasswordRequirement } from '../../components/common';
import { api } from '../../api';
import { Lock, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password === passwordConfirmation && password.length > 0;
  const allRequirementsMet = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  useEffect(() => { if (!token) setError('Token de recuperación inválido'); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!allRequirementsMet) return;
    setIsLoading(true);
    try {
      await api.updatePassword(token!, password, passwordConfirmation);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) { setError(api.getErrorMessage(err)); }
    finally { setIsLoading(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)] dark:bg-gray-950">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
          <div className="bg-[var(--color-surface)] dark:bg-gray-900 rounded-xl border border-[var(--color-border)] dark:border-gray-800 shadow-sm p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Contraseña Actualizada</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Tu contraseña ha sido cambiada exitosamente. Serás redirigido al login...</p>
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-emerald-700 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              Ir a Iniciar Sesión
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)] dark:bg-gray-950">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-sm">
        <div className="bg-[var(--color-surface)] dark:bg-gray-900 rounded-xl border border-[var(--color-border)] dark:border-gray-800 shadow-sm p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-accent)] mb-4 shadow-sm">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Nueva Contraseña</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ingresa tu nueva contraseña</p>
          </div>

          {error && <div className="mb-4 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input label="Nueva Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
            <Button type="submit" className="w-full" disabled={isLoading || !token || !allRequirementsMet}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cambiar Contraseña'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-emerald-700 font-medium transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a Iniciar Sesión
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ResetPasswordPage;
