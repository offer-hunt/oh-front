import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type {
  LessonPage,
  TheoryPageContent,
  QuizPageContent,
  CodePageContent,
  DetailedAnswerPageContent,
  AttachedFile,
} from '@/courses/types';
import { useTeacherAI } from '@/courses/ai';
import { Icons } from '@/components/Icons';

interface PageEditorProps {
  page: LessonPage;
  lessonId: string;
  onUpdate: (updatedPage: LessonPage) => void;
  onSave: () => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

// Иконки типов страниц
const PAGE_TYPE_CONFIG = {
  theory: { icon: '📄', label: 'Теория', color: 'var(--primary)' },
  quiz: { icon: '❓', label: 'Тестовый вопрос', color: '#f59e0b' },
  code: { icon: '💻', label: 'Задача с кодом', color: '#10b981' },
  detailed: { icon: '✍️', label: 'Развёрнутый ответ', color: '#8b5cf6' },
};

// Языки программирования
const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', ext: 'js', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', ext: 'ts', icon: '🔷' },
  { value: 'python', label: 'Python', ext: 'py', icon: '🐍' },
  { value: 'java', label: 'Java', ext: 'java', icon: '☕' },
  { value: 'csharp', label: 'C#', ext: 'cs', icon: '🟣' },
];

