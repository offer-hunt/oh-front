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
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {/* Заголовок и поиск */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Каталог курсов</h1>
          {searchQuery && (
            <p style={{ color: 'var(--text-secondary)' }}>
              Результаты по запросу: "{searchQuery}"
            </p>
          )}
        </div>
        <button
          className="btn btn-outline"
          onClick={() => setIsSearchModalOpen(true)}
        >
          🔍 Поиск
        </button>
      </div>

      {/* Активные фильтры */}
      {(hasActiveFilters || searchQuery) && (
        <div
          style={{
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          {Object.entries(activeFilters).map(([category, values]) =>
            values?.map((value: string) => (
              <span
                key={`${category}-${value}`}
                className="ai-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--primary)',
                  color: 'white',
                  cursor: 'pointer',
                }}
                onClick={() => removeFilter(category as keyof CourseFilters, value)}
              >
                {value}
                <span style={{ fontWeight: 'bold' }}>×</span>
              </span>
            ))
          )}
          {(hasActiveFilters || searchQuery) && (
            <button
              className="btn btn-text"
              onClick={clearAllFilters}
              style={{ padding: '0.5rem', color: 'var(--error)' }}
            >
              Сбросить все
            </button>
          )}
        </div>
      )}

      {/* Контент */}
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-secondary)',
          }}
        >
          <p>Загрузка...</p>
        </div>
      ) : error ? (
        <div
          className="page-content"
          style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--error)',
          }}
        >
          <p>{error}</p>
        </div>
      ) : courses.length === 0 ? (
        <div
          className="page-content"
          style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-secondary)',
          }}
        >
          <p>
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
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
  );
}

