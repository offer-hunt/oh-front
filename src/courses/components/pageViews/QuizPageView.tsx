import { useState } from 'react';
import type { QuizPage, QuizEvaluationResult } from '@/courses/types';
import { Icons } from '@/components/Icons';

interface QuizPageViewProps {
  page: QuizPage;
  onSubmit: (selectedOptionIds: string[]) => Promise<void>;
  result?: QuizEvaluationResult;
  isSubmitting: boolean;
}

export function QuizPageView({ page, onSubmit, result, isSubmitting }: QuizPageViewProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleOptionToggle = (optionId: string) => {
    if (result) return; // Don't allow changes after submission

    const newSelection = new Set(selectedOptions);
    if (newSelection.has(optionId)) {
      newSelection.delete(optionId);
    } else {
      newSelection.add(optionId);
    }
    setSelectedOptions(newSelection);
    setValidationError(null); // Clear error on change
  };

  const handleSubmit = async () => {
    // Validation
    if (selectedOptions.size === 0) {
      setValidationError('Выберите хотя бы один вариант ответа');
      return;
    }

    try {
      await onSubmit(Array.from(selectedOptions));
      // Result will be passed via props after submission
    } catch (error) {
      setValidationError('Не удалось отправить ответ. Попробуйте ещё раз.');
    }
  };

  const handleRetry = () => {
    setSelectedOptions(new Set());
    setValidationError(null);
  };

  return (
    <>
      {/* Content card */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden shadow-xl">
        {/* Question header */}
        <div className="p-8 border-b border-[var(--border-subtle)] bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">
            <span>❓</span>
            <span>Вопрос</span>
          </div>
          <p className="text-xl font-semibold text-[var(--text-primary)] leading-relaxed">
            {page.quiz.question || 'Вопрос не задан'}
          </p>
        </div>

        {/* Options */}
        <div className="p-8 space-y-4">
          {page.quiz.options.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-tertiary)]">
              <span className="text-4xl mb-4 block">📋</span>
              <p>Варианты ответов не добавлены</p>
            </div>
          ) : (
            page.quiz.options.map((opt, i) => {
              const isSelected = selectedOptions.has(opt.id);
              const isCorrect = result?.correctOptionIds.includes(opt.id);
              const isWrong = result && isSelected && !isCorrect;
              const showCorrect = result && isCorrect;

              return (
                <label
                  key={opt.id}
                  className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all group ${
                    result
                      ? showCorrect
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isWrong
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-[var(--border-subtle)] opacity-70'
                      : isSelected
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-[var(--border-subtle)] hover:border-amber-500/50'
                  }`}
                  onClick={() => !result && handleOptionToggle(opt.id)}
                >
                  <span
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${
                      result
                        ? showCorrect
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isWrong
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-[var(--bg-app)] text-[var(--text-tertiary)]'
                        : isSelected
                        ? 'bg-amber-500/20 text-amber-500'
                        : 'bg-[var(--bg-app)] text-[var(--text-tertiary)] group-hover:bg-amber-500/20 group-hover:text-amber-500'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 text-[var(--text-primary)]">{opt.text}</span>
                  {result ? (
                    showCorrect ? (
                      <Icons.Check width={24} height={24} className="text-emerald-400" />
                    ) : isWrong ? (
                      <span className="text-red-400 text-xl">✗</span>
                    ) : null
                  ) : (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-6 h-6 accent-amber-500"
                    />
                  )}
                </label>
              );
            })
          )}
        </div>

        {/* Validation error */}
        {validationError && (
          <div className="px-8 pb-4">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
              <Icons.AlertTriangle width={20} height={20} className="text-red-400" />
              <span className="text-sm text-red-400">{validationError}</span>
            </div>
          </div>
        )}

        {/* Submit button or result */}
        {!result ? (
          <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-input)]/30">
            <button
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Проверяется...</span>
                </>
              ) : (
                'Отправить ответ'
              )}
            </button>
          </div>
        ) : (
          <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-app)]/50">
            {/* Result summary */}
            <div
              className={`p-6 rounded-xl mb-4 border ${
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
                    Результат: {result.score} баллов из 100
                  </div>
                  <div className="text-sm text-[var(--text-secondary)] mb-3">
                    Правильных ответов: {result.correctCount} из {result.correctOptionIds.length}
                  </div>
                  {result.feedback && <p className="text-sm text-[var(--text-primary)]">{result.feedback}</p>}
                </div>
              </div>
            </div>

            {/* Retry button */}
            {result.status !== 'passed' && (
              <button
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-lg hover:opacity-90 transition-all"
                onClick={handleRetry}
              >
                Попробовать ещё раз
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
