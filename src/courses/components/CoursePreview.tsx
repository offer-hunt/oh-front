import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Course, LessonPage } from '@/courses/types';
import { Icons } from '@/components/Icons';

// Конфигурация типов страниц
const PAGE_TYPE_CONFIG = {
  theory: { icon: '📄', label: 'Теория', color: '#6366f1', gradient: 'from-indigo-500 to-violet-500' },
  quiz: { icon: '❓', label: 'Тест', color: '#f59e0b', gradient: 'from-amber-500 to-orange-500' },
  code: { icon: '💻', label: 'Код', color: '#10b981', gradient: 'from-emerald-500 to-teal-500' },
  detailed: { icon: '✍️', label: 'Развёрнутый ответ', color: '#8b5cf6', gradient: 'from-violet-500 to-purple-500' },
};

export function CoursePreview({ course }: { course: Course }) {
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [completedPages, setCompletedPages] = useState<Set<string>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const lessonsCount = course.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
  const pagesCount = course.chapters.reduce((acc, ch) =>
    acc + ch.lessons.reduce((sum, l) => sum + l.pages.length, 0), 0
  );

  // Auto-select first page and expand first chapter
  useEffect(() => {
    if (!activePageId) {
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
  }, [course, activePageId]);

  const toggleChapter = (chId: string) => {
    setExpandedChapters(prev => {
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

  const handleComplete = () => {
    if (activePageId) {
      setCompletedPages(prev => new Set(prev).add(activePageId));
      // Auto-advance to next page
      const allPages = course.chapters.flatMap(ch => ch.lessons.flatMap(l => l.pages));
      const currentIndex = allPages.findIndex(p => p.id === activePageId);
      if (currentIndex < allPages.length - 1) {
        setActivePageId(allPages[currentIndex + 1].id);
      }
    }
  };

  const goToPage = (direction: 'prev' | 'next') => {
    const allPages = course.chapters.flatMap(ch => ch.lessons.flatMap(l => l.pages));
    const currentIndex = allPages.findIndex(p => p.id === activePageId);
    if (direction === 'prev' && currentIndex > 0) {
      setActivePageId(allPages[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < allPages.length - 1) {
      setActivePageId(allPages[currentIndex + 1].id);
    }
  };

  const progress = pagesCount > 0 ? Math.round((completedPages.size / pagesCount) * 100) : 0;

  // Если курс пустой
  if (pagesCount === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'radial-gradient(circle at top left, rgba(99, 102, 241, 0.15), transparent 50%), radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.1), transparent 50%), var(--bg-app)' }}>
        <div className="text-center max-w-lg mx-auto p-8">
          <div className="w-28 h-28 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-[var(--primary)] to-violet-600 flex items-center justify-center shadow-2xl shadow-[var(--primary)]/30">
            <span className="text-6xl">📚</span>
          </div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Курс пока пустой</h2>
          <p className="text-lg text-[var(--text-secondary)] mb-10">
            Добавьте главы, уроки и страницы в редакторе контента, чтобы увидеть предпросмотр курса.
          </p>
          <div className="inline-flex items-center gap-8 text-sm">
            <div className="flex flex-col items-center gap-2">
              <span className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-2xl">📖</span>
              <span className="text-[var(--text-tertiary)]">{course.chapters.length} глав</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-2xl">📁</span>
              <span className="text-[var(--text-tertiary)]">{lessonsCount} уроков</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-2xl">📄</span>
              <span className="text-[var(--text-tertiary)]">{pagesCount} страниц</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pageConfig = activePage ? PAGE_TYPE_CONFIG[activePage.kind] : null;

  return (
    <div className="h-full flex" style={{ background: 'var(--bg-app)' }}>
      {/* Sidebar */}
      <div className={`flex-shrink-0 flex flex-col transition-all duration-300 border-r border-[var(--border-subtle)] ${
        sidebarCollapsed ? 'w-20' : 'w-96'
      }`} style={{ background: 'linear-gradient(180deg, var(--bg-surface) 0%, rgba(15, 23, 42, 0.98) 100%)' }}>
        {/* Sidebar header */}
        <div className="flex-shrink-0 p-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 mr-3">
                <h2 className="text-lg font-bold text-[var(--text-primary)] truncate">{course.title}</h2>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  {lessonsCount} уроков • {pagesCount} страниц
                </p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-tertiary)] bg-[var(--bg-app)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
            >
              <Icons.ChevronDown
                width={18}
                style={{ transform: sidebarCollapsed ? 'rotate(-90deg)' : 'rotate(90deg)' }}
              />
            </button>
          </div>

          {/* Progress */}
          {!sidebarCollapsed && (
            <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-[var(--text-secondary)] font-medium">Прогресс</span>
                <span className="font-bold text-[var(--primary)]">{progress}%</span>
              </div>
              <div className="h-3 bg-[var(--bg-input)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--primary)] to-violet-400 transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-3 text-center">
                {completedPages.size} из {pagesCount} завершено
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          {course.chapters.map((ch, chIdx) => {
            const isExpanded = expandedChapters.has(ch.id);
            const chapterPages = ch.lessons.flatMap(l => l.pages);
            const completedInChapter = chapterPages.filter(p => completedPages.has(p.id)).length;
            const chapterProgress = chapterPages.length > 0 ? Math.round((completedInChapter / chapterPages.length) * 100) : 0;

            return (
              <div key={ch.id} className="mb-3">
                {/* Chapter */}
                <button
                  onClick={() => toggleChapter(ch.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
                    isExpanded ? 'bg-[var(--primary-soft)]' : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-input)]'
                  } border border-[var(--border-subtle)]`}
                >
                  {!sidebarCollapsed ? (
                    <>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                        isExpanded ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-app)] text-[var(--text-tertiary)]'
                      }`}>
                        {chIdx + 1}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-[var(--text-primary)] truncate">{ch.title}</div>
                        <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          {ch.lessons.length} уроков • {chapterProgress}% завершено
                        </div>
                      </div>
                      <Icons.ChevronDown
                        width={16}
                        className="text-[var(--text-tertiary)]"
                        style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
                      />
                    </>
                  ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      isExpanded ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-app)] text-[var(--text-tertiary)]'
                    }`}>
                      {chIdx + 1}
                    </div>
                  )}
                </button>

                {/* Lessons */}
                {isExpanded && !sidebarCollapsed && (
                  <div className="mt-2 ml-4 space-y-2">
                    {ch.lessons.map((l, lIdx) => (
                      <div key={l.id} className="rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                        {/* Lesson header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
                          <Icons.Folder width={16} className="text-emerald-400" />
                          <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {lIdx + 1}. {l.title}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)] ml-auto">
                            {l.pages.length}
                          </span>
                        </div>

                        {/* Pages */}
                        <div className="p-2 space-y-1">
                          {l.pages.map(p => {
                            const isActive = activePageId === p.id;
                            const isCompleted = completedPages.has(p.id);
                            const config = PAGE_TYPE_CONFIG[p.kind];

                            return (
                              <button
                                key={p.id}
                                onClick={() => setActivePageId(p.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                                  isActive
                                    ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                                    : isCompleted
                                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15'
                                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'
                                }`}
                              >
                                <span className="text-lg">{config.icon}</span>
                                <span className="flex-1 text-sm truncate">{p.title}</span>
                                {isCompleted && !isActive && (
                                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <Icons.Check width={12} height={12} />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex-shrink-0 border-b border-[var(--border-subtle)] px-8 py-4" style={{ background: 'var(--bg-surface)' }}>
          <div className="flex items-center justify-between">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-3 text-sm">
              {activeChapter && (
                <>
                  <span className="px-3 py-1.5 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] font-medium">{activeChapter.title}</span>
                  <Icons.ChevronRight width={16} className="text-[var(--text-tertiary)]" />
                </>
              )}
              {activeLesson && (
                <>
                  <span className="text-[var(--text-secondary)]">{activeLesson.title}</span>
                  <Icons.ChevronRight width={16} className="text-[var(--text-tertiary)]" />
                </>
              )}
              {activePage && (
                <span className="font-semibold text-[var(--text-primary)]">{activePage.title}</span>
              )}
            </div>

            {/* Page counter & navigation */}
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  Страница <span className="text-[var(--primary)] font-bold">{currentPageIndex + 1}</span> из {pagesCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage('prev')}
                  disabled={currentPageIndex === 0}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-tertiary)] bg-[var(--bg-app)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Icons.ChevronDown width={18} style={{ transform: 'rotate(90deg)' }} />
                </button>
                <button
                  onClick={() => goToPage('next')}
                  disabled={currentPageIndex === pagesCount - 1}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-tertiary)] bg-[var(--bg-app)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Icons.ChevronDown width={18} style={{ transform: 'rotate(-90deg)' }} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto" style={{ background: 'radial-gradient(circle at top, var(--bg-surface) 0%, var(--bg-app) 100%)' }}>
          {!activePage ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-[var(--primary-soft)] flex items-center justify-center">
                  <span className="text-5xl">📖</span>
                </div>
                <p className="text-lg text-[var(--text-tertiary)]">Выберите страницу из меню слева</p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-10">
              {/* Page header card */}
              <div
                className="mb-8 p-6 rounded-2xl border border-[var(--border-subtle)]"
                style={{ background: `linear-gradient(135deg, ${pageConfig?.color}15, transparent)` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    {pageConfig && (
                      <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4"
                        style={{
                          background: `${pageConfig.color}20`,
                          color: pageConfig.color,
                        }}
                      >
                        <span className="text-lg">{pageConfig.icon}</span>
                        <span>{pageConfig.label}</span>
                      </div>
                    )}
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">{activePage.title}</h1>
                  </div>
                  {completedPages.has(activePageId!) && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                      <Icons.Check width={18} height={18} />
                      <span className="text-sm font-semibold">Завершено</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content card */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden shadow-xl">
                {/* Theory content */}
                {activePage.kind === 'theory' && (
                  <div className="p-8">
                    {activePage.theory.videoUrl && (
                      <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl flex items-center justify-center border border-gray-700 overflow-hidden mb-8">
                        <div className="text-center px-6">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
                            <span className="text-4xl">▶️</span>
                          </div>
                          <p className="text-white font-semibold text-lg">Video Player</p>
                          <p className="text-gray-400 text-sm mt-2 break-all max-w-md">{activePage.theory.videoUrl}</p>
                        </div>
                      </div>
                    )}

                    {activePage.theory.mode === 'markdown' && activePage.theory.markdown ? (
                      <div className="prose prose-lg prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({...props}) => <h1 className="text-3xl font-bold mb-5 mt-8 text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3" {...props} />,
                            h2: ({...props}) => <h2 className="text-2xl font-bold mb-4 mt-7 text-[var(--text-primary)]" {...props} />,
                            h3: ({...props}) => <h3 className="text-xl font-semibold mb-3 mt-5 text-[var(--text-primary)]" {...props} />,
                            p: ({...props}) => <p className="mb-4 text-[var(--text-secondary)] leading-relaxed text-base" {...props} />,
                            ul: ({...props}) => <ul className="list-disc ml-6 mb-4 text-[var(--text-secondary)] space-y-2" {...props} />,
                            ol: ({...props}) => <ol className="list-decimal ml-6 mb-4 text-[var(--text-secondary)] space-y-2" {...props} />,
                            li: ({...props}) => <li className="text-[var(--text-secondary)] leading-relaxed" {...props} />,
                            code: ({inline, ...props}: {inline?: boolean; children?: React.ReactNode}) =>
                              inline
                                ? <code className="bg-[var(--bg-input)] px-2 py-1 rounded text-[var(--primary)] font-mono text-sm" {...props} />
                                : <code className="block bg-[#1e1e1e] p-5 rounded-xl font-mono text-sm overflow-x-auto text-gray-300 my-5" {...props} />,
                            blockquote: ({...props}) => <blockquote className="border-l-4 border-[var(--primary)] pl-6 py-3 italic text-[var(--text-secondary)] my-5 bg-[var(--primary-soft)]/30 rounded-r-xl" {...props} />,
                            strong: ({...props}) => <strong className="font-bold text-[var(--text-primary)]" {...props} />,
                            a: ({...props}) => <a className="text-[var(--primary)] hover:underline" {...props} />,
                          }}
                        >
                          {activePage.theory.markdown}
                        </ReactMarkdown>
                      </div>
                    ) : activePage.theory.text ? (
                      <div className="text-base leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
                        {activePage.theory.text}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-[var(--text-tertiary)]">
                        <span className="text-4xl mb-4 block">📝</span>
                        <p>Контент не добавлен</p>
                      </div>
                    )}

                    {activePage.theory.attachments && activePage.theory.attachments.length > 0 && (
                      <div className="mt-10 pt-8 border-t border-[var(--border-subtle)]">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-5 flex items-center gap-2">
                          <span className="text-lg">📎</span> Прикреплённые материалы
                        </h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {activePage.theory.attachments.map((f, i) => (
                            <div key={i} className="flex items-center gap-4 p-5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] hover:border-[var(--primary)] transition-all cursor-pointer group">
                              <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
                                <span className="text-2xl">📄</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">{f.name}</div>
                                <div className="text-sm text-[var(--text-tertiary)]">{(f.size / 1024).toFixed(0)} KB</div>
                              </div>
                              <Icons.ArrowDown width={18} className="text-[var(--text-tertiary)] group-hover:text-[var(--primary)]" style={{ transform: 'rotate(-90deg)' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quiz content */}
                {activePage.kind === 'quiz' && (
                  <>
                    <div className="p-8 border-b border-[var(--border-subtle)] bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">
                        <span>❓</span>
                        <span>Вопрос</span>
                      </div>
                      <p className="text-xl font-semibold text-[var(--text-primary)] leading-relaxed">
                        {activePage.quiz.question || 'Вопрос не задан'}
                      </p>
                    </div>
                    <div className="p-8 space-y-4">
                      {activePage.quiz.options.length === 0 ? (
                        <div className="text-center py-8 text-[var(--text-tertiary)]">
                          <span className="text-4xl mb-4 block">📋</span>
                          <p>Варианты ответов не добавлены</p>
                        </div>
                      ) : (
                        activePage.quiz.options.map((opt, i) => (
                          <label key={opt.id} className="flex items-center gap-4 p-5 rounded-xl border-2 border-[var(--border-subtle)] hover:border-amber-500/50 cursor-pointer transition-all group">
                            <span className="w-12 h-12 rounded-xl bg-[var(--bg-app)] flex items-center justify-center text-lg font-bold text-[var(--text-tertiary)] group-hover:bg-amber-500/20 group-hover:text-amber-500 transition-all">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1 text-[var(--text-primary)]">{opt.text}</span>
                            <input type="radio" name="quiz" className="w-6 h-6 accent-amber-500" />
                          </label>
                        ))
                      )}
                    </div>
                    <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-input)]/30">
                      <button
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-amber-500/20"
                        onClick={handleComplete}
                      >
                        Отправить ответ
                      </button>
                    </div>
                  </>
                )}

                {/* Code content */}
                {activePage.kind === 'code' && (
                  <div className="p-8 space-y-6">
                    <div className="p-6 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                        <span>💻</span>
                        <span>Задание</span>
                      </div>
                      <p className="text-[var(--text-primary)] leading-relaxed text-lg">
                        {activePage.code.description || 'Описание задания не добавлено'}
                      </p>
                    </div>

                    <div className="rounded-2xl overflow-hidden border border-gray-700">
                      <div className="px-6 py-4 bg-[#1e1e1e] border-b border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                            <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                            <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                          </div>
                          <span className="text-sm font-mono text-gray-400">
                            main.{activePage.code.language === 'python' ? 'py' : activePage.code.language === 'java' ? 'java' : 'js'}
                          </span>
                        </div>
                        <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold">
                          {activePage.code.language || 'javascript'}
                        </span>
                      </div>
                      <div className="bg-[#1e1e1e] p-6 font-mono text-sm text-gray-300 min-h-[300px]">
                        <span className="text-gray-500">// Напишите ваш код здесь...</span>
                        <br /><br />
                        <span className="text-purple-400">function</span> <span className="text-yellow-300">solution</span>() {'{'}
                        <br />&nbsp;&nbsp;<span className="text-gray-500">// Ваше решение</span><br />
                        {'}'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-6 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                          <span className="text-2xl">✅</span>
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--text-primary)]">{activePage.code.testCases.length} тест-кейсов</div>
                          <div className="text-sm text-[var(--text-tertiary)]">Ваш код будет проверен автоматически</div>
                        </div>
                      </div>
                      <button
                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20"
                        onClick={handleComplete}
                      >
                        ▶ Запустить
                      </button>
                    </div>
                  </div>
                )}

                {/* Detailed answer content */}
                {activePage.kind === 'detailed' && (
                  <div className="p-8 space-y-6">
                    <div className="p-6 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30">
                      <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider mb-3">
                        <span>✍️</span>
                        <span>Задание</span>
                      </div>
                      <p className="text-[var(--text-primary)] leading-relaxed text-lg">
                        {activePage.detailed.description || 'Описание задания не добавлено'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-[var(--text-secondary)] mb-3 block">Ваш ответ</label>
                      <textarea
                        className="form-input w-full min-h-[250px] text-base leading-relaxed"
                        placeholder="Напишите развёрнутый ответ..."
                      />
                    </div>

                    <button
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-violet-500/20"
                      onClick={handleComplete}
                    >
                      Отправить на проверку
                    </button>

                    <div className="flex items-center gap-4 p-5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                      <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                        <span className="text-2xl">{activePage.detailed.answerMode === 'exact' ? '✓' : '🤖'}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">
                          {activePage.detailed.answerMode === 'exact' ? 'Точная проверка' : 'AI проверка'}
                        </div>
                        <div className="text-sm text-[var(--text-tertiary)]">
                          {activePage.detailed.answerMode === 'exact' ? 'Ответ проверяется по точному совпадению' : 'Ответ анализируется с помощью AI'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Complete button for theory */}
              {activePage.kind === 'theory' && !completedPages.has(activePageId!) && (
                <div className="mt-8">
                  <button
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-violet-500 text-white font-semibold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-[var(--primary)]/20"
                    onClick={handleComplete}
                  >
                    <span>Завершить и продолжить</span>
                    <Icons.ChevronRight width={20} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
