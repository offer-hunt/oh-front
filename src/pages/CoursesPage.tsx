import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';
import { courseApi } from '@/courses/api';
import type { CourseSummary } from '@/courses/types';

function formatStatus(status: CourseSummary['status']): string {
  switch (status) {
    case 'draft':
      return 'Черновик';
    case 'published':
      return 'Опубликован';
    case 'archived':
      return 'Архивирован';
    default:
      return status;
  }
}

export default function CoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await courseApi.listCourses(user?.id);
        if (isMounted) {
          setCourses(data);
        }
      } catch (e) {
        if (isMounted) {
          setError('Не удалось загрузить курсы.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleCreate = () => {
    navigate('/courses/new');
  };

  return (
    <div className="container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h1>Мои курсы</h1>
        <button type="button" className="btn btn-primary" onClick={handleCreate}>
          Создать курс
        </button>
      </div>

      {isLoading && <p>Загрузка курсов…</p>}

      {error && <div className="alert alert--error">{error}</div>}

      {!isLoading && !error && courses.length === 0 && (
        <p>У вас пока нет курсов. Нажмите «Создать курс», чтобы добавить первый.</p>
      )}

      {!isLoading && !error && courses.length > 0 && (
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Название</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Статус</th>
              <th style={{ textAlign: 'right', padding: '0.5rem' }}>Уроки / страницы</th>
              <th style={{ textAlign: 'right', padding: '0.5rem' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td style={{ padding: '0.5rem' }}>
                  <Link to={`/courses/${c.id}`} className="app-nav__link">
                    {c.title}
                  </Link>
                </td>
                <td style={{ padding: '0.5rem' }}>{formatStatus(c.status)}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                  {c.lessonsCount} / {c.pagesCount}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                  <Link to={`/courses/${c.id}`} className="btn btn-outline">
                    Редактировать
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
