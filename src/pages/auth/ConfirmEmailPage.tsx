import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    api.confirmEmail(token)
      .then(() => {
        setStatus('success');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [token]);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => navigate('/login'), 3000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Confirmando tu correo...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Correo confirmado</h2>
            <p className="text-gray-600 mb-4">Tu cuenta ha sido verificada exitosamente.</p>
            <p className="text-sm text-gray-500">Redireccionando al login...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">✕</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">El token es inválido o ha expirado.</p>
            <a href="/login" className="text-blue-600 hover:underline">Ir al login</a>
          </>
        )}
      </div>
    </div>
  );
}