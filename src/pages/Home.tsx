import { useEffect, useState } from 'react';
import { courseApi } from '@/courses/api';
import type { CourseSummary, CourseFilters } from '@/courses/types';
import { CourseCard } from '@/components/CourseCard';
import { SearchModal } from '@/components/SearchModal';

export default function Home() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<CourseFilters>({});
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async (query?: string, filters?: CourseFilters) => {
    setLoading(true);
    setError(null);
    try {
      const results = await courseApi.searchCourses({
        q: query,
        filters,
      });
      setCourses(results);
    } catch (e) {
      console.error('Failed to load courses:', e);
      setError('Ошибка отображения каталога курсов. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string, filters: CourseFilters) => {
    setSearchQuery(query);
    setActiveFilters(filters);
    loadCourses(query, filters);
  };

  const removeFilter = (category: keyof CourseFilters, value: string) => {
    const newFilters = { ...activeFilters };
    if (newFilters[category]) {
      newFilters[category] = newFilters[category]!.filter((v) => v !== value);
      if (newFilters[category]!.length === 0) {
        delete newFilters[category];
      }
    }
    setActiveFilters(newFilters);
    loadCourses(searchQuery, newFilters);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveFilters({});
    loadCourses();
  };

  const hasActiveFilters = Object.values(activeFilters).some(
    (arr) => arr && arr.length > 0
  );

  return (
    <div className="page-section">
      <div className="container">
        {/* Заголовок и поиск */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '2.5rem',
            gap: '2rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 auto', minWidth: '250px' }}>
            <h1 style={{ marginBottom: '0.75rem' }}>Каталог курсов</h1>
            {searchQuery && (
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                Результаты по запросу: <strong>"{searchQuery}"</strong>
              </p>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setIsSearchModalOpen(true)}
            style={{ fontSize: '1rem', padding: '0 1.5rem', height: '44px' }}
          >
            <span style={{ marginRight: '0.5rem' }}>🔍</span>
            Поиск и фильтры
          </button>
        </div>

        {/* Активные фильтры */}
        {(hasActiveFilters || searchQuery) && (
          <div
            style={{
              marginBottom: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            {Object.entries(activeFilters).map(([category, values]) =>
              values?.map((value: string) => (
                <button
                  key={`${category}-${value}`}
                  className="ai-badge"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 150ms ease-out',
                    fontSize: '0.9375rem',
                    padding: '0.5rem 1rem',
                  }}
                  onClick={() => removeFilter(category as keyof CourseFilters, value)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {value}
                  <span style={{ marginLeft: '0.5rem', fontWeight: 'bold', fontSize: '1.125rem' }}>×</span>
                </button>
              ))
            )}
            {(hasActiveFilters || searchQuery) && (
              <button
                className="btn btn-ghost"
                onClick={clearAllFilters}
                style={{ color: 'var(--danger)', padding: '0.5rem 1rem' }}
              >
                Сбросить все
              </button>
            )}
          </div>
        )}

        {/* Контент */}
        {loading ? (
          <div className="page-content"
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
            }}
          >
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Загрузка...</p>
          </div>
        ) : error ? (
          <div
            className="page-content"
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
            }}
          >
            <p className="text-lg" style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        ) : courses.length === 0 ? (
          <div
            className="page-content"
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
            }}
          >
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              {searchQuery || hasActiveFilters
                ? hasActiveFilters && searchQuery
                  ? 'По вашему запросу и фильтрам ничего не найдено.'
                  : searchQuery
                  ? 'Такого у нас ещё нет. Попробуйте изменить запрос.'
                  : 'По таким параметрам курсов нет. Попробуйте изменить фильтры.'
                : 'Курсов пока нет. Возвращайтесь к нам позже)'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '2rem',
            }}
          >
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {/* Модальное окно поиска */}
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onSearch={handleSearch}
          initialQuery={searchQuery}
          initialFilters={activeFilters}
        />
      </div>
    </div>
  );
}

