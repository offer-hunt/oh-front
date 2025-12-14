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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-nav" style={{ justifyContent: 'space-between' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '100%', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="app-nav__logo">AI-Hunt</div>
            <nav className="app-nav__links">
              <Link to="/" className="app-nav__link">Каталог</Link>
              {isAuthenticated && <Link to="/courses" className="app-nav__link">Мои курсы</Link>}
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isAuthenticated ? (
              <Link to="/profile" className="app-nav__user" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ opacity: 0.6 }}>👤</span>
                {user?.name || user?.email}
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">Войти</Link>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
