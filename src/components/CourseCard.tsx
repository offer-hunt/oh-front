import { Link } from 'react-router-dom';
import type { CourseSummary } from '@/courses/types';

interface CourseCardProps {
  course: CourseSummary;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link
      to={`/catalog/${course.id}`}
      className="page-content"
      style={{
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 200ms ease-out',
        cursor: 'pointer',
        overflow: 'hidden',
        height: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(15, 23, 42, 0.95), 0 0 0 1px rgba(99, 102, 241, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
      }}
    >
      {/* Обложка курса */}
      {course.cover ? (
        <div
          style={{
            width: '100%',
            height: '180px',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {course.cover.name}
          </span>
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '180px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(79, 70, 229, 0.8) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '3.5rem',
            fontWeight: 'bold',
            letterSpacing: '-0.02em',
          }}
        >
          {course.title.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Контент карточки */}
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Автор */}
        {course.author && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '1rem',
            }}
          >
            {course.author.avatar ? (
              <img
                src={course.author.avatar}
                alt={course.author.name}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                }}
              />
            ) : (
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8125rem',
                  fontWeight: 'bold',
                }}
              >
                {course.author.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span
              className="text-sm"
              style={{
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              {course.author.name}
            </span>
          </div>
        )}

        {/* Название курса */}
        <h3
          style={{
            marginBottom: '0.75rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            lineHeight: '1.4',
            color: 'var(--text-primary)',
          }}
        >
          {course.title}
        </h3>

        {/* Описание */}
        {course.description && (
          <p
            className="text-sm"
            style={{
              color: 'var(--text-secondary)',
              marginBottom: '1.25rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.5',
            }}
          >
            {course.description}
          </p>
        )}

        {/* Теги */}
        {course.tags && course.tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            {course.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="ai-badge"
                style={{
                  fontSize: '0.8125rem',
                  padding: '0.375rem 0.75rem',
                }}
              >
                {tag}
              </span>
            ))}
            {course.tags.length > 3 && (
              <span
                className="text-xs"
                style={{
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.375rem 0.5rem',
                }}
              >
                +{course.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Метаинформация */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span className="text-sm" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span>👥</span>
            {course.enrollmentsCount !== undefined && course.enrollmentsCount > 0
              ? `${course.enrollmentsCount} участников`
              : 'Новый курс'}
          </span>
          {course.duration && (
            <span className="text-sm" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span>⏱️</span>
              {course.duration}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
