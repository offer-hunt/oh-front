import type {
  AiTestQuestionType,
  AiTextMode,
  DifficultyLevel,
  SupportedLanguage,
} from './types';
import { generateId } from './storage';
import { logCourseEvent } from './logger';

export interface GeneratedTestQuestion {
  id: string;
  question: string;
  options: { text: string; isCorrect: boolean }[];
}

export interface GenerateTestParams {
  theme?: string;
  type: AiTestQuestionType;
  count: number;
  difficulty: DifficultyLevel;
}

export interface GenerateCodeTaskParams {
  theme: string;
  language: SupportedLanguage;
  difficulty: DifficultyLevel;
  requirements?: string;
}

export interface GeneratedCodeTask {
  description: string;
  language: SupportedLanguage;
  testCases: { input: string; output: string }[];
  sampleSolution: string;
}

export async function enhanceTextWithAi(
  text: string,
  mode: AiTextMode,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) {
    logCourseEvent('AI invalid response', { reason: 'empty-input' });
    return text;
  }

  let prefix = '';
  switch (mode) {
    case 'simplify':
      prefix = 'Упрощённый вариант:\n\n';
      break;
    case 'academic':
      prefix = 'Более академичная формулировка:\n\n';
      break;
    case 'grammar':
      prefix = 'Исправленный текст:\n\n';
      break;
    case 'expand':
      prefix = 'Расширенный вариант:\n\n';
      break;
    case 'example':
      prefix = 'Пример для иллюстрации:\n\n';
      break;
    default:
      prefix = '';
  }

  const result = `${prefix}${trimmed}\n\n(Сгенерировано AI – режим: ${mode})`;
  logCourseEvent('AI text enhancement success', { mode });
  return result;
}

export async function generateTestQuestionsWithAi(
  context: string,
  params: GenerateTestParams,
): Promise<GeneratedTestQuestion[]> {
  const baseContext = (params.theme || context || '').trim();

  if (!baseContext || baseContext.length < 50) {
    const error = new Error('INSUFFICIENT_CONTEXT');
    logCourseEvent('AI test generation insufficient context', { reason: 'short' });
    throw error;
  }

  const count = Math.min(Math.max(params.count, 1), 10);

  const questions: GeneratedTestQuestion[] = [];

  for (let i = 0; i < count; i += 1) {
    const qId = generateId('q');
    const qText = `Вопрос ${i + 1} по теме "${baseContext.slice(0, 40)}..."`;

    const opts = [
      { text: 'Вариант A', isCorrect: true },
      { text: 'Вариант B', isCorrect: false },
      { text: 'Вариант C', isCorrect: false },
      { text: 'Вариант D', isCorrect: false },
    ];

    questions.push({
      id: qId,
      question: qText,
      options: opts,
    });
  }

  logCourseEvent('AI test generation success', {
    type: params.type,
    count: questions.length,
  });

  return questions;
}

export async function generateCodeTaskWithAi(
  params: GenerateCodeTaskParams,
): Promise<GeneratedCodeTask> {
  const req = (params.requirements || '').toLowerCase();

  // Специальный кейс из ТЗ: противоречивые параметры
  if (params.language === 'python' && req.includes('linq')) {
    logCourseEvent('AI code task generation invalid parameters', { params });
    const err = new Error('INVALID_PARAMETERS');
    throw err;
  }

  const baseTheme = params.theme.trim() || 'задача по программированию';

  const description = `Реализуйте ${baseTheme} на языке ${params.language}. Уровень сложности: ${params.difficulty}. ${params.requirements || ''}`.trim();

  const testCases = [
    { input: '1 2 3', output: '6' },
    { input: '10 20', output: '30' },
  ];

  const sampleSolution = `// Пример решения (заглушка AI)\n// Язык: ${params.language}\n`;

  logCourseEvent('AI code task generation success', {
    language: params.language,
    difficulty: params.difficulty,
  });

  return {
    description,
    language: params.language,
    testCases,
    sampleSolution,
  };
}
