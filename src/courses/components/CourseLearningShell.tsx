import { useState, useEffect } from 'react';
import type {
  Course,
  LessonPage,
  CourseProgress,
  QuizEvaluationResult,
  CodeEvaluationResult,
  DetailedEvaluationResult,
  SupportedLanguage,
} from '@/courses/types';
import { Icons } from '@/components/Icons';
import { courseApi } from '@/courses/api';
import { TheoryPageView } from './pageViews/TheoryPageView';
import { QuizPageView } from './pageViews/QuizPageView';
import { CodePageView } from './pageViews/CodePageView';
import { DetailedPageView } from './pageViews/DetailedPageView';

// Конфигурация типов страниц
const PAGE_TYPE_CONFIG = {
  theory: { icon: '📄', label: 'Теория', color: '#6366f1' },
  quiz: { icon: '❓', label: 'Тест', color: '#f59e0b' },
  code: { icon: '💻', label: 'Код', color: '#10b981' },
  detailed: { icon: '✍️', label: 'Задание', color: '#8b5cf6' },
};

interface SubmissionResults {
  quiz?: QuizEvaluationResult;
  code?: CodeEvaluationResult;
  detailed?: DetailedEvaluationResult;
}

interface CourseLearningShellProps {
  course: Course;
  userId: string;
}

