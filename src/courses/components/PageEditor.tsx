import { useState } from 'react';
import type { LessonPage } from '@/courses/types';
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
  const [aiOpen, setAiOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (field: string, value: any) => {
    if (page.kind === 'theory') onUpdate({ ...page, theory: { ...page.theory, [field]: value } });
    else if (page.kind === 'quiz') onUpdate({ ...page, quiz: { ...page.quiz, [field]: value } });
    else if (page.kind === 'code') onUpdate({ ...page, code: { ...page.code, [field]: value } });
    else if (page.kind === 'detailed') onUpdate({ ...page, detailed: { ...page.detailed, [field]: value } });
  };

  const runAi = async (action: () => Promise<void>) => {
      setAiLoading(true);
      try { await action(); notify('AI: Готово', 'success'); setAiOpen(false); }
      catch (e) { notify('Ошибка AI', 'error'); }
      finally { setAiLoading(false); }
  };

  return (
    <div className="content-card relative">
       {/* AI Popup */}
       {aiOpen && (
          <div className="absolute top-16 right-8 w-64 bg-[var(--bg-surface)] border border-[var(--primary)] rounded-md shadow-lg p-4 z-20 animate-[slideUp_0.2s]">
              <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[var(--primary)] uppercase">AI Assistant</span>
                  <button onClick={() => setAiOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
              </div>
              {aiLoading ? <div className="text-sm py-2 text-center">Генерация...</div> : (
                  <div className="flex flex-col gap-2">
                      {page.kind === 'theory' && ['simplify', 'academic', 'grammar', 'expand'].map(mode => (
                          <button key={mode} className="btn btn-outline btn-sm w-full justify-start" onClick={() => runAi(async () => {
                             const txt = page.theory.mode==='markdown' ? page.theory.markdown : page.theory.text;
                             const res = await enhanceTextWithAi(txt || '', mode as any);
                             handleChange(page.theory.mode==='markdown'?'markdown':'text', res);
                          })}>
                             {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </button>
                      ))}
                      {page.kind === 'quiz' && <button className="btn btn-outline btn-sm" onClick={() => runAi(async () => {
                          const qs = await generateTestQuestionsWithAi(page.title, {count:1,type:'single',difficulty:'medium'});
                          handleChange('question', qs[0].question);
                          handleChange('options', qs[0].options.map(o => ({...o, id: Math.random().toString()})));
                      })}>Generate Question</button>}
                      {page.kind === 'code' && <button className="btn btn-outline btn-sm" onClick={() => runAi(async () => {
                          const res = await generateCodeTaskWithAi({theme:page.title, language:'javascript', difficulty:'medium'});
                          handleChange('description', res.description);
                      })}>Generate Task</button>}
                  </div>
              )}
          </div>
       )}

      <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
         <input
            className="text-xl font-bold bg-transparent border-none p-0 w-full text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:ring-0"
            value={page.title}
            onChange={e => onUpdate({...page, title: e.target.value})}
            placeholder="Название страницы"
         />
         <div className="flex gap-2">
             <button className={`btn ${aiOpen ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setAiOpen(!aiOpen)}>
                <Icons.Sparkles width={14} height={14} />
             </button>
             <button className="btn btn-primary btn-sm" onClick={onSave}>Сохранить</button>
         </div>
      </div>

      <div className="flex flex-col gap-6">
         {/* THEORY */}
         {page.kind === 'theory' && (
            <>
                <div className="flex gap-4 border-b border-[var(--border)] pb-2">
                    {['text', 'markdown', 'video'].map(m => (
                        <label key={m} className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                            <input type="radio" checked={page.theory.mode === m} onChange={() => handleChange('mode', m)} />
                            <span className="capitalize">{m}</span>
                        </label>
                    ))}
                </div>
                {(page.theory.mode === 'text' || page.theory.mode === 'markdown') && (
                    <textarea
                        className="form-input font-mono text-sm leading-relaxed"
                        rows={20}
                        value={page.theory.mode === 'text' ? page.theory.text : page.theory.markdown}
                        onChange={e => handleChange(page.theory.mode === 'text' ? 'text' : 'markdown', e.target.value)}
                        placeholder="Введите содержимое..."
                    />
                )}
                {page.theory.mode === 'video' && (
                    <input className="form-input" placeholder="https://youtube.com/..." value={page.theory.videoUrl} onChange={e => handleChange('videoUrl', e.target.value)} />
                )}
            </>
         )}

         {/* QUIZ */}
         {page.kind === 'quiz' && (
             <>
                <div className="form-field">
                    <label className="form-label">Вопрос</label>
                    <textarea className="form-input" rows={3} value={page.quiz.question} onChange={e => handleChange('question', e.target.value)} />
                </div>
                <div className="form-field">
                    <label className="form-label">Варианты ответов</label>
                    {page.quiz.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                            <input type="checkbox" checked={opt.isCorrect} onChange={() => {
                                const opts = [...page.quiz.options]; opts[i].isCorrect = !opts[i].isCorrect; handleChange('options', opts);
                            }} className="w-4 h-4" />
                            <input className="form-input" value={opt.text} onChange={e => {
                                const opts = [...page.quiz.options]; opts[i].text = e.target.value; handleChange('options', opts);
                            }} />
                            <button className="text-[var(--danger)] px-2" onClick={() => {
                                const opts = page.quiz.options.filter((_, idx) => idx !== i); handleChange('options', opts);
                            }}>×</button>
                        </div>
                    ))}
                    <button className="btn btn-outline btn-sm mt-2" onClick={() => {
                        const opts = [...page.quiz.options, {id: Date.now().toString(), text:'', isCorrect:false}]; handleChange('options', opts);
                    }}>+ Вариант</button>
                </div>
             </>
         )}

         {/* CODE */}
         {page.kind === 'code' && (
             <>
                <div className="form-field">
                    <label className="form-label">Описание задачи</label>
                    <textarea className="form-input" rows={4} value={page.code.description} onChange={e => handleChange('description', e.target.value)} />
                </div>
                <div className="form-field">
                    <label className="form-label">Язык</label>
                    <select className="form-input" value={page.code.language} onChange={e => handleChange('language', e.target.value)}>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                    </select>
                </div>
                <div className="form-field">
                    <label className="form-label">Тест-кейсы</label>
                    {page.code.testCases.map((tc, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                            <input className="form-input font-mono text-xs" placeholder="Input" value={tc.input} onChange={e => {
                                const tcs = [...page.code.testCases]; tcs[i].input = e.target.value; handleChange('testCases', tcs);
                            }} />
                            <input className="form-input font-mono text-xs" placeholder="Output" value={tc.output} onChange={e => {
                                const tcs = [...page.code.testCases]; tcs[i].output = e.target.value; handleChange('testCases', tcs);
                            }} />
                            <button className="text-[var(--danger)] px-2" onClick={() => {
                                const tcs = page.code.testCases.filter((_, idx) => idx !== i); handleChange('testCases', tcs);
                            }}>×</button>
                        </div>
                    ))}
                    <button className="btn btn-outline btn-sm" onClick={() => {
                         const tcs = [...page.code.testCases, {id:Date.now().toString(), input:'', output:''}]; handleChange('testCases', tcs);
                    }}>+ Тест</button>
                </div>
             </>
         )}
      </div>
    </div>
  );
}
