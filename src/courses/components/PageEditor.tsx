import { useState } from 'react';
import type { LessonPage } from '@/courses/types';
import { enhanceTextWithAi, generateCodeTaskWithAi, generateTestQuestionsWithAi } from '@/courses/ai';

interface PageEditorProps {
  page: LessonPage;
  onUpdate: (updatedPage: LessonPage) => void;
  onSave: () => void;
  notify: (msg: string, type?: 'success'|'error') => void;
}

export function PageEditor({ page, onUpdate, onSave, notify }: PageEditorProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);

  // Generic handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (field: string, value: any) => {
    if (page.kind === 'theory') onUpdate({ ...page, theory: { ...page.theory, [field]: value } });
    else if (page.kind === 'quiz') onUpdate({ ...page, quiz: { ...page.quiz, [field]: value } });
    else if (page.kind === 'code') onUpdate({ ...page, code: { ...page.code, [field]: value } });
    else if (page.kind === 'detailed') onUpdate({ ...page, detailed: { ...page.detailed, [field]: value } });
  };

  // AI Handlers
  const handleAiEnhanceText = async (mode: 'simplify' | 'academic' | 'grammar' | 'expand' | 'example') => {
    if (page.kind !== 'theory') return;
    const text = page.theory.mode === 'markdown' ? page.theory.markdown : page.theory.text;
    if (!text) { notify('Нет текста для улучшения', 'error'); return; }

    setAiLoading(true);
    try {
      const result = await enhanceTextWithAi(text, mode);
      handleChange(page.theory.mode === 'markdown' ? 'markdown' : 'text', result);
      notify('Текст улучшен', 'success');
      setAiMode(false);
    } catch (e) { notify('Ошибка AI сервиса', 'error'); }
    finally { setAiLoading(false); }
  };

  const handleAiGenerateTest = async () => {
    if (page.kind !== 'quiz') return;
    if (!page.title) { notify('Введите название страницы для контекста', 'error'); return; }

    setAiLoading(true);
    try {
      const questions = await generateTestQuestionsWithAi(page.title, { count: 1, type: 'single', difficulty: 'medium' });
      const q = questions[0];
      onUpdate({
        ...page,
        quiz: {
          question: q.question,
          options: q.options.map(o => ({ id: Math.random().toString(), text: o.text, isCorrect: o.isCorrect }))
        }
      });
      notify('Вопрос сгенерирован', 'success');
      setAiMode(false);
    } catch (e) { notify('Ошибка генерации', 'error'); }
    finally { setAiLoading(false); }
  };

  const handleAiGenerateCode = async () => {
    if (page.kind !== 'code') return;
    setAiLoading(true);
    try {
      const res = await generateCodeTaskWithAi({
        theme: page.title || 'Sort Array',
        language: 'javascript',
        difficulty: 'medium'
      });
      onUpdate({
        ...page,
        code: {
          ...page.code,
          description: res.description,
          language: res.language,
          testCases: res.testCases.map(tc => ({ id: Math.random().toString(), ...tc }))
        }
      });
      notify('Задание сгенерировано', 'success');
      setAiMode(false);
    } catch (e) { notify('Ошибка генерации', 'error'); }
    finally { setAiLoading(false); }
  };

  return (
    <div className="page-content flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
        <div>
           <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold mb-1">Редактирование страницы</div>
           <input
              className="text-2xl font-bold bg-transparent border-none p-0 w-full focus:ring-0"
              value={page.title}
              onChange={(e) => onUpdate({...page, title: e.target.value})}
              placeholder="Название страницы..."
           />
        </div>
        <div className="flex gap-2">
            <button className={`btn ${aiMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => setAiMode(!aiMode)}>
                ✨ AI Assistant
            </button>
            <button className="btn btn-primary" onClick={onSave}>Сохранить</button>
        </div>
      </div>

      {/* AI Overlay / Panel */}
      {aiMode && (
        <div className="ai-panel mb-6 animate-fade-in">
            <div className="ai-header">🤖 AI Помощник</div>
            {aiLoading ? (
                <div className="flex items-center gap-2 text-[var(--primary)]">
                    <span className="animate-spin">↻</span> Генерирую контент...
                </div>
            ) : (
                <div className="flex gap-2 flex-wrap">
                    {page.kind === 'theory' && (
                        <>
                            <button className="btn btn-outline btn-sm" onClick={() => handleAiEnhanceText('simplify')}>Упростить текст</button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleAiEnhanceText('academic')}>Академический стиль</button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleAiEnhanceText('grammar')}>Исправить ошибки</button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleAiEnhanceText('example')}>Добавить пример</button>
                        </>
                    )}
                    {page.kind === 'quiz' && (
                        <button className="btn btn-outline btn-sm" onClick={handleAiGenerateTest}>Сгенерировать вопрос по теме "{page.title}"</button>
                    )}
                    {page.kind === 'code' && (
                        <button className="btn btn-outline btn-sm" onClick={handleAiGenerateCode}>Создать задачу по коду</button>
                    )}
                    {page.kind === 'detailed' && (
                        <div className="text-sm text-[var(--text-secondary)]">Для этого типа страниц AI функции пока недоступны.</div>
                    )}
                </div>
            )}
        </div>
      )}

      {/* Editors */}
      <div className="flex-1 overflow-y-auto pr-2">
      {/* THEORY */}
      {page.kind === 'theory' && (
        <div className="flex flex-col gap-4">
          <div className="form-field">
            <label className="form-label">Формат</label>
            <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="radio" checked={page.theory.mode === 'text'} onChange={() => handleChange('mode', 'text')} /> Текст</label>
                <label className="flex items-center gap-2"><input type="radio" checked={page.theory.mode === 'markdown'} onChange={() => handleChange('mode', 'markdown')} /> Markdown</label>
                <label className="flex items-center gap-2"><input type="radio" checked={page.theory.mode === 'video'} onChange={() => handleChange('mode', 'video')} /> Видео</label>
            </div>
          </div>

          {(page.theory.mode === 'text' || page.theory.mode === 'markdown') && (
            <textarea
                className="form-input font-mono text-sm leading-relaxed"
                rows={15}
                value={page.theory.mode === 'text' ? page.theory.text : page.theory.markdown}
                onChange={(e) => handleChange(page.theory.mode === 'text' ? 'text' : 'markdown', e.target.value)}
                placeholder="Введите содержимое урока..."
            />
          )}

          {page.theory.mode === 'video' && (
             <div className="form-field">
                <label className="form-label">URL Видео</label>
                <input className="form-input" placeholder="https://youtube.com/..." value={page.theory.videoUrl} onChange={e => handleChange('videoUrl', e.target.value)} />
             </div>
          )}

           <div className="form-field mt-4 border-t pt-4 border-[var(--border)]">
               <label className="form-label">Приложения</label>
               <input type="file" className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-violet-50 file:text-violet-700
                  hover:file:bg-violet-100
                "
                onChange={(e) => {
                    if(e.target.files?.[0]) {
                        handleChange('attachmentName', e.target.files[0].name);
                        handleChange('attachmentSize', e.target.files[0].size);
                    }
                }}
               />
               {page.theory.attachmentName && <div className="mt-2 text-sm font-medium">📎 {page.theory.attachmentName}</div>}
           </div>
        </div>
      )}

      {/* QUIZ */}
      {page.kind === 'quiz' && (
        <div className="flex flex-col gap-4">
            <div className="form-field">
                <label className="form-label">Вопрос теста</label>
                <textarea className="form-input" rows={3} value={page.quiz.question} onChange={e => handleChange('question', e.target.value)} />
            </div>

            <div className="form-field">
                <label className="form-label flex justify-between">
                    <span>Варианты ответов</span>
                    <span className="text-xs font-normal text-[var(--text-tertiary)]">Отметьте правильный</span>
                </label>
                {page.quiz.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                        <input type="checkbox" checked={opt.isCorrect} onChange={() => {
                             const newOpts = [...page.quiz.options];
                             newOpts[i].isCorrect = !newOpts[i].isCorrect;
                             handleChange('options', newOpts);
                        }} className="w-5 h-5 accent-[var(--primary)]" />
                        <input className="form-input" value={opt.text} onChange={e => {
                            const newOpts = [...page.quiz.options];
                            newOpts[i].text = e.target.value;
                            handleChange('options', newOpts);
                        }} placeholder={`Вариант ${i+1}`} />
                        <button onClick={() => {
                             const newOpts = page.quiz.options.filter((_, idx) => idx !== i);
                             handleChange('options', newOpts);
                        }} className="text-[var(--danger)] text-lg hover:bg-red-50 px-2 rounded">×</button>
                    </div>
                ))}
                <button className="btn btn-outline btn-sm mt-2" onClick={() => {
                     const newOpts = [...page.quiz.options, {id: Date.now().toString(), text: '', isCorrect: false}];
                     handleChange('options', newOpts);
                }}>+ Добавить вариант</button>
            </div>
        </div>
      )}

      {/* CODE */}
      {page.kind === 'code' && (
         <div className="flex flex-col gap-4">
            <div className="form-field">
                <label className="form-label">Текст задачи</label>
                <textarea className="form-input" rows={4} value={page.code.description} onChange={e => handleChange('description', e.target.value)} />
            </div>
            <div className="form-field">
                <label className="form-label">Язык программирования</label>
                <select className="form-input" value={page.code.language} onChange={e => handleChange('language', e.target.value)}>
                    <option value="">Выбрать...</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                </select>
            </div>
            <div className="form-field">
                <label className="form-label">Тест-кейсы (Input to Output)</label>
                {page.code.testCases.map((tc, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2">
                        <input className="form-input font-mono text-sm" placeholder="Input" value={tc.input} onChange={e => {
                            const updated = [...page.code.testCases]; updated[i].input = e.target.value; handleChange('testCases', updated);
                        }} />
                        <input className="form-input font-mono text-sm" placeholder="Output" value={tc.output} onChange={e => {
                            const updated = [...page.code.testCases]; updated[i].output = e.target.value; handleChange('testCases', updated);
                        }} />
                        <button onClick={() => {
                             const updated = page.code.testCases.filter((_, idx) => idx !== i);
                             handleChange('testCases', updated);
                        }} className="text-[var(--danger)] px-2">×</button>
                    </div>
                ))}
                <button className="btn btn-outline btn-sm" onClick={() => {
                     const updated = [...page.code.testCases, {id: Date.now().toString(), input: '', output: ''}];
                     handleChange('testCases', updated);
                }}>+ Добавить тест</button>
            </div>
         </div>
      )}

      {/* DETAILED ANSWER */}
      {page.kind === 'detailed' && (
         <div className="flex flex-col gap-4">
            <div className="form-field">
                <label className="form-label">Описание задания</label>
                <textarea className="form-input" rows={4} value={page.detailed.description} onChange={e => handleChange('description', e.target.value)} />
            </div>
            <div className="form-field">
                <label className="form-label">Эталонный ответ (для проверки)</label>
                <textarea className="form-input" rows={6} value={page.detailed.answer} onChange={e => handleChange('answer', e.target.value)} />
            </div>
            <div className="form-field">
                <label className="form-label">Режим проверки</label>
                <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-[var(--bg-app)]">
                        <input type="radio" name="mode" checked={page.detailed.answerMode === 'exact'} onChange={() => handleChange('answerMode', 'exact')} />
                        <div>
                            <div className="font-bold text-sm">Точное совпадение</div>
                            <div className="text-xs text-[var(--text-secondary)]">Строгое сравнение текста</div>
                        </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-[var(--bg-app)]">
                        <input type="radio" name="mode" checked={page.detailed.answerMode === 'prompt'} onChange={() => handleChange('answerMode', 'prompt')} />
                        <div>
                            <div className="font-bold text-sm">AI Промт</div>
                            <div className="text-xs text-[var(--text-secondary)]">ИИ проверит смысловую близость</div>
                        </div>
                    </label>
                </div>
            </div>
         </div>
      )}
      </div>
    </div>
  );
}