export function CourseLearningShell({ course, userId }: CourseLearningShellProps) {
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [submissionResults, setSubmissionResults] = useState<Record<string, SubmissionResults>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const lessonsCount = course.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
  const pagesCount = course.chapters.reduce(
    (acc, ch) => acc + ch.lessons.reduce((sum, l) => sum + l.pages.length, 0),
    0
  );

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, [course.id, userId]);

  // Auto-select first page or last accessed page and expand first chapter
  useEffect(() => {
    if (!activePageId && progress) {
      // If user has last accessed page, use it
      if (progress.lastPageId) {
        setActivePageId(progress.lastPageId);
        // Find and expand chapter containing this page
        for (const ch of course.chapters) {
          for (const l of ch.lessons) {
            if (l.pages.find((p) => p.id === progress.lastPageId)) {
              setExpandedChapters(new Set([ch.id]));
              return;
            }
          }
        }
      } else {
        // Otherwise select first page
        for (const ch of course.chapters) {
          for (const l of ch.lessons) {
            if (l.pages[0]) {
              setActivePageId(l.pages[0].id);
              setExpandedChapters(new Set([ch.id]));
              return;
            }
          }
        }
      }
    }
  }, [course, activePageId, progress]);

  const loadProgress = async () => {
    try {
      const data = await courseApi.getCourseProgress(course.id, userId);
      setProgress(data);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const toggleChapter = (chId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chId)) {
        next.delete(chId);
      } else {
        next.add(chId);
      }
      return next;
    });
  };

  // Find active page data
  let activePage: LessonPage | null = null;
  let activeLesson = null;
  let activeChapter = null;
  let currentPageIndex = 0;
  let totalIndex = 0;

  for (const ch of course.chapters) {
    for (const l of ch.lessons) {
      for (const p of l.pages) {
        if (p.id === activePageId) {
          activePage = p;
          activeLesson = l;
          activeChapter = ch;
          currentPageIndex = totalIndex;
        }
        totalIndex++;
      }
    }
  }

  const isPageCompleted = (pageId: string): boolean => {
    return progress?.pageProgress[pageId]?.status === 'completed';
  };

  const getPageScore = (pageId: string): number | undefined => {
    return progress?.pageProgress[pageId]?.score;
  };

  const goToNextPage = () => {
    const allPages = course.chapters.flatMap((ch) => ch.lessons.flatMap((l) => l.pages));
    const currentIndex = allPages.findIndex((p) => p.id === activePageId);
    if (currentIndex < allPages.length - 1) {
      setActivePageId(allPages[currentIndex + 1].id);
    }
  };

  const handleTheoryComplete = async () => {
    if (!activePageId) return;

    try {
      await courseApi.updateProgress(course.id, userId, activePageId, 'completed');
      await loadProgress();
      goToNextPage();
    } catch (error) {
      console.error('Failed to complete theory page:', error);
    }
  };

  const handleQuizSubmit = async (selectedOptionIds: string[]) => {
    if (!activePageId) return;

    setIsSubmitting(true);
    try {
      const result = await courseApi.submitQuiz(course.id, userId, activePageId, selectedOptionIds);
      setSubmissionResults((prev) => ({
        ...prev,
        [activePageId]: { quiz: result },
      }));
      await loadProgress();

      // Auto-advance if passed
      if (result.status === 'passed') {
        setTimeout(() => {
          goToNextPage();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSubmit = async (code: string, language: SupportedLanguage) => {
    if (!activePageId) return;

    setIsSubmitting(true);
    try {
      const result = await courseApi.submitCode(course.id, userId, activePageId, code, language);
      setSubmissionResults((prev) => ({
        ...prev,
        [activePageId]: { code: result },
      }));
      await loadProgress();

      // Auto-advance if passed
      if (result.status === 'passed') {
        setTimeout(() => {
          goToNextPage();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit code:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailedSubmit = async (answer: string) => {
    if (!activePageId) return;

    setIsSubmitting(true);
    try {
      const result = await courseApi.submitDetailed(course.id, userId, activePageId, answer);
      setSubmissionResults((prev) => ({
        ...prev,
        [activePageId]: { detailed: result },
      }));
      await loadProgress();

      // Auto-advance if passed
      if (result.status === 'passed') {
        setTimeout(() => {
          goToNextPage();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit detailed answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPage = (direction: 'prev' | 'next') => {
    const allPages = course.chapters.flatMap((ch) => ch.lessons.flatMap((l) => l.pages));
    const currentIndex = allPages.findIndex((p) => p.id === activePageId);
    if (direction === 'prev' && currentIndex > 0) {
      setActivePageId(allPages[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < allPages.length - 1) {
      setActivePageId(allPages[currentIndex + 1].id);
    }
  };

  const progressPercentage = progress?.completionPercentage || 0;
  const completedCount = progress
    ? Object.values(progress.pageProgress).filter((p) => p.status === 'completed').length
    : 0;

  // Если курс пустой
  if (pagesCount === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div style={{ textAlign: 'center', maxWidth: '480px', padding: '2rem' }}>
          <div
            style={{
              width: '96px',
              height: '96px',
              margin: '0 auto 2rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--primary-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
            }}
          >
            📚
          </div>
          <h2 className="text-h2" style={{ marginBottom: '1rem' }}>
            Курс пока пустой
          </h2>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            Этот курс ещё не содержит учебных материалов.
          </p>
        </div>
      </div>
    );
  }

  const pageConfig = activePage ? PAGE_TYPE_CONFIG[activePage.kind] : null;

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div
        className="sidebar"
        style={{
          width: sidebarCollapsed ? '64px' : '320px',
          transition: 'width 220ms ease-out',
        }}
      >
        {/* Sidebar header */}
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {!sidebarCollapsed && (
            <div style={{ flex: 1, minWidth: 0, marginRight: '0.5rem' }}>
              <div className="text-sm" style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {course.title}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {lessonsCount} уроков • {pagesCount} страниц
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="btn-icon"
            title={sidebarCollapsed ? 'Развернуть' : 'Свернуть'}
          >
            <Icons.ChevronDown width={16} style={{ transform: sidebarCollapsed ? 'rotate(-90deg)' : 'rotate(90deg)' }} />
          </button>
        </div>

        {/* Progress card */}
        {!sidebarCollapsed && (
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-soft)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="text-sm" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Прогресс
                </span>
                <span className="text-base" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {progressPercentage}%
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-pill)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercentage}%`,
                    background: 'linear-gradient(to right, var(--primary), var(--primary-hover))',
                    borderRadius: 'var(--radius-pill)',
                    transition: 'width 400ms ease-out',
                  }}
                />
              </div>
              <p className="text-xs" style={{ marginTop: '0.75rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                {completedCount} из {pagesCount} завершено
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="sidebar-scroll">
          {course.chapters.map((ch, chIdx) => {
            const isExpanded = expandedChapters.has(ch.id);
            const chapterPages = ch.lessons.flatMap((l) => l.pages);
            const completedInChapter = chapterPages.filter((p) => isPageCompleted(p.id)).length;
            const chapterProgress =
              chapterPages.length > 0 ? Math.round((completedInChapter / chapterPages.length) * 100) : 0;

            return (
              <div key={ch.id} style={{ marginBottom: '0.75rem' }}>
                {/* Chapter button */}
                <button
                  onClick={() => toggleChapter(ch.id)}
                  className="tree-item"
                  style={{
                    width: '100%',
                    background: isExpanded ? 'var(--primary-soft)' : 'transparent',
                    color: isExpanded ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {!sidebarCollapsed ? (
                    <>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-sm)',
                          background: isExpanded ? 'var(--primary)' : 'var(--bg-surface-soft)',
                          color: isExpanded ? 'white' : 'var(--text-tertiary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          marginRight: '0.75rem',
                        }}
                      >
                        {chIdx + 1}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.125rem' }}>{ch.title}</div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {ch.lessons.length} уроков • {chapterProgress}%
                        </div>
                      </div>
                      <Icons.ChevronDown
                        width={14}
                        style={{
                          transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 150ms',
                          color: 'var(--text-tertiary)',
                        }}
                      />
                    </>
                  ) : (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-sm)',
                        background: isExpanded ? 'var(--primary)' : 'var(--bg-surface-soft)',
                        color: isExpanded ? 'white' : 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {chIdx + 1}
                    </div>
                  )}
                </button>

                {/* Lessons */}
                {isExpanded && !sidebarCollapsed && (
                  <div style={{ marginTop: '0.5rem', marginLeft: '0.75rem', paddingLeft: '0.75rem', borderLeft: '2px solid var(--border-subtle)' }}>
                    {ch.lessons.map((l) => (
                      <div key={l.id} style={{ marginBottom: '0.5rem' }}>
                        {/* Lesson title */}
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)', marginBottom: '0.375rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Icons.Folder width={12} />
                          {l.title}
                        </div>

                        {/* Pages */}
                        {l.pages.map((p) => {
                          const isActive = activePageId === p.id;
                          const isCompleted = isPageCompleted(p.id);
                          const score = getPageScore(p.id);
                          const config = PAGE_TYPE_CONFIG[p.kind];

                          return (
                            <button
                              key={p.id}
                              onClick={() => setActivePageId(p.id)}
                              className="tree-item"
                              style={{
                                width: '100%',
                                marginBottom: '0.25rem',
                                padding: '0.5rem 0.75rem',
                                background: isActive ? 'var(--primary-soft)' : 'transparent',
                                color: isActive ? 'var(--primary)' : isCompleted ? 'var(--success)' : 'var(--text-secondary)',
                                borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                              }}
                            >
                              <span style={{ marginRight: '0.5rem' }}>{config.icon}</span>
                              <span style={{ flex: 1, textAlign: 'left', fontSize: '0.875rem' }}>{p.title}</span>
                              {isCompleted && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                  {score !== undefined && <span className="text-xs" style={{ fontWeight: 600 }}>{score}</span>}
                                  <Icons.Check width={14} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col" style={{ overflow: 'hidden' }}>
        {/* Top bar */}
        <div
          style={{
            height: '64px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            flexShrink: 0,
          }}
        >
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {activeChapter && (
              <>
                <span className="ai-badge" style={{ fontSize: '0.8125rem' }}>
                  {activeChapter.title}
                </span>
                <Icons.ChevronRight width={14} style={{ color: 'var(--text-tertiary)' }} />
              </>
            )}
            {activeLesson && (
              <>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {activeLesson.title}
                </span>
                <Icons.ChevronRight width={14} style={{ color: 'var(--text-tertiary)' }} />
              </>
            )}
            {activePage && (
              <span className="text-sm" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {activePage.title}
              </span>
            )}
          </div>

          {/* Page counter & navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{currentPageIndex + 1}</span> / {pagesCount}
            </span>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <button
                onClick={() => goToPage('prev')}
                disabled={currentPageIndex === 0}
                className="btn-icon"
                title="Предыдущая страница"
              >
                <Icons.ChevronDown width={16} style={{ transform: 'rotate(90deg)' }} />
              </button>
              <button
                onClick={() => goToPage('next')}
                disabled={currentPageIndex === pagesCount - 1}
                className="btn-icon"
                title="Следующая страница"
              >
                <Icons.ChevronDown width={16} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1" style={{ overflowY: 'auto', background: 'var(--bg-app)' }}>
          {!activePage ? (
            <div className="h-full flex items-center justify-center">
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--primary-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                  }}
                >
                  📖
                </div>
                <p className="text-base" style={{ color: 'var(--text-tertiary)' }}>
                  Выберите страницу из меню слева
                </p>
              </div>
            </div>
          ) : (
            <div className="container" style={{ maxWidth: '920px', paddingTop: '3rem', paddingBottom: '3rem' }}>
              {/* Page header */}
              <div
                style={{
                  marginBottom: '2rem',
                  padding: '1.5rem 2rem',
                  borderRadius: 'var(--radius-lg)',
                  background: `linear-gradient(135deg, ${pageConfig?.color}15, transparent)`,
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  {pageConfig && (
                    <span
                      className="ai-badge"
                      style={{
                        background: `${pageConfig.color}20`,
                        color: pageConfig.color,
                        border: `1px solid ${pageConfig.color}30`,
                        marginBottom: '1rem',
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{pageConfig.icon}</span>
                      {pageConfig.label}
                    </span>
                  )}
                  <h1 className="text-h2" style={{ marginTop: '0.5rem' }}>
                    {activePage.title}
                  </h1>
                </div>
                {isPageCompleted(activePageId!) && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--success-soft)',
                      color: 'var(--success)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                    }}
                  >
                    <Icons.Check width={16} height={16} />
                    <span className="text-sm" style={{ fontWeight: 600 }}>
                      Завершено
                    </span>
                    {getPageScore(activePageId!) !== undefined && (
                      <span className="text-sm" style={{ fontWeight: 700 }}>
                        • {getPageScore(activePageId!)} баллов
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Page content */}
              <div className="page-content">
                {activePage.kind === 'theory' && (
                  <TheoryPageView
                    page={activePage}
                    onComplete={handleTheoryComplete}
                    isCompleted={isPageCompleted(activePageId!)}
                  />
                )}

                {activePage.kind === 'quiz' && (
                  <QuizPageView
                    page={activePage}
                    onSubmit={handleQuizSubmit}
                    result={submissionResults[activePageId!]?.quiz}
                    isSubmitting={isSubmitting}
                  />
                )}

                {activePage.kind === 'code' && (
                  <CodePageView
                    page={activePage}
                    onSubmit={handleCodeSubmit}
                    result={submissionResults[activePageId!]?.code}
                    isSubmitting={isSubmitting}
                  />
                )}

                {activePage.kind === 'detailed' && (
                  <DetailedPageView
                    page={activePage}
                    onSubmit={handleDetailedSubmit}
                    result={submissionResults[activePageId!]?.detailed}
                    isSubmitting={isSubmitting}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
