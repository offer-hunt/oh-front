import { useState } from 'react';
import type { CodePage, CodeEvaluationResult, SupportedLanguage } from '@/courses/types';
import { Icons } from '@/components/Icons';

interface CodePageViewProps {
  page: CodePage;
  onSubmit: (code: string, language: SupportedLanguage) => Promise<void>;
  result?: CodeEvaluationResult;
  isSubmitting: boolean;
}

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  csharp: 'C#',
};

export function CodePageView({ page, onSubmit, result, isSubmitting }: CodePageViewProps) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>(page.code.language || 'javascript');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validation
    if (code.trim().length === 0) {
      setValidationError('Решения для отправки не найдено. Напишите код в редакторе.');
      return;
    }

    try {
      await onSubmit(code, language);
      setValidationError(null);
    } catch (error) {
      setValidationError('Не удалось отправить решение. Попробуйте позже.');
    }
  };

  const handleRetry = () => {
    setCode('');
    setValidationError(null);
  };

  return (
    <>
      {/* Content card */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden shadow-xl">
        {/* Description */}
        <div className="p-8 border-b border-[var(--border-subtle)] bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
            <span>💻</span>
            <span>Задание</span>
          </div>
          <p className="text-lg text-[var(--text-primary)] leading-relaxed">
            {page.code.description || 'Описание задания не добавлено'}
          </p>
        </div>

        {/* Code editor */}
        {!result && (
          <div className="p-8 space-y-4">
            {/* Language selector */}
            <div>
              <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 block">Язык программирования</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="form-input w-full max-w-xs"
              >
                {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Code textarea */}
            <div>
              <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2 block">Ваш код</label>
              <div className="rounded-xl overflow-hidden border border-gray-700">
                <div className="px-6 py-4 bg-[#1e1e1e] border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                      <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                    </div>
                    <span className="text-sm font-mono text-gray-400">{LANGUAGE_LABELS[language]}</span>
                  </div>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder={`// Напишите ваш код на ${LANGUAGE_LABELS[language]}...\n\n`}
                  className="w-full min-h-[400px] p-6 bg-[#1e1e1e] text-gray-300 font-mono text-sm resize-none focus:outline-none"
                  style={{ tabSize: 2 }}
                />
              </div>
            </div>

            {/* Test cases info */}
            {page.code.testCases.length > 0 && (
              <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    Тестов: {page.code.testCases.length}
                  </div>
                  <div className="text-sm text-[var(--text-tertiary)]">
                    Ваше решение будет проверено автоматически
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result display */}
        {result && (
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
                  ) : (
                    <span className="text-3xl">⚠️</span>
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
                  <div className="text-sm text-[var(--text-secondary)] mb-2">
                    Тестов пройдено: {result.passedTests} из {result.totalTests}
                    {result.executionTime && ` • Время: ${result.executionTime}ms`}
                  </div>
                  {result.feedback && <p className="text-sm text-[var(--text-primary)]">{result.feedback}</p>}
                </div>
              </div>
            </div>

            {/* Test results table */}
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3">
                Результаты тестов
              </h4>
              <div className="space-y-2">
                {result.testResults.map((test, idx) => (
                  <div
                    key={test.testCaseId}
                    className={`p-4 rounded-xl border ${
                      test.passed
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-red-500/5 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {test.passed ? (
                        <Icons.Check width={20} height={20} className="text-emerald-400" />
                      ) : (
                        <span className="text-red-400 text-lg">✗</span>
                      )}
                      <span className="font-semibold text-[var(--text-primary)]">Тест #{idx + 1}</span>
                      <span
                        className={`ml-auto text-xs font-bold uppercase ${
                          test.passed ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {test.passed ? 'Пройден' : 'Не пройден'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-[var(--text-tertiary)] text-xs mb-1">Входные данные:</div>
                        <code className="text-[var(--text-primary)] font-mono bg-[var(--bg-app)] px-2 py-1 rounded">
                          {test.input}
                        </code>
                      </div>
                      <div>
                        <div className="text-[var(--text-tertiary)] text-xs mb-1">Ожидаемый результат:</div>
                        <code className="text-[var(--text-primary)] font-mono bg-[var(--bg-app)] px-2 py-1 rounded">
                          {test.expectedOutput}
                        </code>
                      </div>
                      {!test.passed && test.actualOutput && (
                        <div className="col-span-2">
                          <div className="text-[var(--text-tertiary)] text-xs mb-1">Ваш результат:</div>
                          <code className="text-red-400 font-mono bg-[var(--bg-app)] px-2 py-1 rounded">
                            {test.actualOutput}
                          </code>
                        </div>
                      )}
                      {test.error && (
                        <div className="col-span-2">
                          <div className="text-[var(--text-tertiary)] text-xs mb-1">Ошибка:</div>
                          <code className="text-red-400 font-mono bg-[var(--bg-app)] px-2 py-1 rounded text-xs">
                            {test.error}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-lg hover:opacity-90 transition-all"
              onClick={handleRetry}
            >
              Попробовать ещё раз
            </button>
          </div>
        )}
      </div>
    </>
  );
}
