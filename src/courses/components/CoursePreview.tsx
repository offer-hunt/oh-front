import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Course } from '@/courses/types';
import { Icons } from '@/components/Icons';

export function CoursePreview({ course }: { course: Course }) {
    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [completedPages, setCompletedPages] = useState<Set<string>>(new Set());

    const lessonsCount = course.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
    const pagesCount = course.chapters.reduce((acc, ch) =>
        acc + ch.lessons.reduce((sum, l) => sum + l.pages.length, 0), 0
    );

    // Auto-select first page
    useEffect(() => {
        if (!activePageId && course.chapters[0]?.lessons[0]?.pages[0]) {
            setActivePageId(course.chapters[0].lessons[0].pages[0].id);
        }
    }, [course, activePageId]);

    // Find active page data
    let activePage = null;
    let activeLesson = null;
    let activeChapter = null;
    for(const ch of course.chapters) {
        for(const l of ch.lessons) {
            const found = l.pages.find(p => p.id === activePageId);
            if (found) {
                activePage = found;
                activeLesson = l;
                activeChapter = ch;
                break;
            }
        }
        if (activePage) break;
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

    const progress = pagesCount > 0 ? Math.round((completedPages.size / pagesCount) * 100) : 0;

    return (
        <div className="preview-frame flex flex-col h-full bg-[var(--bg-primary)]">
            {/* Top bar with progress */}
            <div className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex-1">
                    <div className="font-bold text-lg text-[var(--text-primary)]">{course.title}</div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-1">
                        {lessonsCount} уроков • {pagesCount} страниц • {completedPages.size} завершено
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">Прогресс</div>
                        <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-[var(--bg-input)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-sm font-semibold text-[var(--primary)]">{progress}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="preview-sidebar w-80 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] overflow-y-auto flex-shrink-0">
                    <div className="p-4">
                        {course.chapters.map((ch, i) => (
                            <div key={ch.id} className="mb-6">
                                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 px-2">
                                    <span className="bg-[var(--primary-soft)] text-[var(--primary)] w-6 h-6 rounded flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                    <span>{ch.title}</span>
                                </div>
                                {ch.description && (
                                    <p className="text-xs text-[var(--text-secondary)] mb-3 px-2">{ch.description}</p>
                                )}
                                {ch.lessons.map((l, j) => (
                                    <div key={l.id} className="mb-3">
                                        <div className="text-sm font-semibold text-[var(--text-primary)] px-3 py-2 flex items-center gap-2">
                                            <Icons.Folder width={14} height={14} className="text-[var(--text-tertiary)]" />
                                            <span>{j + 1}. {l.title}</span>
                                        </div>
                                        <div className="flex flex-col pl-6">
                                            {l.pages.map(p => {
                                                const isActive = activePageId === p.id;
                                                const isCompleted = completedPages.has(p.id);
                                                let icon = '📄';
                                                if (p.kind === 'quiz') icon = '❓';
                                                if (p.kind === 'code') icon = '💻';
                                                if (p.kind === 'detailed') icon = '✍️';

                                                return (
                                                    <button
                                                        key={p.id}
                                                        className={`text-left text-sm py-2 px-3 rounded-lg transition-all mb-1 flex items-center gap-2 ${
                                                            isActive
                                                                ? 'bg-[var(--primary)] text-white font-semibold shadow-md'
                                                                : isCompleted
                                                                    ? 'bg-[var(--success-soft)] text-[var(--success)] hover:bg-[var(--success-soft)]/80'
                                                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'
                                                        }`}
                                                        onClick={() => setActivePageId(p.id)}
                                                    >
                                                        <span>{icon}</span>
                                                        <span className="flex-1 truncate">{p.title}</span>
                                                        {isCompleted && <span className="text-xs">✓</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="preview-content flex-1 bg-[var(--bg-surface)] overflow-y-auto">
                    {!activePage ? (
                        <div className="flex h-full items-center justify-center text-[var(--text-tertiary)]">
                            <div className="text-center">
                                <div className="text-6xl mb-4 opacity-20">📚</div>
                                <div className="text-lg font-medium">Выберите урок из меню</div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto p-8">
                            {/* Breadcrumbs */}
                            {activeChapter && activeLesson && (
                                <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mb-6">
                                    <span>{activeChapter.title}</span>
                                    <span>›</span>
                                    <span>{activeLesson.title}</span>
                                    <span>›</span>
                                    <span className="text-[var(--text-primary)] font-medium">{activePage.title}</span>
                                </div>
                            )}

                            <h1 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">{activePage.title}</h1>

                                {activePage.kind === 'theory' && (
                                    <div>
                                        {activePage.theory.videoUrl && (
                                            <div className="aspect-video bg-black rounded-xl mb-8 flex items-center justify-center text-white overflow-hidden shadow-xl border border-[var(--border-subtle)]">
                                                <div className="text-center px-4">
                                                    <div className="text-6xl mb-3">🎥</div>
                                                    <p className="font-bold text-lg">Video Player</p>
                                                    <p className="text-xs opacity-70 mt-2 break-all">{activePage.theory.videoUrl}</p>
                                                </div>
                                            </div>
                                        )}
                                        {activePage.theory.mode === 'markdown' && activePage.theory.markdown ? (
                                            <div className="prose prose-lg max-w-none text-[var(--text-primary)]">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-5 mt-8 text-[var(--text-primary)] border-b-2 border-[var(--border-subtle)] pb-3" {...props} />,
                                                        h2: ({node, ...props}) => <h2 className="text-2xl font-bold mb-4 mt-7 text-[var(--text-primary)]" {...props} />,
                                                        h3: ({node, ...props}) => <h3 className="text-xl font-semibold mb-3 mt-5 text-[var(--text-primary)]" {...props} />,
                                                        p: ({node, ...props}) => <p className="mb-4 text-[var(--text-secondary)] leading-relaxed text-base" {...props} />,
                                                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 text-[var(--text-secondary)] space-y-2 pl-4" {...props} />,
                                                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 text-[var(--text-secondary)] space-y-2 pl-4" {...props} />,
                                                        li: ({node, ...props}) => <li className="text-[var(--text-secondary)] leading-relaxed" {...props} />,
                                                        code: ({node, inline, ...props}: any) =>
                                                            inline
                                                                ? <code className="bg-[var(--bg-input)] px-2 py-1 rounded text-[var(--primary)] font-mono text-sm border border-[var(--border-subtle)]" {...props} />
                                                                : <code className="block bg-[var(--bg-input)] p-4 rounded-xl font-mono text-sm overflow-x-auto border border-[var(--border-subtle)] text-[var(--text-primary)] my-4" {...props} />,
                                                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[var(--primary)] pl-6 py-2 italic text-[var(--text-secondary)] my-4 bg-[var(--primary-soft)] rounded-r-lg" {...props} />,
                                                        strong: ({node, ...props}) => <strong className="font-bold text-[var(--text-primary)]" {...props} />,
                                                        em: ({node, ...props}) => <em className="italic" {...props} />,
                                                        a: ({node, ...props}) => <a className="text-[var(--primary)] hover:underline font-medium" {...props} />,
                                                        hr: ({node, ...props}) => <hr className="my-6 border-[var(--border-subtle)]" {...props} />,
                                                    }}
                                                >
                                                    {activePage.theory.markdown}
                                                </ReactMarkdown>
                                            </div>
                                        ) : activePage.theory.text ? (
                                            <div className="whitespace-pre-wrap text-base leading-relaxed text-[var(--text-secondary)]">
                                                {activePage.theory.text}
                                            </div>
                                        ) : null}

                                        {activePage.theory.attachments && activePage.theory.attachments.length > 0 && (
                                            <div className="mt-8 pt-6 border-t-2 border-[var(--border-subtle)]">
                                                <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide mb-4">📎 Прикрепленные материалы</h4>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {activePage.theory.attachments.map((f, i) => (
                                                        <div key={i} className="flex items-center gap-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] px-4 py-3 rounded-lg hover:border-[var(--primary)] hover:shadow-md transition-all cursor-pointer group">
                                                            <div className="text-2xl">📄</div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm text-[var(--text-primary)] truncate group-hover:text-[var(--primary)]">{f.name}</div>
                                                                <div className="text-xs text-[var(--text-tertiary)]">{(f.size / 1024).toFixed(1)} KB</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                            {activePage.kind === 'quiz' && (
                                <div className="bg-[var(--bg-input)] p-8 rounded-xl border-2 border-[var(--border-subtle)]">
                                    <div className="mb-6">
                                        <div className="inline-block bg-[var(--primary-soft)] text-[var(--primary)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
                                            Тестовый вопрос
                                        </div>
                                        <p className="font-semibold text-xl text-[var(--text-primary)] leading-relaxed">{activePage.quiz.question}</p>
                                    </div>
                                    <div className="space-y-3">
                                        {activePage.quiz.options.map(opt => (
                                            <label key={opt.id} className="flex items-center gap-4 p-5 bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] rounded-xl cursor-pointer hover:border-[var(--primary)] hover:shadow-lg transition-all group">
                                                <input type="radio" name="pq" className="w-5 h-5 text-[var(--primary)] accent-[var(--primary)] cursor-pointer" />
                                                <span className="text-base text-[var(--text-primary)] group-hover:text-[var(--primary)] font-medium">{opt.text}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <button className="btn btn-primary mt-8 w-full py-4 text-base font-semibold shadow-lg hover:shadow-xl" onClick={handleComplete}>
                                        Отправить ответ →
                                    </button>
                                </div>
                            )}

                            {activePage.kind === 'code' && (
                                <div>
                                    <div className="bg-gradient-to-br from-[var(--primary-soft)] to-[var(--primary-soft)]/50 text-[var(--text-primary)] p-6 rounded-xl mb-8 border border-[var(--primary)]/30 leading-relaxed">
                                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)] uppercase tracking-wide mb-3">
                                            <span>💻</span>
                                            <span>Задание</span>
                                        </div>
                                        <div className="text-base">{activePage.code.description}</div>
                                    </div>
                                    <div className="border-2 border-[var(--border-strong)] rounded-xl overflow-hidden shadow-lg mb-6">
                                        <div className="bg-[var(--bg-input)] px-5 py-3 border-b-2 border-[var(--border-strong)] text-xs font-mono text-[var(--text-secondary)] uppercase flex justify-between items-center">
                                            <span className="font-semibold">💾 main.{activePage.code.language === 'python' ? 'py' : activePage.code.language === 'java' ? 'java' : 'js'}</span>
                                            <span className="bg-[var(--primary-soft)] text-[var(--primary)] px-3 py-1 rounded-full font-bold">{activePage.code.language}</span>
                                        </div>
                                        <div className="bg-[#1e1e1e] text-gray-300 p-6 font-mono text-sm min-h-[300px]">
                                            <span className="text-gray-500">// Напишите ваш код здесь...</span>
                                            <br/>
                                            <span className="text-purple-400">function</span> <span className="text-yellow-300">solution</span>() {'{'}
                                            <br/>&nbsp;&nbsp;<span className="text-gray-500">// Ваше решение</span><br/>
                                            {'}'}
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)]">
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl">✅</div>
                                            <div>
                                                <div className="text-sm font-semibold text-[var(--text-primary)]">{activePage.code.testCases.length} тест-кейсов</div>
                                                <div className="text-xs text-[var(--text-tertiary)]">Ваш код будет проверен автоматически</div>
                                            </div>
                                        </div>
                                        <button className="btn btn-primary px-8 py-3 font-semibold shadow-md hover:shadow-lg w-full sm:w-auto" onClick={handleComplete}>
                                            ▶ Запустить код
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activePage.kind === 'detailed' && (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                                        <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-3">
                                            <span>✍️</span>
                                            <span>Задание с развернутым ответом</span>
                                        </div>
                                        <div className="text-base text-purple-900 dark:text-purple-200 leading-relaxed">{activePage.detailed.description}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--text-primary)] mb-3">Ваш ответ</label>
                                        <textarea className="form-input w-full h-48 text-base leading-relaxed" placeholder="Напишите развернутый ответ на задание..." />
                                    </div>
                                    <button className="btn btn-primary w-full py-4 font-semibold shadow-lg hover:shadow-xl" onClick={handleComplete}>
                                        Отправить на проверку →
                                    </button>

                                    <div className="flex items-center gap-3 p-4 bg-[var(--bg-input)] rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-tertiary)]">
                                        <span className="text-lg">ℹ️</span>
                                        <span>
                                            Проверка: {activePage.detailed.answerMode === 'exact' ? '✓ По точному совпадению' : '🤖 С помощью AI ассистента'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Complete button for other types */}
                            {!completedPages.has(activePageId!) && activePage.kind === 'theory' && (
                                <div className="mt-12 pt-6 border-t-2 border-[var(--border-subtle)]">
                                    <button
                                        className="btn btn-primary w-full py-4 text-base font-semibold shadow-lg hover:shadow-xl"
                                        onClick={handleComplete}
                                    >
                                        Завершить страницу →
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
