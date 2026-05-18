import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (!token) { navigate('/login'); return; }

    localStorage.setItem('token', token);
    api.get('/auth/me').then(({ data }) => {
      // New backend returns { success, user }, old returns user directly
      const user = data?.user ?? data;
      localStorage.setItem('user', JSON.stringify(user));
      if (user.role === 'student') navigate('/app/dashboard', { replace: true });
      else if (user.role === 'provider' || user.role === 'organization') navigate('/app/provider', { replace: true });
      else navigate('/app/admin', { replace: true });
    }).catch(() => {
      localStorage.removeItem('token');
      navigate('/login');
    });
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mb-4" />
        <p className="text-surface-500 text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
