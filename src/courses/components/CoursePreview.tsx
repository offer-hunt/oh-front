import { useState } from 'react';
import type { Course } from '@/courses/types';

export function CoursePreview({ course }: { course: Course }) {
    const [activePageId, setActivePageId] = useState<string | null>(null);

    // Находим активную страницу для отображения
    let activePage = null;
    for(const ch of course.chapters) {
        for(const l of ch.lessons) {
            const found = l.pages.find(p => p.id === activePageId);
            if (found) { activePage = found; break; }
        }
        if(activePage) break;
    }

    return (
        <div className="border-2 border-[var(--primary)] rounded-lg overflow-hidden shadow-2xl bg-white h-[600px] flex relative">
            {/* Banner */}
            <div className="absolute top-0 left-0 right-0 bg-[var(--primary)] text-white text-xs font-bold text-center py-1 z-50">
                РЕЖИМ ПРЕДПРОСМОТРА (СТУДЕНТ)
            </div>

            {/* Student Sidebar */}
            <div className="w-64 bg-gray-50 border-r overflow-y-auto pt-8">
                <div className="p-4 font-bold text-lg border-b">{course.title}</div>
                {course.chapters.map((ch, i) => (
                    <div key={ch.id}>
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase bg-gray-100 mt-2">{i+1}. {ch.title}</div>
                        {ch.lessons.map((l, j) => (
                            <div key={l.id}>
                                <div className="px-4 py-1 text-sm font-medium text-gray-700 mt-1">{j+1}. {l.title}</div>
                                {l.pages.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => setActivePageId(p.id)}
                                        className={`cursor-pointer px-6 py-1 text-sm flex items-center gap-2 hover:bg-gray-200 ${activePageId === p.id ? 'text-[var(--primary)] font-medium bg-white border-l-2 border-[var(--primary)]' : 'text-gray-600'}`}
                                    >
                                        <span className="text-[10px] opacity-50">
                                            {p.kind === 'theory' && '📄'}
                                            {p.kind === 'quiz' && '❓'}
                                            {p.kind === 'code' && '💻'}
                                        </span>
                                        {p.title}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Student Content */}
            <div className="flex-1 overflow-y-auto p-8 pt-12 bg-white">
                {!activePage ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="text-4xl mb-2">👋</div>
                        <div>Выберите урок слева</div>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-2xl font-bold mb-6">{activePage.title}</h1>

                        {/* Theory View */}
                        {activePage.kind === 'theory' && (
                            <div className="prose">
                                {activePage.theory.videoUrl && (
                                    <div className="aspect-video bg-black rounded mb-4 flex items-center justify-center text-white">
                                        Video Player Mock
                                    </div>
                                )}
                                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                    {activePage.theory.mode === 'markdown' ? activePage.theory.markdown : activePage.theory.text}
                                </div>
                            </div>
                        )}

                        {/* Quiz View */}
                        {activePage.kind === 'quiz' && (
                            <div className="bg-white border rounded-lg p-6 shadow-sm">
                                <div className="font-medium text-lg mb-4">{activePage.quiz.question}</div>
                                <div className="space-y-2">
                                    {activePage.quiz.options.map(opt => (
                                        <label key={opt.id} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                            <input type="radio" name="student-quiz" className="w-4 h-4" />
                                            <span>{opt.text}</span>
                                        </label>
                                    ))}
                                </div>
                                <button className="btn btn-primary mt-4 w-full">Ответить</button>
                            </div>
                        )}

                         {/* Code View */}
                         {activePage.kind === 'code' && (
                            <div>
                                <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded">{activePage.code.description}</div>
                                <div className="bg-[#1e1e1e] text-gray-300 p-4 rounded-t-lg font-mono text-sm">
                                    // Language: {activePage.code.language}<br/>
                                    function solution(input) {'{'}<br/>
                                    &nbsp;&nbsp; // Type your code here...<br/>
                                    {'}'}
                                </div>
                                <button className="bg-green-600 text-white w-full py-2 rounded-b-lg font-medium hover:bg-green-700">Запустить код</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
