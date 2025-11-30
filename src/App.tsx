import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export default function App() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Если мы в редакторе курса, мы скрываем общую шапку,
  // так как у редактора своя панель инструментов.
  const isEditor = location.pathname.includes('/courses/') && location.pathname.split('/').length > 2 && !location.pathname.includes('/new');

  if (isEditor) {
    return <Outlet />;
  }

  return (
    <div className="flex flex-col h-full">
      <header className="app-nav">
        <div className="flex items-center">
          <div className="app-nav__logo">AI-Hunt</div>
          <nav className="app-nav__links">
            <Link to="/" className="app-nav__link">Главная</Link>
            {isAuthenticated && <Link to="/courses" className="app-nav__link">Курсы</Link>}
            <Link to="/protected" className="app-nav__link">Прогресс</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <span className="app-nav__user">
              <span style={{opacity: 0.5, marginRight: 8}}>Пользователь:</span>
              {user?.name || user?.email}
            </span>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Войти</Link>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-[var(--bg-app)]">
        <Outlet />
      </main>
    </div>
  );
}
