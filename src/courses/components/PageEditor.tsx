import { useState } from 'react';
import type {
  LessonPage,
  TheoryPageContent,
  QuizPageContent,
  CodePageContent,
  DetailedAnswerPageContent,
  AttachedFile,
} from '@/courses/types';
import {
  enhanceTextWithAi,
  generateCodeTaskWithAi,
  generateTestQuestionsWithAi,
} from '@/courses/ai';
import { Icons } from '@/components/Icons';

interface PageEditorProps {
  page: LessonPage;
  onUpdate: (updatedPage: LessonPage) => void;
  onSave: () => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export function PageEditor({ page, onUpdate, onSave, notify }: PageEditorProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModal, setAiModal] = useState<'text' | 'quiz' | 'code' | null>(null);

  // Params for AI generators
  const [testParams] = useState({ count: 3, diff: 'medium' as const });
  const [codeParams, setCodeParams] = useState({
    lang: 'javascript',
    diff: 'medium' as const,
    theme: '',
  });

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
      notify((e as Error).message, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Mock file upload
  const handleFileUpload = () => {
    const mockFile: AttachedFile = {
      id: Date.now().toString(),
      name: `Material_${Math.floor(Math.random() * 100)}.pdf`,
      size: 1024 * 1024,
      type: 'application/pdf',
    };

    if (page.kind === 'theory') {
      updateTheory({ attachments: [...(page.theory.attachments || []), mockFile] });
      notify('Файл добавлен');
    }
  };

  const kindLabel =
    page.kind === 'theory'
      ? 'Теория'
      : page.kind === 'quiz'
      ? 'Тестовый вопрос'
      : page.kind === 'code'
      ? 'Задача с кодом'
      : 'Развёрнутый ответ';

  return (
    <div className="editor-shell relative">
      {/* HEADER / TOOLBAR */}
      <div className="editor-toolbar px-6">
        <div className="flex items-center gap-3 flex-1 pr-6">
          <span className="badge badge-draft">{kindLabel}</span>

          <input
            className="flex-1 bg-transparent border-none text-lg font-semibold leading-tight text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-0"
            value={page.title}
            onChange={e => onUpdate({ ...page, title: e.target.value })}
            placeholder="Заголовок страницы..."
          />
        </div>

        <div className="flex items-center gap-2">
          {/* AI Buttons */}
          {page.kind === 'theory' &&
            (page.theory.text || page.theory.markdown) && (
              <button
                className="btn btn-outline btn-sm text-[var(--primary)] border-[var(--border-subtle)] bg-[rgba(15,23,42,0.7)] hover:bg-[var(--primary-soft)]"
                onClick={() => setAiModal('text')}
              >
                <Icons.Sparkles width={14} />
                <span>AI Improve</span>
              </button>
            )}

          {page.kind === 'quiz' && (
            <button
              className="btn btn-outline btn-sm text-[var(--primary)] border-[var(--border-subtle)] bg-[rgba(15,23,42,0.7)] hover:bg-[var(--primary-soft)]"
              onClick={() => setAiModal('quiz')}
            >
              <Icons.Sparkles width={14} />
              <span>AI Quiz</span>
            </button>
          )}

          {page.kind === 'code' && (
            <button
              className="btn btn-outline btn-sm text-[var(--primary)] border-[var(--border-subtle)] bg-[rgba(15,23,42,0.7)] hover:bg-[var(--primary-soft)]"
              onClick={() => setAiModal('code')}
            >
              <Icons.Sparkles width={14} />
              <span>AI Task</span>
            </button>
          )}

          <div className="w-px h-6 mx-2 bg-[var(--border-subtle)]" />

          <button className="btn btn-primary btn-sm px-6" onClick={onSave}>
            Сохранить
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="editor-body">
        <div className="content-area">
          <div
            className="content-card flex flex-col"
            style={{ boxShadow: 'var(--shadow-soft)' }}
          >
            {/* --- THEORY EDITOR --- */}
            {page.kind === 'theory' && (
              <div className="flex flex-col h-full">
                {/* Mode toolbar */}
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="tabs">
                    {['text', 'markdown', 'video'].map(m => (
                      <button
                        key={m}
                        className={
                          'tab-btn ' +
                          (page.theory.mode === m ? 'active' : '')
                        }
                        onClick={() => updateTheory({ mode: m as any })}
                      >
                        {m === 'text'
                          ? 'Текст'
                          : m === 'markdown'
                          ? 'Markdown'
                          : 'Видео'}
                      </button>
                    ))}
                  </div>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleFileUpload}
                  >
                    + Файл
                  </button>
                </div>

                {/* Attachments */}
                {page.theory.attachments &&
                  page.theory.attachments.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {page.theory.attachments.map((f, i) => (
                        <div
                          key={f.id || i}
                          className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(15,23,42,0.9)] px-3 py-1 text-xs text-[var(--text-secondary)]"
                        >
                          <span>📄 {f.name}</span>
                          <button
                            className="text-[var(--danger)] hover:opacity-80"
                            onClick={() => {
                              const next = [...page.theory.attachments!];
                              next.splice(i, 1);
                              updateTheory({ attachments: next });
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Main input area */}
                <div className="flex-1 min-h-[260px]">
                  {/* TEXT MODE */}
                  {page.theory.mode === 'text' && (
                    <textarea
                      className="w-full h-full min-h-[260px] resize-none rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-soft)] px-4 py-3 font-mono text-sm leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-0 focus:border-[var(--border-strong)]"
                      value={page.theory.text || ''}
                      onChange={e =>
                        updateTheory({ text: e.target.value })
                      }
                      placeholder="Введите текст урока..."
                    />
                  )}

                  {/* MARKDOWN MODE */}
                  {page.theory.mode === 'markdown' && (
                    <div className="grid h-full min-h-[260px] grid-cols-2 gap-4">
                      <div className="flex flex-col rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-soft)]">
                        <div className="border-b border-[var(--border-subtle)] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                          Source
                        </div>
                        <textarea
                          className="flex-1 w-full resize-none bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-0"
                          value={page.theory.markdown || ''}
                          onChange={e =>
                            updateTheory({ markdown: e.target.value })
                          }
                          placeholder="# Заголовок..."
                        />
                      </div>
                      <div className="flex flex-col rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-soft)]">
                        <div className="border-b border-[var(--border-subtle)] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                          Preview
                        </div>
                        <div className="prose prose-sm max-w-none flex-1 overflow-y-auto px-4 py-3 text-[var(--text-primary)]">
                          {page.theory.markdown ? (
                            <div style={{ whiteSpace: 'pre-wrap' }}>
                              {page.theory.markdown}
                            </div>
                          ) : (
                            <span className="italic text-[var(--text-tertiary)]">
                              Предпросмотр...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VIDEO MODE */}
                  {page.theory.mode === 'video' && (
                    <div className="flex h-full min-h-[260px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-soft)]">
                      <div className="w-full max-w-md rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center shadow-subtle">
                        <div className="mb-4 text-[var(--text-tertiary)]">
                          <Icons.File
                            width={40}
                            height={40}
                            className="mx-auto"
                          />
                        </div>
                        <label className="form-label">Ссылка на видео</label>
                        <input
                          className="form-input"
                          placeholder="https://youtube.com/..."
                          value={page.theory.videoUrl || ''}
                          onChange={e =>
                            updateTheory({ videoUrl: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- QUIZ EDITOR --- */}
            {page.kind === 'quiz' && (
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
                <div>
                  <label className="form-label text-xs">
                    Текст вопроса
                  </label>
                  <textarea
                    className="form-input min-h-[110px] text-base leading-relaxed"
                    value={page.quiz.question}
                    onChange={e =>
                      updateQuiz({ question: e.target.value })
                    }
                    placeholder="Сформулируйте вопрос..."
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <label className="form-label text-xs">
                      Варианты ответов
                    </label>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {page.quiz.options.length} / 10
                    </span>
                  </div>

                  {page.quiz.options.map((opt, i) => {
                    const isCorrect = opt.isCorrect;
                    return (
                      <div
                        key={opt.id}
                        className={[
                          'flex items-center gap-3 rounded-[var(--radius-md)] border px-3 py-3 transition-all',
                          isCorrect
                            ? 'border-[var(--success)] bg-[var(--success-soft)] shadow-subtle'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface-soft)] hover:border-[var(--border-strong)]',
                        ].join(' ')}
                      >
                        <div className="flex h-full items-center">
                          <input
                            type="radio"
                            name="correct-opt"
                            checked={isCorrect}
                            onChange={() =>
                              updateQuiz({
                                options: page.quiz.options.map((o, idx) => ({
                                  ...o,
                                  isCorrect: idx === i,
                                })),
                              })
                            }
                            className="h-4 w-4 cursor-pointer accent-[var(--success)]"
                          />
                        </div>
                        <input
                          className="flex-1 border-none bg-transparent p-0 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-0"
                          value={opt.text}
                          onChange={e => {
                            const opts = [...page.quiz.options];
                            opts[i].text = e.target.value;
                            updateQuiz({ options: opts });
                          }}
                          placeholder={`Вариант ${i + 1}`}
                        />
                        <button
                          className="rounded-md p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                          onClick={() =>
                            updateQuiz({
                              options: page.quiz.options.filter(
                                (_, idx) => idx !== i,
                              ),
                            })
                          }
                        >
                          <Icons.Trash width={16} height={16} />
                        </button>
                      </div>
                    );
                  })}

                  <button
                    className="mt-3 w-full rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[rgba(15,23,42,0.7)] py-3 text-sm font-medium text-[var(--text-secondary)] transition-all hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                    onClick={() => {
                      if (page.quiz.options.length < 10) {
                        updateQuiz({
                          options: [
                            ...page.quiz.options,
                            { id: Date.now().toString(), text: '', isCorrect: false },
                          ],
                        });
                      }
                    }}
                  >
                    + Добавить вариант
                  </button>
                </div>
              </div>
            )}

            {/* --- CODE EDITOR --- */}
            {page.kind === 'code' && (
              <div className="flex h-full flex-col gap-4 lg:flex-row">
                <div className="flex-1 space-y-6 border-b border-[var(--border-subtle)] pb-4 pr-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
                  <div>
                    <label className="form-label">Описание задачи</label>
                    <textarea
                      className="form-input min-h-[150px]"
                      value={page.code.description}
                      onChange={e =>
                        updateCode({ description: e.target.value })
                      }
                      placeholder="Опишите задачу..."
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="form-label">
                        Язык исполнения
                      </label>
                      <select
                        className="form-input"
                        value={page.code.language}
                        onChange={e =>
                          updateCode({
                            language: e.target.value as any,
                          })
                        }
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                      </select>
                    </div>
                    {/* Можно расширить параметрами сложности, если нужно */}
                  </div>
                </div>

                <div className="w-full flex-1 rounded-[var(--radius-md)] bg-[var(--bg-surface-soft)] lg:w-[420px]">
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    <span>Тест-кейсы</span>
                    <span className="badge badge-draft">
                      {page.code.testCases.length}
                    </span>
                  </div>
                  <div className="flex max-h-[420px] flex-1 flex-col gap-3 overflow-y-auto p-4">
                    {page.code.testCases.map((tc, i) => (
                      <div
                        key={tc.id}
                        className="group rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-subtle"
                      >
                        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                          <span>Test #{i + 1}</span>
                          <button
                            className="opacity-60 transition-opacity hover:opacity-100 hover:text-[var(--danger)]"
                            onClick={() =>
                              updateCode({
                                testCases: page.code.testCases.filter(
                                  (_, idx) => idx !== i,
                                ),
                              })
                            }
                          >
                            Удалить
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                              Input
                            </label>
                            <input
                              className="form-input py-1 px-2 text-xs font-mono"
                              value={tc.input}
                              onChange={e => {
                                const tcs = [...page.code.testCases];
                                tcs[i].input = e.target.value;
                                updateCode({ testCases: tcs });
                              }}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                              Output
                            </label>
                            <input
                              className="form-input py-1 px-2 text-xs font-mono"
                              value={tc.output}
                              onChange={e => {
                                const tcs = [...page.code.testCases];
                                tcs[i].output = e.target.value;
                                updateCode({ testCases: tcs });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      className="btn btn-outline w-full border-dashed bg-[rgba(15,23,42,0.7)]"
                      onClick={() =>
                        updateCode({
                          testCases: [
                            ...page.code.testCases,
                            { id: Date.now().toString(), input: '', output: '' },
                          ],
                        })
                      }
                    >
                      + Добавить кейс
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- DETAILED ANSWER --- */}
            {page.kind === 'detailed' && (
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                <div>
                  <label className="form-label">Задание</label>
                  <textarea
                    className="form-input min-h-[120px]"
                    value={page.detailed.description}
                    onChange={e =>
                      updateDetailed({ description: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--primary-soft)] bg-[var(--primary-soft)] px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--primary-text)]">
                      Режим проверки
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      Как система будет оценивать ответ?
                    </div>
                  </div>
                  <div className="flex rounded-[var(--radius-pill)] bg-[rgba(15,23,42,0.8)] p-1 shadow-subtle">
                    <button
                      className={
                        'px-3 py-1 text-xs font-bold rounded-[var(--radius-pill)] transition-all ' +
                        (page.detailed.answerMode === 'exact'
                          ? 'bg-[var(--primary)] text-[var(--primary-text)] shadow-subtle'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')
                      }
                      onClick={() =>
                        updateDetailed({ answerMode: 'exact' })
                      }
                    >
                      Точное
                    </button>
                    <button
                      className={
                        'px-3 py-1 text-xs font-bold rounded-[var(--radius-pill)] transition-all ' +
                        (page.detailed.answerMode === 'prompt'
                          ? 'bg-[var(--primary)] text-[var(--primary-text)] shadow-subtle'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')
                      }
                      onClick={() =>
                        updateDetailed({ answerMode: 'prompt' })
                      }
                    >
                      AI Промт
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    {page.detailed.answerMode === 'exact'
                      ? 'Эталонный ответ'
                      : 'Инструкция для AI (Промт)'}
                  </label>
                  <textarea
                    className={[
                      'form-input min-h-[220px] font-mono text-sm',
                      page.detailed.answerMode === 'prompt'
                        ? 'bg-[rgba(76,29,149,0.18)] border-[rgba(129,140,248,0.6)]'
                        : '',
                    ].join(' ')}
                    value={page.detailed.answer}
                    onChange={e =>
                      updateDetailed({ answer: e.target.value })
                    }
                    placeholder={
                      page.detailed.answerMode === 'prompt'
                        ? 'Опиши критерии, по которым нужно проверить ответ студента...'
                        : 'Текст ответа...'
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI MODAL */}
      {aiModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-soft">
            <button
              className="absolute right-4 top-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              onClick={() => setAiModal(null)}
            >
              ✕
            </button>

            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
              <Icons.Sparkles className="text-[var(--primary)]" />
              AI Генерация
            </h3>

            {aiLoading ? (
              <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
                Генерируем...
              </div>
            ) : (
              <div className="space-y-4">
                {aiModal === 'code' && (
                  <>
                    <label className="form-label">Тема задачи</label>
                    <input
                      className="form-input"
                      value={codeParams.theme}
                      onChange={e =>
                        setCodeParams({
                          ...codeParams,
                          theme: e.target.value,
                        })
                      }
                      placeholder={page.title || 'Тема задачи'}
                    />
                    <button
                      className="btn btn-primary w-full mt-2"
                      onClick={() =>
                        handleAiAction(async () => {
                          const res = await generateCodeTaskWithAi({
                            theme: codeParams.theme || page.title,
                            language: codeParams.lang as any,
                            difficulty: 'medium',
                          });
                          updateCode({
                            description: res.description,
                            language: res.language,
                            testCases: res.testCases.map(tc => ({
                              ...tc,
                              id: Math.random().toString(),
                            })),
                          });
                        })
                      }
                    >
                      Сгенерировать задачу
                    </button>
                  </>
                )}

                {aiModal === 'quiz' && (
                  <button
                    className="btn btn-primary w-full"
                    onClick={() =>
                      handleAiAction(async () => {
                        const qs = await generateTestQuestionsWithAi(
                          page.title,
                          {
                            count: testParams.count,
                            type: 'single',
                            difficulty: testParams.diff,
                          },
                        );
                        if (qs[0]) {
                          updateQuiz({
                            question: qs[0].question,
                            options: qs[0].options.map(o => ({
                              ...o,
                              id: Math.random().toString(),
                            })),
                          });
                        }
                      })
                    }
                  >
                    Сгенерировать тест
                  </button>
                )}

                {aiModal === 'text' && page.kind === 'theory' && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {['simplify', 'academic', 'expand'].map(m => (
                      <button
                        key={m}
                        className="btn btn-outline justify-start text-sm"
                        onClick={() =>
                          handleAiAction(async () => {
                            const field =
                              page.theory.mode === 'markdown'
                                ? 'markdown'
                                : 'text';
                            const res = await enhanceTextWithAi(
                              page.theory[field] || '',
                              m as any,
                            );
                            updateTheory({ [field]: res } as any);
                          })
                        }
                      >
                        {m === 'simplify'
                          ? 'Упростить'
                          : m === 'academic'
                          ? 'Сделать академичнее'
                          : 'Расширить'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
