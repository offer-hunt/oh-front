import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { courseApi } from '@/courses/api';
import { CourseLearningShell } from '@/courses/components/CourseLearningShell';
import type { Course } from '@/courses/types';

export default function CourseLearningPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourse();
  }, [courseId, user?.id]);

  const loadCourse = async () => {
    if (!courseId || !user?.id) {
      setError('Не удалось загрузить курс');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Загрузить курс (публичная версия)
      const courseData = await courseApi.getCoursePublic(courseId, user.id);

      // 2. Проверить enrollment
      const enrollment = await courseApi.checkEnrollment(courseId, user.id);
      if (!enrollment.isEnrolled) {
        // Пользователь не записан на курс - редирект на страницу курса
        navigate(`/catalog/${courseId}`);
        return;
      }

      // 3. Инициализировать прогресс (если первый раз)
      await courseApi.getCourseProgress(courseId, user.id);

      setCourse(courseData);
    } catch (err) {
      const error = err as Error;
      if (error.message === 'FORBIDDEN') {
        navigate('/forbidden');
      } else if (error.message === 'NOT_FOUND') {
        setError('Курс не найден');
      } else {
        setError('Не удалось загрузить курс. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="container"
        style={{
          padding: '4rem 1rem',
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[var(--primary)] to-violet-600 flex items-center justify-center shadow-2xl shadow-[var(--primary)]/30 animate-pulse">
            <span className="text-5xl">📚</span>
          </div>
          <p className="text-lg text-[var(--text-secondary)]">Загрузка курса...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="container"
        style={{
          padding: '4rem 1rem',
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <span className="text-5xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Ошибка</h2>
          <p className="text-lg text-[var(--text-secondary)] mb-8">{error}</p>
          <button className="btn-outline" onClick={() => navigate('/')}>
            На главную
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return <CourseLearningShell course={course} userId={user!.id} />;
}
