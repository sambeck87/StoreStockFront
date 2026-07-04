import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.confirmEmail(token).then(() => setStatus('success')).catch(() => setStatus('error'));
  }, [token]);

  useEffect(() => {
    if (status === 'success') { const t = setTimeout(() => navigate('/login'), 3000); return () => clearTimeout(t); }
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] dark:bg-gray-950 p-4">
      <div className="max-w-sm w-full bg-[var(--color-surface)] dark:bg-gray-900 rounded-xl border border-[var(--color-border)] dark:border-gray-800 shadow-sm p-8 text-center">
        {status === 'loading' && (
          <div>
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-accent)] mx-auto mb-4" />
            <p className="text-sm text-gray-500">Confirmando tu correo...</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-1">Correo confirmado</h2>
            <p className="text-sm text-gray-500 mb-4">Tu cuenta ha sido verificada exitosamente.</p>
            <p className="text-xs text-gray-400">Redireccionando al login...</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-1">Error</h2>
            <p className="text-sm text-gray-500 mb-4">El token es inválido o ha expirado.</p>
            <a href="/login" className="text-xs text-[var(--color-accent)] hover:text-emerald-700 font-medium">Ir al login</a>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConfirmEmailPage;
