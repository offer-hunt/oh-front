import { useState, useEffect } from 'react';
import type { Course } from '@/courses/types';

export function CoursePreview({ course }: { course: Course }) {
    const [activePageId, setActivePageId] = useState<string | null>(null);

    // Auto-select first page
    useEffect(() => {
        if (!activePageId && course.chapters[0]?.lessons[0]?.pages[0]) {
            setActivePageId(course.chapters[0].lessons[0].pages[0].id);
        }
    }, [course, activePageId]);

    // Find active page data
    let activePage = null;
    for(const ch of course.chapters) {
        for(const l of ch.lessons) {
            const found = l.pages.find(p => p.id === activePageId);
            if (found) { activePage = found; break; }
        }
        if (activePage) break;
    }

    return (
        <div className="preview-frame border rounded-lg overflow-hidden shadow-sm" style={{height: 'calc(100vh - 160px)'}}>
            {/* Sidebar */}
            <div className="preview-sidebar overflow-y-auto">
                <div className="font-bold text-lg mb-6 px-2">{course.title}</div>
                {course.chapters.map((ch, i) => (
                    <div key={ch.id} className="mb-4">
                        <div className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 px-2">
                            Глава {i + 1}: {ch.title}
                        </div>
                        {ch.lessons.map((l, j) => (
                            <div key={l.id} className="mb-1">
                                <div className="text-sm font-semibold text-[var(--text-secondary)] px-2 py-1">{j + 1}. {l.title}</div>
                                <div className="flex flex-col">
                                    {l.pages.map(p => (
                                        <button
                                            key={p.id}
                                            className={`text-left text-sm py-1.5 px-4 rounded-md transition-colors ${activePageId === p.id ? 'bg-white text-[var(--primary)] shadow-sm font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--border)]'}`}
                                            onClick={() => setActivePageId(p.id)}
                                        >
                                            {p.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="preview-content bg-white relative">
                {!activePage ? (
                    <div className="flex h-full items-center justify-center text-[var(--text-tertiary)]">Выберите урок</div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">{activePage.title}</h1>

                        <div className="prose text-[var(--text-secondary)]">
                            {activePage.kind === 'theory' && (
                                <div>
                                    {activePage.theory.videoUrl && (
                                        <div className="aspect-video bg-black rounded-lg mb-6 flex items-center justify-center text-white">Video Player Placeholder</div>
                                    )}
                                    <div style={{whiteSpace:'pre-wrap'}}>{activePage.theory.mode === 'markdown' ? activePage.theory.markdown : activePage.theory.text}</div>
                                </div>
                            )}

                            {activePage.kind === 'quiz' && (
                                <div className="bg-[var(--bg-app)] p-6 rounded-lg border border-[var(--border)]">
                                    <p className="font-medium text-lg mb-4">{activePage.quiz.question}</p>
                                    <div className="space-y-2">
                                        {activePage.quiz.options.map(opt => (
                                            <label key={opt.id} className="flex items-center gap-3 p-3 bg-white border border-[var(--border)] rounded cursor-pointer hover:border-[var(--primary)]">
                                                <input type="radio" name="pq" className="accent-[var(--primary)]" />
                                                <span>{opt.text}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <button className="btn btn-primary mt-4 w-full">Ответить</button>
                                </div>
                            )}

                            {activePage.kind === 'code' && (
                                <div>
                                    <div className="bg-blue-50 text-blue-900 p-4 rounded-lg mb-4 border border-blue-100">
                                        {activePage.code.description}
                                    </div>
                                    <div className="bg-[#1e1e1e] text-gray-300 p-4 rounded-lg font-mono text-sm shadow-inner">
                                        // Write your {activePage.code.language} code here...
                                        <br/><br/>
                                        console.log("Hello world");
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <button className="btn btn-primary">Run Code ▶</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
