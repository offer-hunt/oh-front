import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';

export default function Protected() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container">
      <h1 className="progress-page__title">Мониторинг прогресса обучения</h1>
      <div className="progress-page__user">
        {user ? (
          <>
            Пользователь: <strong>{user.name || user.email}</strong> ({user.provider})
          </>
        ) : (
          'Данные пользователя недоступны.'
        )}
      </div>
      <p>
        Здесь может отображаться прогресс по курсам, статистика выполненных заданий и другие
        данные, доступные только авторизованному пользователю.
      </p>
      <button type="button" className="btn btn-outline" onClick={handleLogout}>
        Выйти
      </button>
    </div>
  );
}
