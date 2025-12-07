import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { courseApi } from '@/courses/api';
import type { CourseAuthor, CourseSummary } from '@/courses/types';
import { CourseCard } from '@/components/CourseCard';

export default function AuthorProfilePage() {
  const { authorId } = useParams<{ authorId: string }>();
  const [author, setAuthor] = useState<CourseAuthor | null>(null);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authorId) {
      loadAuthorData();
    }
  }, [authorId]);

  const loadAuthorData = async () => {
    if (!authorId) return;

    setLoading(true);
    setError(null);

    try {
      const [authorInfo, authorCourses] = await Promise.all([
        courseApi.getAuthorInfo(authorId),
        courseApi.getAuthorCourses(authorId),
      ]);

      setAuthor(authorInfo);
      setCourses(authorCourses);
    } catch (e) {
      const err = e as Error;
      if (err.message === 'NOT_FOUND') {
        setError('404 - Автор не найден');
      } else {
        setError('Не удалось загрузить профиль автора. Попробуйте позже');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '3rem' }}>
        <div className="page-content" style={{ textAlign: 'center', padding: '3rem' }}>
          <h1 style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</h1>
          <Link to="/" className="btn btn-primary">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  if (!author) {
    return null;
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {/* Профиль автора */}
      <div className="page-content" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {/* Аватар */}
          {author.avatar ? (
            <img
              src={author.avatar}
              alt={author.name}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                fontWeight: 'bold',
              }}
            >
              {author.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Информация */}
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>{author.name}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {author.email}
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
              <span>
                <strong>{courses.length}</strong> {courses.length === 1 ? 'курс' : 'курсов'}
              </span>
              <span>
                <strong>
                  {courses.reduce((sum, c) => sum + (c.enrollmentsCount || 0), 0)}
                </strong>{' '}
                участников
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Курсы автора */}
      <div>
        <h2 style={{ marginBottom: '1.5rem' }}>Курсы этого автора</h2>

        {courses.length === 0 ? (
          <div
            className="page-content"
            style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--text-secondary)',
            }}
          >
            <p>У этого автора пока нет других опубликованных курсов</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
