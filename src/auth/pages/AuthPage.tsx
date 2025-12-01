import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';
import { AuthLayout } from '@/auth/components/AuthLayout';
import { Icons } from '@/components/Icons';

export default function AuthPage() {
  const navigate = useNavigate();
  const { loginWithProvider, error, isLoading } = useAuth();

  const handleGoogle = async () => {
    try {
      await loginWithProvider('google');
      navigate('/protected', { replace: true });
    } catch {
      // ошибка уже показана в error
    }
  };

  const handleGithub = async () => {
    try {
      await loginWithProvider('github');
      navigate('/protected', { replace: true });
    } catch {
      //
    }
  };

  return (
    <AuthLayout
      title="Вход в профиль"
      subtitle="Выберите способ входа"
      alert={
        error && (
          <div className="alert alert--error" data-testid="auth-error">
            {error}
          </div>
        )
      }
    >
      <div 
        className="oauth-buttons" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem', 
          width: '100%' 
        }}
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/login/email')}
          disabled={isLoading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem' }}
        >
          <Icons.Mail />
          <span>Войти с помощью email</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ padding: '0 10px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>или</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleGoogle}
          disabled={isLoading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem' }}
        >
          <Icons.Google />
          <span>Войти через Google</span>
        </button>
        
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleGithub}
          disabled={isLoading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem' }}
        >
          <Icons.GitHub />
          <span>Войти через GitHub</span>
        </button>
      </div>

      <div className="auth-footer" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-text"
          style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}
          onClick={() => navigate('/password/recovery')}
        >
          Забыли пароль?
        </button>
        
        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Нет аккаунта?{' '}
          <button
            type="button"
            className="btn btn-text"
            style={{ fontWeight: 600, color: 'var(--primary)' }}
            onClick={() => navigate('/register')}
          >
            Зарегистрироваться
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}