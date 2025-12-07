import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { courseApi } from '@/courses/api';
import type { CourseWithEnrollment, Lesson } from '@/courses/types';

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseWithEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId, user?.id]);

  const loadCourse = async () => {
    if (!courseId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await courseApi.getCoursePublic(courseId, user?.id);
      setCourse(data);
    } catch (e) {
      const err = e as Error;
      if (err.message === 'NOT_FOUND') {
        setError('404 - Курс не найден');
      } else if (err.message === 'FORBIDDEN') {
        setError('Доступ к этому курсу ограничен');
      } else {
        setError('Не удалось загрузить страницу курса. Попробуйте позже');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      // Сохраняем текущий URL и перенаправляем на вход
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
      navigate('/login');
      return;
    }

    if (!courseId || !user?.id) return;

    setEnrolling(true);
    try {
      await courseApi.enrollCourse(courseId, user.id);
      // Перезагружаем курс чтобы обновить статус enrollment
      await loadCourse();
    } catch (e) {
      console.error('Failed to enroll:', e);
      alert('Не удалось записаться на курс. Попробуйте позже.');
    } finally {
      setEnrolling(false);
    }
  };

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!lesson.isDemoAvailable) {
      // Закрытый урок
      alert('Этот урок доступен только после записи на курс');
      return;
    }

    // Демо-урок: раскрываем или сворачиваем
    toggleLesson(lesson.id);
  };

  if (loading) {
    return (
      <div className="page-section">
        <div className="container">
          <div className="page-content" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p className="text-lg">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-section">
        <div className="container">
          <div className="page-content" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h1 style={{ color: 'var(--danger)', marginBottom: '1.5rem' }}>{error}</h1>
            <Link to="/" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0 2rem', height: '44px' }}>
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const isEnrolled = course.enrollment?.isEnrolled;

  return (
    <div className="page-section">
      <div className="container" style={{ maxWidth: '1280px' }}>
        {/* Шапка курса */}
        <div className="page-content" style={{ padding: '2.5rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'grid', gap: '3rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {/* Обложка */}
            <div style={{ flexShrink: 0 }}>
              {course.cover ? (
                <div
                  style={{
                    width: '100%',
                    maxWidth: '240px',
                    height: '240px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {course.cover.name}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    maxWidth: '240px',
                    height: '240px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '5rem',
                    fontWeight: 'bold',
                  }}
                >
                  {course.title.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Информация о курсе */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ marginBottom: '1.25rem' }}>{course.title}</h1>

              {/* Автор */}
              {course.author && (
                <Link
                  to={`/authors/${course.author.id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    padding: '0.625rem 1rem',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--bg-surface-soft)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 150ms ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {course.author.avatar ? (
                    <img
                      src={course.author.avatar}
                      alt={course.author.name}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {course.author.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-base" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                    {course.author.name}
                  </span>
                </Link>
              )}

              <p className="text-lg" style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                {course.description}
              </p>

              {/* Теги */}
              {course.tags && course.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', marginBottom: '1.5rem' }}>
                  {course.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="ai-badge"
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.9375rem',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Метаинформация */}
              <div
                style={{
                  display: 'flex',
                  gap: '2.5rem',
                  marginBottom: '2rem',
                  flexWrap: 'wrap',
                }}
              >
                {course.duration && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>⏱️</span>
                    <span className="text-base" style={{ color: 'var(--text-secondary)' }}>
                      {course.duration}
                    </span>
                  </div>
                )}
                {course.enrollmentsCount !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>👥</span>
                    <span className="text-base" style={{ color: 'var(--text-secondary)' }}>
                      {course.enrollmentsCount} участников
                    </span>
                  </div>
                )}
              </div>

              {/* Кнопка действия */}
              {isEnrolled ? (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/learning/${courseId}`)}
                  style={{ fontSize: '1rem', padding: '0 2rem', height: '48px' }}
                >
                  Перейти к обучению →
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleEnroll}
                  disabled={enrolling}
                  style={{ fontSize: '1rem', padding: '0 2rem', height: '48px' }}
                >
                  {enrolling ? 'Записываемся...' : 'Записаться на курс'}
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Содержание курса */}
      <div className="page-content" style={{ padding: '2.5rem' }}>
        <h2 style={{ marginBottom: '2rem' }}>Содержание курса</h2>

        {course.chapters.length === 0 ? (
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            Содержание курса еще не добавлено
          </p>
        ) : (
          course.chapters.map((chapter) => (
            <div key={chapter.id} style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>{chapter.title}</h3>
              {chapter.description && (
                <p className="text-base" style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  {chapter.description}
                </p>
              )}

              {chapter.lessons.map((lesson) => {
                const isExpanded = expandedLessons.has(lesson.id);
                const isDemoOrEnrolled = lesson.isDemoAvailable || isEnrolled;

                return (
                  <div
                    key={lesson.id}
                    style={{
                      marginBottom: '0.75rem',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      background: isExpanded ? 'var(--bg-surface-soft)' : 'transparent',
                      transition: 'all 150ms ease-out',
                    }}
                  >
                    <div
                      onClick={() => isDemoOrEnrolled && handleLessonClick(lesson)}
                      style={{
                        padding: '1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: isDemoOrEnrolled ? 'pointer' : 'default',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="text-base" style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                          {lesson.title}
                        </span>
                        {lesson.isDemoAvailable && !isEnrolled && (
                          <span
                            className="ai-badge"
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.625rem',
                              background: 'var(--success-soft)',
                              color: 'var(--success)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                            }}
                          >
                            Демо
                          </span>
                        )}
                        {!lesson.isDemoAvailable && !isEnrolled && (
                          <span style={{ fontSize: '1.125rem' }}>🔒</span>
                        )}
                      </div>
                      {isDemoOrEnrolled && (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      )}
                    </div>

                    {isExpanded && (
                      <div
                        style={{
                          padding: '0 1.25rem 1.25rem',
                          background: 'var(--bg-surface-soft)',
                        }}
                      >
                        {lesson.pages.length === 0 ? (
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            В этом {lesson.isDemoAvailable ? 'демо-' : ''}уроке пока нет страниц
                          </p>
                        ) : (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {lesson.pages.map((page, idx) => (
                              <li
                                key={page.id}
                                style={{
                                  padding: '0.75rem 0',
                                  borderBottom:
                                    idx < lesson.pages.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <span className="text-base">
                                  {idx + 1}. {page.title}
                                </span>
                                <span
                                  className="ai-badge"
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '0.25rem 0.625rem',
                                  }}
                                >
                                  {page.kind === 'theory' && 'Теория'}
                                  {page.kind === 'quiz' && 'Тест'}
                                  {page.kind === 'code' && 'Код'}
                                  {page.kind === 'detailed' && 'Задание'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {!isEnrolled && (
                          <div
                            style={{
                              marginTop: '1.25rem',
                              padding: '1.25rem',
                              background: 'rgba(99, 102, 241, 0.08)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid rgba(99, 102, 241, 0.2)',
                              textAlign: 'center',
                            }}
                          >
                            <p className="text-base" style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                              Записаться на курс, чтобы получить полный доступ и выполнять задания
                            </p>
                            <button
                              className="btn btn-primary"
                              onClick={handleEnroll}
                              style={{ fontSize: '0.9375rem', padding: '0 1.5rem', height: '40px' }}
                            >
                              Записаться на курс
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  </div>
  );
}
