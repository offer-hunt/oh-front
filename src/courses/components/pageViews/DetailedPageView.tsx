import { useState } from 'react';
import type { DetailedPage, DetailedEvaluationResult } from '@/courses/types';
import { Icons } from '@/components/Icons';

interface DetailedPageViewProps {
  page: DetailedPage;
  onSubmit: (answer: string) => Promise<void>;
  result?: DetailedEvaluationResult;
  isSubmitting: boolean;
}

export function DetailedPageView({ page, onSubmit, result, isSubmitting }: DetailedPageViewProps) {
  const [answer, setAnswer] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const wordCount = answer.trim().split(/\s+/).filter(w => w.length > 0).length;
  const minWords = 20;

  const handleSubmit = async () => {
    // Validation
    if (answer.trim().length === 0) {
      setValidationError('Ответ не может быть пустым');
      return;
    }

    if (wordCount < minWords) {
      setValidationError(`Ответ слишком короткий для отправки на проверку. Минимум ${minWords} слов.`);
      return;
    }

    try {
      await onSubmit(answer);
      setValidationError(null);
    } catch (error) {
      setValidationError('Не удалось отправить ответ. Попробуйте позже.');
    }
  };

  const handleRetry = () => {
    setAnswer('');
    setValidationError(null);
  };

  return (
    <>
      {/* Content card */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden shadow-xl">
        {/* Description */}
        <div className="p-8 border-b border-[var(--border-subtle)] bg-gradient-to-r from-violet-500/10 to-purple-500/10">
          <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider mb-3">
            <span>✍️</span>
            <span>Задание</span>
          </div>
          <p className="text-lg text-[var(--text-primary)] leading-relaxed">
            {page.detailed.description || 'Описание задания не добавлено'}
          </p>
        </div>

        {/* Answer textarea or result */}
        {!result ? (
          <div className="p-8 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-[var(--text-secondary)]">Ваш ответ</label>
                <span
                  className={`text-xs font-medium ${
                    wordCount >= minWords ? 'text-emerald-400' : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  {wordCount} / {minWords}+ слов
                </span>
              </div>
              <textarea
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setValidationError(null);
                }}
                placeholder="Напишите развёрнутый ответ..."
                className="form-input w-full min-h-[300px] text-base leading-relaxed"
              />
            </div>

            {/* Checking mode info */}
            <div className="flex items-center gap-4 p-5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <span className="text-2xl">{page.detailed.answerMode === 'exact' ? '✓' : '🤖'}</span>
              </div>
              <div>
                <div className="font-semibold text-[var(--text-primary)]">
                  {page.detailed.answerMode === 'exact' ? 'Точная проверка' : 'AI проверка'}
                </div>
                <div className="text-sm text-[var(--text-tertiary)]">
                  {page.detailed.answerMode === 'exact'
                    ? 'Ответ проверяется по точному совпадению'
                    : 'Ответ анализируется с помощью AI'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-6">
            {/* Result summary */}
            <div
              className={`p-6 rounded-xl border ${
                result.status === 'passed'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : result.status === 'partial'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    result.status === 'passed'
                      ? 'bg-emerald-500/20'
                      : result.status === 'partial'
                      ? 'bg-amber-500/20'
                      : 'bg-red-500/20'
                  }`}
                >
                  {result.status === 'passed' ? (
                    <Icons.CheckCircle width={28} height={28} className="text-emerald-400" />
                  ) : result.status === 'partial' ? (
                    <span className="text-3xl">⚠️</span>
                  ) : (
                    <span className="text-3xl">✗</span>
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={`font-bold text-lg mb-1 ${
                      result.status === 'passed'
                        ? 'text-emerald-400'
                        : result.status === 'partial'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    Оценка: {result.score} баллов из 100
                  </div>
                  <p className="text-base text-[var(--text-primary)] leading-relaxed">{result.feedback}</p>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="text-lg">💡</span> Рекомендации
                </h4>
                <ul className="space-y-2">
                  {result.suggestions.map((suggestion, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]"
                    >
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span className="text-sm text-[var(--text-primary)] leading-relaxed">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Show submitted answer */}
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3">
                Ваш ответ
              </h4>
              <div className="p-6 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{answer}</p>
              </div>
            </div>
          </div>
        )}

        {/* Validation error */}
        {validationError && (
          <div className="px-8 pb-4">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
              <Icons.AlertTriangle width={20} height={20} className="text-red-400" />
              <span className="text-sm text-red-400">{validationError}</span>
            </div>
          </div>
        )}

        {/* Submit button */}
        {!result && (
          <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-input)]/30">
            <button
              className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Проверяется...</span>
                </>
              ) : (
                'Отправить на проверку'
              )}
            </button>
          </div>
        )}

        {/* Retry button */}
        {result && result.status !== 'passed' && (
          <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-input)]/30">
            <button
              className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold text-lg hover:opacity-90 transition-all"
              onClick={handleRetry}
            >
              Улучшить ответ
            </button>
          </div>
        )}
      </div>
    </>
  );
}
