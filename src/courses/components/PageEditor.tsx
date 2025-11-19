import { useState } from 'react';
import type {
    LessonPage,
    TheoryPageContent,
    QuizPageContent,
    CodePageContent,
    DetailedAnswerPageContent,
    QuizOption,
    CodeTestCase
} from '@/courses/types';
import { enhanceTextWithAi, generateCodeTaskWithAi, generateTestQuestionsWithAi } from '@/courses/ai';
import { Icons } from '@/components/Icons';

interface PageEditorProps {
  page: LessonPage;
  onUpdate: (updatedPage: LessonPage) => void;
  onSave: () => void;
  notify: (msg: string, type?: 'success'|'error') => void;
}

export function PageEditor({ page, onUpdate, onSave, notify }: PageEditorProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModal, setAiModal] = useState<'text' | 'quiz' | 'code' | null>(null);

  // AI Params
  const [testParams, setTestParams] = useState({ count: 3, diff: 'medium' as const });
  const [codeParams, setCodeParams] = useState({ lang: 'javascript', diff: 'medium' as const, theme: '' });

  // Типизированные хелперы для обновления состояния
  const updateTheory = (changes: Partial<TheoryPageContent>) => {
      if (page.kind === 'theory') {
          onUpdate({ ...page, theory: { ...page.theory, ...changes } });
      }
  };

  const updateQuiz = (changes: Partial<QuizPageContent>) => {
      if (page.kind === 'quiz') {
          onUpdate({ ...page, quiz: { ...page.quiz, ...changes } });
      }
  };

  const updateCode = (changes: Partial<CodePageContent>) => {
      if (page.kind === 'code') {
          onUpdate({ ...page, code: { ...page.code, ...changes } });
      }
  };

  const updateDetailed = (changes: Partial<DetailedAnswerPageContent>) => {
      if (page.kind === 'detailed') {
          onUpdate({ ...page, detailed: { ...page.detailed, ...changes } });
      }
  };

  const handleAiAction = async (action: () => Promise<void>) => {
      setAiLoading(true);
      try {
          await action();
          notify('AI: Готово', 'success');
          setAiModal(null);
      } catch (e) {
          const err = e as Error;
          notify(err.message === 'INSUFFICIENT_CONTEXT' ? 'Мало контекста' : 'Ошибка AI', 'error');
      } finally {
          setAiLoading(false);
      }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
       {/* HEADER */}
       <div className="flex justify-between items-center pb-4 mb-6 border-b border-[var(--border-subtle)]">
         <div className="flex-1 mr-4">
             <label className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">Заголовок</label>
             <input
                className="text-2xl font-bold bg-transparent border-none p-0 w-full text-[var(--text-primary)] focus:ring-0 placeholder-[var(--text-tertiary)]"
                value={page.title}
                onChange={e => onUpdate({...page, title: e.target.value})}
                placeholder="Название страницы..."
             />
         </div>
         <div className="flex items-center gap-3">
             {page.kind === 'theory' && (page.theory.text || page.theory.markdown) && (
                 <button className="btn btn-outline btn-sm text-[var(--primary)]" onClick={() => setAiModal('text')}>
                    <Icons.Sparkles width={14} height={14} /> AI Rewrite
                 </button>
             )}
             {page.kind === 'quiz' && (
                 <button className="btn btn-outline btn-sm text-[var(--primary)]" onClick={() => setAiModal('quiz')}>
                    <Icons.Sparkles width={14} height={14} /> AI Quiz
                 </button>
             )}
             {page.kind === 'code' && (
                 <button className="btn btn-outline btn-sm text-[var(--primary)]" onClick={() => setAiModal('code')}>
                    <Icons.Sparkles width={14} height={14} /> AI Task
                 </button>
             )}

             <div className="h-6 w-[1px] bg-[var(--border-subtle)] mx-1"></div>
             <button className="btn btn-primary btn-sm px-6" onClick={onSave}>Сохранить</button>
         </div>
      </div>

      {/* AI MODAL */}
      {aiModal && (
          <div className="absolute inset-0 bg-[var(--bg-app)]/80 z-20 flex items-center justify-center p-8 backdrop-blur-md animate-[fadeIn_0.2s]">
              <div className="bg-[var(--bg-surface)] border border-[var(--primary)] shadow-glow rounded-lg p-6 w-full max-w-md relative">
                  <button onClick={() => setAiModal(null)} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-white">✕</button>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                    <Icons.Sparkles className="text-[var(--primary)]"/> AI Ассистент
                  </h3>

                  {aiLoading ? (
                      <div className="py-8 text-center text-[var(--text-secondary)]">
                          <div className="animate-spin w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-2"></div>
                          Генерирую контент...
                      </div>
                  ) : (
                      <>
                        {aiModal === 'text' && page.kind === 'theory' && (
                            <div className="flex flex-col gap-2">
                                {['simplify', 'academic', 'grammar', 'expand', 'example'].map(mode => (
                                    <button key={mode} className="btn btn-outline justify-start hover:border-[var(--primary)]" onClick={() => handleAiAction(async () => {
                                        const field = page.theory.mode === 'markdown' ? 'markdown' : 'text';
                                        const txt = page.theory[field] || '';
                                        const res = await enhanceTextWithAi(txt, mode as any);
                                        updateTheory({ [field]: res });
                                    })}>
                                        {mode === 'simplify' ? '💡 Упростить' : mode === 'academic' ? '🎓 Академичный стиль' : mode === 'grammar' ? '✍️ Грамматика' : mode === 'expand' ? '➕ Расширить' : '📝 Пример'}
                                    </button>
                                ))}
                            </div>
                        )}

                        {aiModal === 'quiz' && page.kind === 'quiz' && (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="form-label">Вопросов</label>
                                    <input type="number" min={1} max={5} className="form-input" value={testParams.count} onChange={e => setTestParams({...testParams, count: +e.target.value})} />
                                </div>
                                <button className="btn btn-primary w-full" onClick={() => handleAiAction(async () => {
                                    const qs = await generateTestQuestionsWithAi(page.title, {count: testParams.count, type: 'single', difficulty: testParams.diff});
                                    updateQuiz({ question: qs[0].question, options: qs[0].options.map(o => ({...o, id: Math.random().toString()})) });
                                })}>Сгенерировать</button>
                            </div>
                        )}

                        {aiModal === 'code' && page.kind === 'code' && (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="form-label">Тема</label>
                                    <input className="form-input" value={codeParams.theme} onChange={e => setCodeParams({...codeParams, theme: e.target.value})} placeholder="Алгоритм..." />
                                </div>
                                <button className="btn btn-primary w-full" onClick={() => handleAiAction(async () => {
                                    const res = await generateCodeTaskWithAi({theme: codeParams.theme || page.title, language: codeParams.lang as any, difficulty: 'medium'});
                                    updateCode({ description: res.description, language: res.language, testCases: res.testCases.map(tc => ({...tc, id: Math.random().toString()})) });
                                })}>Сгенерировать</button>
                            </div>
                        )}
                      </>
                  )}
              </div>
          </div>
      )}

      {/* EDITOR BODY */}
      <div className="flex-1 overflow-y-auto pr-2">
         {/* THEORY */}
         {page.kind === 'theory' && (
            <div className="flex flex-col gap-4">
                <div className="flex bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border-subtle)] w-fit mb-2">
                    {['text', 'markdown', 'video'].map(m => (
                        <button
                            key={m}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${page.theory.mode === m ? 'bg-[var(--primary-soft)] text-[var(--primary-text)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            onClick={() => updateTheory({ mode: m as any })}
                        >
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                    ))}
                </div>

                {(page.theory.mode === 'text' || page.theory.mode === 'markdown') && (
                    <textarea
                        className="form-input font-mono text-sm leading-relaxed resize-y min-h-[400px] bg-[rgba(0,0,0,0.2)] focus:ring-2 ring-[var(--primary-soft)]"
                        value={page.theory.mode === 'text' ? (page.theory.text || '') : (page.theory.markdown || '')}
                        onChange={e => updateTheory(page.theory.mode === 'text' ? { text: e.target.value } : { markdown: e.target.value })}
                        placeholder="Контент..."
                    />
                )}

                {page.theory.mode === 'video' && (
                    <div className="p-8 border-2 border-dashed border-[var(--border-strong)] rounded-lg text-center bg-[rgba(0,0,0,0.1)]">
                        <label className="form-label mb-2">Ссылка на видео</label>
                        <input className="form-input max-w-lg mx-auto" placeholder="https://..." value={page.theory.videoUrl || ''} onChange={e => updateTheory({ videoUrl: e.target.value })} />
                    </div>
                )}
            </div>
         )}

         {/* QUIZ */}
         {page.kind === 'quiz' && (
             <div className="max-w-3xl">
                <div className="form-field mb-6">
                    <label className="form-label">Вопрос</label>
                    <textarea className="form-input text-lg" rows={3} value={page.quiz.question} onChange={e => updateQuiz({ question: e.target.value })} />
                </div>
                <div className="space-y-3">
                    <label className="form-label">Варианты ответов</label>
                    {page.quiz.options.map((opt, i) => (
                        <div key={opt.id} className={`flex items-center gap-3 p-3 border rounded-md ${opt.isCorrect ? 'border-green-500/50 bg-green-500/10' : 'border-[var(--border-subtle)] bg-[var(--bg-input)]'}`}>
                            <input type="radio" checked={opt.isCorrect} onChange={() => updateQuiz({ options: page.quiz.options.map((o, idx) => ({...o, isCorrect: idx === i})) })} className="w-5 h-5 accent-green-500 cursor-pointer" />
                            <input className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-[var(--text-primary)]" value={opt.text} onChange={e => {
                                const opts = [...page.quiz.options]; opts[i].text = e.target.value; updateQuiz({ options: opts });
                            }} placeholder={`Вариант ${i+1}`} />
                            <button className="text-[var(--text-tertiary)] hover:text-[var(--danger)] px-2" onClick={() => updateQuiz({ options: page.quiz.options.filter((_, idx) => idx !== i) })}>✕</button>
                        </div>
                    ))}
                    <button className="btn btn-outline btn-sm w-full border-dashed" onClick={() => updateQuiz({ options: [...page.quiz.options, {id: Date.now().toString(), text:'', isCorrect:false}] })}>+ Добавить вариант</button>
                </div>
             </div>
         )}

         {/* CODE */}
         {page.kind === 'code' && (
             <div className="flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2">
                         <label className="form-label">Описание задачи</label>
                         <textarea className="form-input min-h-[120px]" value={page.code.description} onChange={e => updateCode({ description: e.target.value })} />
                    </div>
                    <div>
                         <label className="form-label">Язык</label>
                         <select className="form-input" value={page.code.language} onChange={e => updateCode({ language: e.target.value as any })}>
                             <option value="javascript">JavaScript</option>
                             <option value="python">Python</option>
                             <option value="java">Java</option>
                         </select>
                    </div>
                </div>
                <div>
                    <label className="form-label flex justify-between"><span>Тест-кейсы</span> <span className="text-[var(--text-tertiary)] font-normal">{page.code.testCases.length} шт</span></label>
                    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-[var(--bg-input)] border-b border-[var(--border-subtle)]"><tr><th className="text-left p-3">Input</th><th className="text-left p-3">Output</th><th className="w-10"></th></tr></thead>
                            <tbody className="divide-y divide-[var(--border-subtle)]">
                                {page.code.testCases.map((tc, i) => (
                                    <tr key={tc.id}>
                                        <td className="p-2"><input className="form-input font-mono text-xs bg-[var(--bg-app)]" value={tc.input} onChange={e => { const tcs = [...page.code.testCases]; tcs[i].input = e.target.value; updateCode({ testCases: tcs }); }} /></td>
                                        <td className="p-2"><input className="form-input font-mono text-xs bg-[var(--bg-app)]" value={tc.output} onChange={e => { const tcs = [...page.code.testCases]; tcs[i].output = e.target.value; updateCode({ testCases: tcs }); }} /></td>
                                        <td className="p-2 text-center"><button className="text-[var(--text-tertiary)] hover:text-[var(--danger)]" onClick={() => updateCode({ testCases: page.code.testCases.filter((_, idx) => idx !== i) })}>✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button className="w-full py-2 text-sm text-[var(--primary-hover)] hover:bg-[rgba(255,255,255,0.03)]" onClick={() => updateCode({ testCases: [...page.code.testCases, {id:Date.now().toString(), input:'', output:''}] })}>+ Добавить тест</button>
                    </div>
                </div>
             </div>
         )}

         {/* DETAILED */}
         {page.kind === 'detailed' && (
             <div className="max-w-3xl">
                 <div className="form-field">
                     <label className="form-label">Задание</label>
                     <textarea className="form-input" rows={4} value={page.detailed.description} onChange={e => updateDetailed({ description: e.target.value })} />
                 </div>
                 <div className="form-field">
                     <label className="form-label">Эталонный ответ</label>
                     <textarea className="form-input" rows={6} value={page.detailed.answer} onChange={e => updateDetailed({ answer: e.target.value })} />
                 </div>
             </div>
         )}
      </div>
    </div>
  );
}
