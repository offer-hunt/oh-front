import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';
import { AuthLayout } from '@/auth/components/AuthLayout';

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
      <div className="oauth-buttons">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/login/email')}
          disabled={isLoading}
        >
          Войти с помощью email
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleGoogle}
          disabled={isLoading}
        >
          Войти через Google
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleGithub}
          disabled={isLoading}
        >
          Войти через GitHub
        </button>
      </div>
      <div className="auth-footer">
        <button
          type="button"
          className="btn btn-text auth-footer__link"
          onClick={() => navigate('/password/recovery')}
        >
          Восстановить пароль
        </button>
        <button
          type="button"
          className="btn btn-text auth-footer__link"
          onClick={() => navigate('/register')}
        >
          Зарегистрироваться
        </button>
      </div>
    </AuthLayout>
  );
}
