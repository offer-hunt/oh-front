import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export default function Callback() {
  const { setSessionFromToken } = useAuth();
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash; // #access_token=...&refresh_token=...
    if (!hash.startsWith('#')) {
      navigate('/login');
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      // Чистим URL, чтобы токены не висели в браузере
      window.history.replaceState(null, '', window.location.pathname);
      
      setSessionFromToken(accessToken, refreshToken)
        .then(() => {
          const to = sessionStorage.getItem('post_login_redirect') || '/';
          sessionStorage.removeItem('post_login_redirect');
          navigate(to, { replace: true });
        })
        .catch(() => {
          navigate('/auth/error?message=Failed to process tokens');
        });
    } else {
      navigate('/auth/error?message=No tokens received');
    }
  }, [navigate, setSessionFromToken]);

  return (
    <div className="container" style={{ textAlign: 'center', marginTop: '20vh' }}>
      <h2>Авторизация...</h2>
      <p>Пожалуйста, подождите, мы настраиваем ваш профиль.</p>
    </div>
  );
}