import { Link, Outlet } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';

export default function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <>
      <header className="app-nav">
        <div className="app-nav__logo">AI-Hunt</div>
        <nav className="app-nav__links">
          <Link to="/" className="app-nav__link">
            Главная
          </Link>

          {isAuthenticated && (
            <Link to="/courses" className="app-nav__link">
              Курсы
            </Link>
          )}

          <Link to="/protected" className="app-nav__link">
            Прогресс
          </Link>

          {isAuthenticated ? (
            <span className="app-nav__user">👤 {user?.name || user?.email}</span>
          ) : (
            <Link to="/login" className="app-nav__link">
              Войти
            </Link>
          )}
        </nav>
      </header>
      <Outlet />
    </>
  );
}
