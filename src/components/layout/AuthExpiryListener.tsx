import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/stores/auth';

export function AuthExpiryListener() {
  const clear = useAuth((s) => s.clear);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function onExpired() {
      clear();
      if (location.pathname !== '/login') {
        toast.error('Сессия истекла. Войдите заново.');
        navigate('/login?reason=expired', { replace: true, state: { from: location } });
      }
    }
    window.addEventListener('vs:session-expired', onExpired);
    return () => window.removeEventListener('vs:session-expired', onExpired);
  }, [clear, navigate, location]);

  return null;
}
