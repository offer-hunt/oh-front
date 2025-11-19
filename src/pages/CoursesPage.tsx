import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { courseApi } from '@/courses/api';
import type { CourseSummary } from '@/courses/types';

export default function CoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseApi.listCourses(user?.id)
        .then(setCourses)
        .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Мои курсы</h1>
        <button className="btn btn-primary" onClick={() => navigate('/courses/new')}>+ Создать курс</button>
      </div>

      {loading ? (
          <p>Загрузка...</p>
      ) : courses.length === 0 ? (
          <div className="page-content" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>У вас еще нет курсов.</p>
              <button className="btn btn-outline" onClick={() => navigate('/courses/new')}>Создать первый курс</button>
          </div>
      ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {courses.map(course => (
                  <div key={course.id} className="page-content" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ marginBottom: '0.5rem' }}>{course.title}</h3>
                      <div style={{ marginBottom: '1rem' }}>
                          <span className={`ai-badge`} style={{ background: course.status === 'published' ? 'var(--success)' : 'var(--text-secondary)' }}>
                              {course.status === 'published' ? 'Опубликован' : 'Черновик'}
                          </span>
                      </div>
                      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <span>Уроков: {course.lessonsCount}</span>
                          <Link to={`/courses/${course.id}`} className="btn btn-text" style={{ padding: '0' }}>Редактировать →</Link>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}
