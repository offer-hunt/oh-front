import { useState } from 'react';
import type { CourseFilters } from '@/courses/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string, filters: CourseFilters) => void;
  initialQuery?: string;
  initialFilters?: CourseFilters;
}

// Доступные фильтры
const FILTER_OPTIONS = {
  difficulty: ['Junior', 'Middle', 'Senior'],
  languages: ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'C#', 'Ruby'],
  technologies: ['React', 'Vue', 'Angular', 'Node.js', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis', 'GitLab CI/CD'],
  duration: ['1-5 часов', '5-10 часов', '10-20 часов', '20+ часов'],
};

export function SearchModal({ isOpen, onClose, onSearch, initialQuery = '', initialFilters = {} }: SearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CourseFilters>(initialFilters);

  if (!isOpen) return null;

  const toggleFilter = (category: keyof CourseFilters, value: string) => {
    setFilters((prev) => {
      const current = prev[category] || [];
      const newValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: newValues.length > 0 ? newValues : undefined };
    });
  };

  const hasAnyFilters = Object.values(filters).some((arr) => arr && arr.length > 0);

  const clearAllFilters = () => {
    setFilters({});
  };

  const handleSearch = () => {
    onSearch(query, filters);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showFilters) {
      handleSearch();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2rem 1rem',
        zIndex: 1000,
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="page-content"
        style={{
          width: '100%',
          maxWidth: '680px',
          padding: '2.5rem',
          margin: '2rem auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Поиск курсов</h2>

          {/* Поисковая строка */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Введите ключевые слова..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
              style={{
                width: '100%',
                paddingRight: '3.5rem',
                fontSize: '1rem',
                height: '48px',
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                color: 'var(--primary)',
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              aria-label="Поиск"
            >
              🔍
            </button>
          </div>
        </div>

        {/* Кнопки управления */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            onClick={() => setShowFilters(!showFilters)}
            style={{ height: '44px', fontSize: '0.9375rem' }}
          >
            {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
            {hasAnyFilters && ` (${Object.values(filters).flat().length})`}
          </button>

          {hasAnyFilters && (
            <button
              className="btn btn-ghost"
              onClick={clearAllFilters}
              style={{ color: 'var(--danger)', height: '44px', fontSize: '0.9375rem' }}
            >
              Сбросить все
            </button>
          )}
        </div>

        {/* Панель фильтров */}
        {showFilters && (
          <div style={{ marginBottom: '2rem' }}>
            {/* Сложность */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 className="text-base" style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Сложность
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {FILTER_OPTIONS.difficulty.map((level) => (
                  <button
                    key={level}
                    onClick={() => toggleFilter('difficulty', level)}
                    style={{
                      padding: '0.625rem 1.25rem',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-pill)',
                      background: filters.difficulty?.includes(level)
                        ? 'var(--primary)'
                        : 'rgba(15, 23, 42, 0.7)',
                      color: filters.difficulty?.includes(level)
                        ? 'var(--primary-text)'
                        : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.9375rem',
                      fontWeight: filters.difficulty?.includes(level) ? 500 : 400,
                      transition: 'all var(--transition-fast)',
                      boxShadow: filters.difficulty?.includes(level)
                        ? '0 0 0 1px rgba(129, 140, 248, 0.5)'
                        : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!filters.difficulty?.includes(level)) {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!filters.difficulty?.includes(level)) {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Языки программирования */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 className="text-base" style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Язык программирования
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {FILTER_OPTIONS.languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggleFilter('languages', lang)}
                    style={{
                      padding: '0.625rem 1.25rem',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-pill)',
                      background: filters.languages?.includes(lang)
                        ? 'var(--primary)'
                        : 'rgba(15, 23, 42, 0.7)',
                      color: filters.languages?.includes(lang)
                        ? 'var(--primary-text)'
                        : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.9375rem',
                      fontWeight: filters.languages?.includes(lang) ? 500 : 400,
                      transition: 'all var(--transition-fast)',
                      boxShadow: filters.languages?.includes(lang)
                        ? '0 0 0 1px rgba(129, 140, 248, 0.5)'
                        : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!filters.languages?.includes(lang)) {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!filters.languages?.includes(lang)) {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Технологии */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 className="text-base" style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Технологии
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {FILTER_OPTIONS.technologies.map((tech) => (
                  <button
                    key={tech}
                    onClick={() => toggleFilter('technologies', tech)}
                    style={{
                      padding: '0.625rem 1.25rem',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-pill)',
                      background: filters.technologies?.includes(tech)
                        ? 'var(--primary)'
                        : 'rgba(15, 23, 42, 0.7)',
                      color: filters.technologies?.includes(tech)
                        ? 'var(--primary-text)'
                        : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.9375rem',
                      fontWeight: filters.technologies?.includes(tech) ? 500 : 400,
                      transition: 'all var(--transition-fast)',
                      boxShadow: filters.technologies?.includes(tech)
                        ? '0 0 0 1px rgba(129, 140, 248, 0.5)'
                        : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!filters.technologies?.includes(tech)) {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!filters.technologies?.includes(tech)) {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            </div>

            {/* Длительность */}
            <div style={{ marginBottom: '0' }}>
              <h4 className="text-base" style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Длительность
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {FILTER_OPTIONS.duration.map((dur) => (
                  <button
                    key={dur}
                    onClick={() => toggleFilter('duration', dur)}
                    style={{
                      padding: '0.625rem 1.25rem',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-pill)',
                      background: filters.duration?.includes(dur)
                        ? 'var(--primary)'
                        : 'rgba(15, 23, 42, 0.7)',
                      color: filters.duration?.includes(dur)
                        ? 'var(--primary-text)'
                        : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.9375rem',
                      fontWeight: filters.duration?.includes(dur) ? 500 : 400,
                      transition: 'all var(--transition-fast)',
                      boxShadow: filters.duration?.includes(dur)
                        ? '0 0 0 1px rgba(129, 140, 248, 0.5)'
                        : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!filters.duration?.includes(dur)) {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!filters.duration?.includes(dur)) {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            style={{
              flex: 1,
              minWidth: '180px',
              height: '48px',
              fontSize: '1rem',
            }}
          >
            {query || hasAnyFilters ? 'Показать курсы' : 'Закрыть'}
          </button>
          <button
            className="btn btn-outline"
            onClick={onClose}
            style={{
              minWidth: '120px',
              height: '48px',
              fontSize: '1rem',
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