export function PageEditor({ page, lessonId, onUpdate, onSave, notify }: PageEditorProps) {
  const { enhanceTextWithAi, generateTestQuestionsWithAi, generateCodeTaskWithAi } = useTeacherAI();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModal, setAiModal] = useState<'text' | 'quiz' | 'code' | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Params for AI generators
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

  // Markdown toolbar actions
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea || page.kind !== 'theory') return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = page.theory.markdown || '';
    const selected = text.substring(start, end);

    const newText = text.substring(0, start) + before + selected + after + text.substring(end);
    updateTheory({ markdown: newText });

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
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

  const typeConfig = PAGE_TYPE_CONFIG[page.kind];

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex-shrink-0 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Page type badge */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                background: `${typeConfig.color}15`,
                color: typeConfig.color,
                border: `1px solid ${typeConfig.color}30`
              }}
            >
              <span>{typeConfig.icon}</span>
              <span>{typeConfig.label}</span>
            </div>

            {/* Title input */}
            <input
              className="text-xl font-bold bg-transparent border-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none min-w-[300px]"
              value={page.title}
              onChange={e => onUpdate({ ...page, title: e.target.value })}
              placeholder="Название страницы..."
            />
          </div>

          <div className="flex items-center gap-3">
            {/* AI Button */}
            {(page.kind === 'theory' || page.kind === 'quiz' || page.kind === 'code') && (
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-violet-400 hover:from-violet-500/30 hover:to-purple-500/30 transition-all"
                onClick={() => setAiModal(page.kind === 'theory' ? 'text' : page.kind)}
              >
                <Icons.Sparkles width={16} />
                <span className="text-sm font-medium">AI Помощник</span>
              </button>
            )}

            <div className="w-px h-8 bg-[var(--border-subtle)]" />

            <button
              className="btn btn-primary px-6"
              onClick={onSave}
            >
              <Icons.Check width={16} />
              Сохранить
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">

          {/* ═══════════════════════════════════════════════════════════════
              THEORY EDITOR
              ═══════════════════════════════════════════════════════════════ */}
          {page.kind === 'theory' && (
            <div className="space-y-6">
              {/* Mode selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                  {[
                    { mode: 'text', icon: '📝', label: 'Текст' },
                    { mode: 'markdown', icon: '📋', label: 'Markdown' },
                    { mode: 'video', icon: '🎬', label: 'Видео' },
                  ].map(({ mode, icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => updateTheory({ mode: mode as 'text' | 'markdown' | 'video' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        page.theory.mode === mode
                          ? 'bg-[var(--primary)] text-white shadow-lg'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]'
                      }`}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-all"
                  onClick={handleFileUpload}
                >
                  <Icons.Plus width={16} />
                  <span className="text-sm">Прикрепить файл</span>
                </button>
              </div>

              {/* Attachments */}
              {page.theory.attachments && page.theory.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {page.theory.attachments.map((f, i) => (
                    <div
                      key={f.id || i}
                      className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--primary)] transition-all"
                    >
                      <span className="text-lg">📎</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{f.name}</span>
                        <span className="text-xs text-[var(--text-tertiary)]">{(f.size / 1024).toFixed(0)} KB</span>
                      </div>
                      <button
                        className="ml-2 w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] transition-all"
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

              {/* TEXT MODE */}
              {page.theory.mode === 'text' && (
                <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-input)]/50">
                    <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Текстовый контент</span>
                  </div>
                  <textarea
                    className="w-full min-h-[400px] p-6 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none focus:outline-none text-base leading-relaxed"
                    value={page.theory.text || ''}
                    onChange={e => updateTheory({ text: e.target.value })}
                    placeholder="Введите текст урока. Этот режим подходит для простого текста без форматирования..."
                  />
                </div>
              )}

              {/* MARKDOWN MODE */}
              {page.theory.mode === 'markdown' && (
                <div className="space-y-4">
                  {/* Markdown toolbar */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                      {[
                        { action: () => insertMarkdown('**', '**'), icon: 'B', title: 'Жирный' },
                        { action: () => insertMarkdown('*', '*'), icon: 'I', title: 'Курсив', italic: true },
                        { action: () => insertMarkdown('# '), icon: 'H1', title: 'Заголовок 1' },
                        { action: () => insertMarkdown('## '), icon: 'H2', title: 'Заголовок 2' },
                        { action: () => insertMarkdown('### '), icon: 'H3', title: 'Заголовок 3' },
                        { action: () => insertMarkdown('- '), icon: '•', title: 'Список' },
                        { action: () => insertMarkdown('1. '), icon: '1.', title: 'Нумерованный список' },
                        { action: () => insertMarkdown('> '), icon: '"', title: 'Цитата' },
                        { action: () => insertMarkdown('`', '`'), icon: '<>', title: 'Код' },
                        { action: () => insertMarkdown('```\n', '\n```'), icon: '{ }', title: 'Блок кода' },
                        { action: () => insertMarkdown('[', '](url)'), icon: '🔗', title: 'Ссылка' },
                      ].map((btn, i) => (
                        <button
                          key={i}
                          onClick={btn.action}
                          title={btn.title}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-all ${btn.italic ? 'italic' : ''}`}
                        >
                          {btn.icon}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                        showPreview
                          ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span>👁</span>
                      <span>{showPreview ? 'Скрыть превью' : 'Показать превью'}</span>
                    </button>
                  </div>

                  {/* Editor + Preview */}
                  <div className={`grid gap-4 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Editor */}
                    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col">
                      <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-input)]/50 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Редактор</span>
                        <span className="text-xs text-[var(--text-tertiary)]">{(page.theory.markdown || '').length} символов</span>
                      </div>
                      <textarea
                        ref={textareaRef}
                        className="flex-1 w-full min-h-[500px] p-6 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none focus:outline-none font-mono text-sm leading-relaxed"
                        value={page.theory.markdown || ''}
                        onChange={e => updateTheory({ markdown: e.target.value })}
                        placeholder="# Заголовок

Введите текст с **markdown** разметкой...

## Подзаголовок

- Пункт списка
- Ещё пункт

> Цитата или важная мысль

```javascript
const example = 'код';
```"
                      />
                    </div>

                    {/* Preview */}
                    {showPreview && (
                      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col">
                        <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-gradient-to-r from-[var(--primary-soft)] to-transparent flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">Предпросмотр</span>
                          <span className="text-xs text-[var(--text-tertiary)]">• Live</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                          {page.theory.markdown ? (
                            <div className="prose prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 mt-6 text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 mt-5 text-[var(--text-primary)]" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 mt-4 text-[var(--text-primary)]" {...props} />,
                                  p: ({node, ...props}) => <p className="mb-4 text-[var(--text-secondary)] leading-relaxed" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4 text-[var(--text-secondary)] space-y-1" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-4 text-[var(--text-secondary)] space-y-1" {...props} />,
                                  li: ({node, ...props}) => <li className="text-[var(--text-secondary)]" {...props} />,
                                  code: ({node, inline, ...props}: any) =>
                                    inline
                                      ? <code className="bg-[var(--bg-input)] px-1.5 py-0.5 rounded text-[var(--primary)] font-mono text-sm" {...props} />
                                      : <code className="block bg-[#1e1e1e] p-4 rounded-xl font-mono text-sm overflow-x-auto text-gray-300 my-4" {...props} />,
                                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[var(--primary)] pl-4 py-1 italic text-[var(--text-secondary)] my-4 bg-[var(--primary-soft)]/30 rounded-r-lg" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-bold text-[var(--text-primary)]" {...props} />,
                                  a: ({node, ...props}) => <a className="text-[var(--primary)] hover:underline" {...props} />,
                                }}
                              >
                                {page.theory.markdown}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">
                              <div className="text-center">
                                <div className="text-5xl mb-4 opacity-30">📝</div>
                                <p className="text-sm">Начните вводить markdown...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIDEO MODE */}
              {page.theory.mode === 'video' && (
                <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-input)]/50">
                    <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Видео контент</span>
                  </div>
                  <div className="p-8">
                    <div className="max-w-xl mx-auto">
                      {/* Video preview */}
                      <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl mb-6 flex items-center justify-center border border-[var(--border-subtle)] overflow-hidden">
                        {page.theory.videoUrl ? (
                          <div className="text-center px-6">
                            <div className="text-6xl mb-4">🎬</div>
                            <p className="text-white font-medium mb-2">Video Ready</p>
                            <p className="text-gray-400 text-sm break-all">{page.theory.videoUrl}</p>
                          </div>
                        ) : (
                          <div className="text-center px-6">
                            <div className="text-6xl mb-4 opacity-30">🎥</div>
                            <p className="text-gray-400">Введите ссылку на видео ниже</p>
                          </div>
                        )}
                      </div>

                      {/* URL input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Ссылка на видео</label>
                        <input
                          className="form-input text-base"
                          placeholder="https://youtube.com/watch?v=... или https://vimeo.com/..."
                          value={page.theory.videoUrl || ''}
                          onChange={e => updateTheory({ videoUrl: e.target.value })}
                        />
                        <p className="text-xs text-[var(--text-tertiary)]">
                          Поддерживаются YouTube, Vimeo и прямые ссылки на видео
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              QUIZ EDITOR
              ═══════════════════════════════════════════════════════════════ */}
          {page.kind === 'quiz' && (
            <div className="space-y-6">
              {/* Question */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-gradient-to-r from-amber-500/10 to-transparent flex items-center gap-2">
                  <span className="text-lg">❓</span>
                  <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Вопрос</span>
                </div>
                <div className="p-6">
                  <textarea
                    className="w-full min-h-[120px] bg-transparent text-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none focus:outline-none leading-relaxed"
                    value={page.quiz.question}
                    onChange={e => updateQuiz({ question: e.target.value })}
                    placeholder="Сформулируйте вопрос для студента..."
                  />
                </div>
              </div>

              {/* Options */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-input)]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Варианты ответов</span>
                  </div>
                  <span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-surface)] px-2 py-1 rounded-full">
                    {page.quiz.options.length} / 10
                  </span>
                </div>
                <div className="p-6 space-y-3">
                  {page.quiz.options.map((opt, i) => {
                    const isCorrect = opt.isCorrect;
                    return (
                      <div
                        key={opt.id}
                        className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                          isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/50'
                            : 'bg-[var(--bg-input)]/50 border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        {/* Letter badge */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                          isCorrect
                            ? 'bg-emerald-500 text-white'
                            : 'bg-[var(--bg-surface)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </div>

                        {/* Input */}
                        <input
                          className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none text-base"
                          value={opt.text}
                          onChange={e => {
                            const opts = [...page.quiz.options];
                            opts[i].text = e.target.value;
                            updateQuiz({ options: opts });
                          }}
                          placeholder={`Вариант ${String.fromCharCode(65 + i)}`}
                        />

                        {/* Correct toggle */}
                        <button
                          onClick={() =>
                            updateQuiz({
                              options: page.quiz.options.map((o, idx) => ({
                                ...o,
                                isCorrect: idx === i,
                              })),
                            })
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isCorrect
                              ? 'bg-emerald-500 text-white'
                              : 'bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:text-emerald-500 border border-[var(--border-subtle)]'
                          }`}
                        >
                          {isCorrect ? '✓ Верный' : 'Отметить верным'}
                        </button>

                        {/* Delete */}
                        <button
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] transition-all opacity-0 group-hover:opacity-100"
                          onClick={() =>
                            updateQuiz({
                              options: page.quiz.options.filter((_, idx) => idx !== i),
                            })
                          }
                        >
                          <Icons.Trash width={16} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add option button */}
                  {page.quiz.options.length < 10 && (
                    <button
                      className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)]/30 transition-all flex items-center justify-center gap-2"
                      onClick={() => {
                        updateQuiz({
                          options: [
                            ...page.quiz.options,
                            { id: Date.now().toString(), text: '', isCorrect: false },
                          ],
                        });
                      }}
                    >
                      <Icons.Plus width={18} />
                      <span className="font-medium">Добавить вариант</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tip */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-xl">💡</span>
                <div>
                  <p className="text-sm font-medium text-amber-400">Совет</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Добавьте минимум 2 варианта ответа. Один из них должен быть отмечен как правильный.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              CODE EDITOR
              ═══════════════════════════════════════════════════════════════ */}
          {page.kind === 'code' && (
            <div className="space-y-6">
              {/* Task description */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-gradient-to-r from-emerald-500/10 to-transparent flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Описание задачи</span>
                </div>
                <div className="p-6">
                  <textarea
                    className="w-full min-h-[150px] bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none focus:outline-none text-base leading-relaxed"
                    value={page.code.description}
                    onChange={e => updateCode({ description: e.target.value })}
                    placeholder="Опишите задачу, которую студент должен решить...

Пример:
Напишите функцию, которая принимает массив чисел и возвращает их сумму.
Функция должна обрабатывать пустой массив (возвращать 0)."
                  />
                </div>
              </div>

              {/* Language selector */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-input)]/50 flex items-center gap-2">
                  <span className="text-lg">🌐</span>
                  <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Язык программирования</span>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.value}
                        onClick={() => updateCode({ language: lang.value as any })}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          page.code.language === lang.value
                            ? 'bg-[var(--primary)] text-white shadow-lg'
                            : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--primary)]'
                        }`}
                      >
                        <span>{lang.icon}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Test cases */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-input)]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧪</span>
                    <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Тест-кейсы</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">
                    {page.code.testCases.length} тестов
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {page.code.testCases.map((tc, i) => (
                    <div
                      key={tc.id}
                      className="group bg-[#1e1e1e] rounded-xl overflow-hidden border border-[var(--border-subtle)]"
                    >
                      {/* Test header */}
                      <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
                        <span className="text-xs font-mono text-gray-500">Test #{i + 1}</span>
                        <button
                          className="text-xs text-gray-500 hover:text-[var(--danger)] transition-colors"
                          onClick={() =>
                            updateCode({
                              testCases: page.code.testCases.filter((_, idx) => idx !== i),
                            })
                          }
                        >
                          Удалить
                        </button>
                      </div>
                      {/* Test body */}
                      <div className="grid grid-cols-2 divide-x divide-gray-800">
                        <div className="p-3">
                          <label className="text-[10px] font-mono text-gray-500 uppercase mb-1 block">Input</label>
                          <input
                            className="w-full bg-transparent text-gray-300 font-mono text-sm focus:outline-none placeholder-gray-600"
                            value={tc.input}
                            onChange={e => {
                              const tcs = [...page.code.testCases];
                              tcs[i].input = e.target.value;
                              updateCode({ testCases: tcs });
                            }}
                            placeholder="[1, 2, 3]"
                          />
                        </div>
                        <div className="p-3">
                          <label className="text-[10px] font-mono text-gray-500 uppercase mb-1 block">Expected Output</label>
                          <input
                            className="w-full bg-transparent text-emerald-400 font-mono text-sm focus:outline-none placeholder-gray-600"
                            value={tc.output}
                            onChange={e => {
                              const tcs = [...page.code.testCases];
                              tcs[i].output = e.target.value;
                              updateCode({ testCases: tcs });
                            }}
                            placeholder="6"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add test case */}
                  <button
                    className="w-full p-3 rounded-xl border-2 border-dashed border-gray-700 text-gray-500 hover:border-emerald-500 hover:text-emerald-400 transition-all flex items-center justify-center gap-2 bg-[#1e1e1e]"
                    onClick={() =>
                      updateCode({
                        testCases: [
                          ...page.code.testCases,
                          { id: Date.now().toString(), input: '', output: '' },
                        ],
                      })
                    }
                  >
                    <Icons.Plus width={16} />
                    <span className="font-medium text-sm">Добавить тест-кейс</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              DETAILED ANSWER EDITOR
              ═══════════════════════════════════════════════════════════════ */}
          {page.kind === 'detailed' && (
            <div className="space-y-6">
              {/* Task description */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-gradient-to-r from-violet-500/10 to-transparent flex items-center gap-2">
                  <span className="text-lg">✍️</span>
                  <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Задание</span>
                </div>
                <div className="p-6">
                  <textarea
                    className="w-full min-h-[150px] bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none focus:outline-none text-base leading-relaxed"
                    value={page.detailed.description}
                    onChange={e => updateDetailed({ description: e.target.value })}
                    placeholder="Опишите задание, на которое студент должен дать развёрнутый ответ..."
                  />
                </div>
              </div>

              {/* Answer mode */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-input)]/50 flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Режим проверки</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateDetailed({ answerMode: 'exact' })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        page.detailed.answerMode === 'exact'
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">✓</span>
                        <span className="font-semibold text-[var(--text-primary)]">Точное совпадение</span>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Ответ студента сравнивается с эталонным ответом
                      </p>
                    </button>
                    <button
                      onClick={() => updateDetailed({ answerMode: 'prompt' })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        page.detailed.answerMode === 'prompt'
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🤖</span>
                        <span className="font-semibold text-[var(--text-primary)]">AI Проверка</span>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        AI проверяет ответ по заданным критериям
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Answer / Prompt */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                <div className={`px-4 py-3 border-b border-[var(--border-subtle)] flex items-center gap-2 ${
                  page.detailed.answerMode === 'prompt'
                    ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/10'
                    : 'bg-[var(--bg-input)]/50'
                }`}>
                  <span className="text-lg">{page.detailed.answerMode === 'prompt' ? '🤖' : '📝'}</span>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${
                    page.detailed.answerMode === 'prompt' ? 'text-violet-400' : 'text-[var(--text-tertiary)]'
                  }`}>
                    {page.detailed.answerMode === 'exact' ? 'Эталонный ответ' : 'Инструкция для AI'}
                  </span>
                </div>
                <div className="p-6">
                  <textarea
                    className={`w-full min-h-[200px] bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none focus:outline-none leading-relaxed ${
                      page.detailed.answerMode === 'prompt' ? 'font-mono text-sm' : 'text-base'
                    }`}
                    value={page.detailed.answer}
                    onChange={e => updateDetailed({ answer: e.target.value })}
                    placeholder={
                      page.detailed.answerMode === 'prompt'
                        ? 'Опишите критерии оценки ответа:\n\n- Какие ключевые моменты должен упомянуть студент?\n- Какая структура ответа ожидается?\n- Какие ошибки недопустимы?'
                        : 'Введите эталонный ответ, с которым будет сравниваться ответ студента...'
                    }
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          AI MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {aiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg mx-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-strong)] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-gradient-to-r from-violet-500/20 to-purple-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Icons.Sparkles className="text-white" width={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">AI Помощник</h3>
                  <p className="text-xs text-[var(--text-tertiary)]">Автоматическая генерация контента</p>
                </div>
              </div>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)] transition-all"
                onClick={() => setAiModal(null)}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {aiLoading ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
                  <p className="text-[var(--text-secondary)]">Генерируем контент...</p>
                </div>
              ) : (
                <>
                  {aiModal === 'text' && page.kind === 'theory' && (
                    <div className="space-y-4">
                      <p className="text-sm text-[var(--text-secondary)] mb-4">
                        Выберите действие для улучшения текста:
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { mode: 'simplify', icon: '📖', label: 'Упростить', desc: 'Сделать текст проще для понимания' },
                          { mode: 'academic', icon: '🎓', label: 'Академичнее', desc: 'Добавить научный стиль' },
                          { mode: 'expand', icon: '📝', label: 'Расширить', desc: 'Добавить больше деталей и примеров' },
                        ].map(item => (
                          <button
                            key={item.mode}
                            className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-subtle)] hover:border-violet-500 hover:bg-violet-500/10 transition-all text-left"
                            onClick={() =>
                              handleAiAction(async () => {
                                const field = page.theory.mode === 'markdown' ? 'markdown' : 'text';
                                const res = await enhanceTextWithAi(page.id, page.theory[field] || '', item.mode as any);
                                updateTheory({ [field]: res } as any);
                              })
                            }
                          >
                            <span className="text-2xl">{item.icon}</span>
                            <div>
                              <div className="font-semibold text-[var(--text-primary)]">{item.label}</div>
                              <div className="text-xs text-[var(--text-tertiary)]">{item.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiModal === 'quiz' && (
                    <div className="space-y-4">
                      <p className="text-sm text-[var(--text-secondary)]">
                        AI сгенерирует тестовый вопрос на основе названия страницы: <strong>{page.title || 'Без названия'}</strong>
                      </p>
                      <button
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-all"
                        onClick={() =>
                          handleAiAction(async () => {
                            const qs = await generateTestQuestionsWithAi(lessonId, page.title, {
                              count: 1,
                              type: 'single',
                              difficulty: 'medium',
                            });
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
                        <Icons.Sparkles width={18} className="inline mr-2" />
                        Сгенерировать тест
                      </button>
                    </div>
                  )}

                  {aiModal === 'code' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Тема задачи</label>
                        <input
                          className="form-input"
                          value={codeParams.theme}
                          onChange={e => setCodeParams({ ...codeParams, theme: e.target.value })}
                          placeholder={page.title || 'Например: работа с массивами'}
                        />
                      </div>
                      <button
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:opacity-90 transition-all"
                        onClick={() =>
                          handleAiAction(async () => {
                            const res = await generateCodeTaskWithAi(lessonId, {
                              theme: codeParams.theme || page.title,
                              language: (page as any).code?.language || 'javascript',
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
                        <Icons.Sparkles width={18} className="inline mr-2" />
                        Сгенерировать задачу
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
