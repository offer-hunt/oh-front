import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/auth/components/AuthLayout';

export default function AuthErrorPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const message = params.get('message') || 'Произошла неизвестная ошибка при входе.';

  return (
    <AuthLayout
      title="Ошибка входа"
      alert={<div className="alert alert--error">{message}</div>}
      centered
      footer={
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/login')}
        >
          Вернуться на страницу входа
        </button>
      }
    >
      <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>
        Попробуйте войти еще раз или используйте другой способ входа.
      </p>
    </AuthLayout>
  );
}