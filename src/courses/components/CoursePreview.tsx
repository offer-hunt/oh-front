import { useState, useEffect } from 'react';
import type { Course } from '@/courses/types';

export function CoursePreview({ course }: { course: Course }) {
    const [activePageId, setActivePageId] = useState<string | null>(null);

    const lessonsCount = course.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);

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
        <div className="preview-frame border rounded-lg overflow-hidden shadow-sm flex flex-col md:flex-row bg-gray-50" style={{height: 'calc(100vh - 160px)'}}>
            {/* Sidebar */}
            <div className="preview-sidebar w-full md:w-64 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
                <div className="p-4 border-b border-gray-100">
                    <div className="font-bold text-gray-900">{course.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{lessonsCount || 0} уроков</div>
                </div>
                <div className="p-2">
                    {course.chapters.map((ch, i) => (
                        <div key={ch.id} className="mb-4">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3 mt-2">
                                Глава {i + 1}: {ch.title}
                            </div>
                            {ch.lessons.map((l, j) => (
                                <div key={l.id} className="mb-1">
                                    <div className="text-sm font-semibold text-gray-700 px-3 py-1">{j + 1}. {l.title}</div>
                                    <div className="flex flex-col pl-2">
                                        {l.pages.map(p => (
                                            <button
                                                key={p.id}
                                                className={`text-left text-sm py-1.5 px-3 rounded-md transition-colors mb-0.5 ${activePageId === p.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
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
            </div>

            {/* Content */}
            <div className="preview-content flex-1 bg-white overflow-y-auto p-8">
                {!activePage ? (
                    <div className="flex h-full items-center justify-center text-gray-400">Выберите урок из меню слева</div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">{activePage.title}</h1>

                        <div className="prose max-w-none text-gray-700">
                            {activePage.kind === 'theory' && (
                                <div>
                                    {activePage.theory.videoUrl && (
                                        <div className="aspect-video bg-black rounded-lg mb-6 flex items-center justify-center text-white overflow-hidden shadow-lg">
                                            {/* В реальности тут был бы iframe */}
                                            <div className="text-center">
                                                <p className="font-bold">Video Player Mock</p>
                                                <p className="text-xs opacity-70">{activePage.theory.videoUrl}</p>
                                            </div>
                                        </div>
                                    )}
                                    {activePage.theory.mode === 'markdown' ? (
                                        <div className="markdown-preview whitespace-pre-wrap font-sans">
                                            {/* Эмуляция рендера MD - жирный шрифт заголовков */}
                                            {activePage.theory.markdown?.split('\n').map((line, i) =>
                                                line.startsWith('#')
                                                ? <p key={i} className="font-bold text-xl my-2">{line.replace(/^#+\s/, '')}</p>
                                                : <p key={i} className="mb-2">{line}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{activePage.theory.text}</div>
                                    )}

                                    {activePage.theory.attachments && activePage.theory.attachments.length > 0 && (
                                        <div className="mt-8 pt-4 border-t border-gray-100">
                                            <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Материалы</h4>
                                            <div className="flex gap-2">
                                                {activePage.theory.attachments.map((f, i) => (
                                                    <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded text-sm text-blue-600 hover:underline cursor-pointer">
                                                        📄 {f.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activePage.kind === 'quiz' && (
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <p className="font-medium text-lg mb-6">{activePage.quiz.question}</p>
                                    <div className="space-y-3">
                                        {activePage.quiz.options.map(opt => (
                                            <label key={opt.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all">
                                                <input type="radio" name="pq" className="w-5 h-5 text-blue-600" />
                                                <span className="text-gray-800">{opt.text}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <button className="btn btn-primary mt-6 w-full py-3 text-base shadow-lg shadow-blue-500/20">Отправить ответ</button>
                                </div>
                            )}

                            {activePage.kind === 'code' && (
                                <div>
                                    <div className="bg-blue-50 text-blue-900 p-5 rounded-lg mb-6 border border-blue-100 leading-relaxed">
                                        {activePage.code.description}
                                    </div>
                                    <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 text-xs font-mono text-gray-500 uppercase flex justify-between">
                                            <span>main.{activePage.code.language === 'python' ? 'py' : 'js'}</span>
                                            <span>{activePage.code.language}</span>
                                        </div>
                                        <div className="bg-[#1e1e1e] text-gray-300 p-4 font-mono text-sm min-h-[200px]">
                                            <span className="text-gray-500">// Пишите ваш код здесь...</span>
                                            <br/>
                                            <span className="text-purple-400">function</span> <span className="text-yellow-300">solution</span>() {'{'}
                                            <br/>&nbsp;&nbsp;<span className="text-gray-500">// ...</span><br/>
                                            {'}'}
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-4 items-center">
                                        <span className="text-xs text-gray-500">{activePage.code.testCases.length} тест-кейсов</span>
                                        <button className="btn btn-primary px-6">Запустить код ▶</button>
                                    </div>
                                </div>
                            )}

                            {activePage.kind === 'detailed' && (
                                <div className="space-y-6">
                                    <div className="bg-purple-50 p-5 rounded-lg border border-purple-100 text-purple-900">
                                        <h4 className="font-bold mb-2 text-purple-800">Задание</h4>
                                        {activePage.detailed.description}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Ваш ответ</label>
                                        <textarea className="form-input w-full h-32" placeholder="Напишите развернутый ответ..." />
                                    </div>
                                    <button className="btn btn-primary">Отправить на проверку</button>

                                    <div className="text-xs text-center text-gray-400 mt-4">
                                        Проверка осуществляется: {activePage.detailed.answerMode === 'exact' ? 'По точному совпадению' : 'С помощью AI ассистента'}
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
