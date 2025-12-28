import { useApi } from '@/api/client';
import type {
  AiTestQuestionType,
  AiTextMode,
  DifficultyLevel,
  SupportedLanguage,
} from './types';
import { generateId } from './storage';
import { logCourseEvent } from './logger';

/**
 * Teacher AI API - функции для помощи авторам курсов
 */

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

// API Request/Response types

interface EnhanceTextRequest {
  text: string;
  action: 'SIMPLIFY' | 'ACADEMIC' | 'GRAMMAR' | 'EXPAND' | 'EXAMPLE';
}

interface EnhanceTextResponse {
  enhancedText: string;
}

interface GenerateTestRequest {
  topic?: string;
  questionType: string;
  questionCount: number;
  difficulty: string;
}

interface GenerateTestResponse {
  questions: Array<{
    question: string;
    options: string[];
    correctAnswerIndices: number[];
  }>;
}

interface GenerateCodeTaskRequest {
  topic: string;
  language: string;
  difficulty: string;
  requirements?: string;
}

interface GenerateCodeTaskResponse {
  description: string;
  exampleSolution: string;
  testCases: Array<{ input: string; output: string }>;
}

// Helper: Map AiTextMode to API action
const mapModeToAction = (
  mode: AiTextMode
): 'SIMPLIFY' | 'ACADEMIC' | 'GRAMMAR' | 'EXPAND' | 'EXAMPLE' => {
  switch (mode) {
    case 'simplify':
      return 'SIMPLIFY';
    case 'academic':
      return 'ACADEMIC';
    case 'grammar':
      return 'GRAMMAR';
    case 'expand':
      return 'EXPAND';
    case 'example':
      return 'EXAMPLE';
    default:
      return 'GRAMMAR';
  }
};

/**
 * Hook для работы с AI API для авторов курсов
 */
export const useTeacherAI = () => {
  const { apiFetch } = useApi();

  /**
   * Улучшить текст с помощью AI
   * @param pageId - ID страницы
   * @param text - Исходный текст
   * @param mode - Режим улучшения
   */
  const enhanceTextWithAi = async (
    pageId: string,
    text: string,
    mode: AiTextMode
  ): Promise<string> => {
    const trimmed = text.trim();
    if (!trimmed) {
      logCourseEvent('AI invalid response', { reason: 'empty-input' });
      return text;
    }

    try {
      const response = await apiFetch<EnhanceTextResponse>(
        `/pages/${pageId}/ai/enhance-text`,
        {
          method: 'POST',
          body: JSON.stringify({
            text: trimmed,
            action: mapModeToAction(mode),
          } as EnhanceTextRequest),
        }
      );

      logCourseEvent('AI text enhancement success', { mode });
      return response.enhancedText;
    } catch (error) {
      logCourseEvent('AI text enhancement failed', { mode, error });
      throw error;
    }
  };

  /**
   * Сгенерировать тестовые вопросы с помощью AI
   * @param lessonId - ID урока
   * @param context - Контекст урока (заголовок или описание)
   * @param params - Параметры генерации
   */
  const generateTestQuestionsWithAi = async (
    lessonId: string,
    context: string,
    params: GenerateTestParams
  ): Promise<GeneratedTestQuestion[]> => {
    const baseContext = (params.theme || context || '').trim();

    if (!baseContext || baseContext.length < 50) {
      const error = new Error('INSUFFICIENT_CONTEXT');
      logCourseEvent('AI test generation insufficient context', {
        reason: 'short',
      });
      throw error;
    }

    const count = Math.min(Math.max(params.count, 1), 10);

    try {
      const response = await apiFetch<GenerateTestResponse>(
        `/lessons/${lessonId}/ai/generate-test`,
        {
          method: 'POST',
          body: JSON.stringify({
            topic: params.theme || context,
            questionType: params.type,
            questionCount: count,
            difficulty: params.difficulty,
          } as GenerateTestRequest),
        }
      );

      // Transform API response to internal format
      const questions: GeneratedTestQuestion[] = response.questions.map(
        (q) => {
          const options = q.options.map((text, index) => ({
            text,
            isCorrect: q.correctAnswerIndices.includes(index),
          }));

          return {
            id: generateId('q'),
            question: q.question,
            options,
          };
        }
      );

      logCourseEvent('AI test generation success', {
        type: params.type,
        count: questions.length,
      });

      return questions;
    } catch (error) {
      logCourseEvent('AI test generation failed', { params, error });
      throw error;
    }
  };

  /**
   * Сгенерировать задачу с кодом с помощью AI
   * @param lessonId - ID урока
   * @param params - Параметры генерации
   */
  const generateCodeTaskWithAi = async (
    lessonId: string,
    params: GenerateCodeTaskParams
  ): Promise<GeneratedCodeTask> => {
    const req = (params.requirements || '').toLowerCase();

    // Специальный кейс из ТЗ: противоречивые параметры
    if (params.language === 'python' && req.includes('linq')) {
      logCourseEvent('AI code task generation invalid parameters', { params });
      const err = new Error('INVALID_PARAMETERS');
      throw err;
    }

    const baseTheme = params.theme.trim() || 'задача по программированию';

    try {
      const response = await apiFetch<GenerateCodeTaskResponse>(
        `/lessons/${lessonId}/ai/generate-code-task`,
        {
          method: 'POST',
          body: JSON.stringify({
            topic: baseTheme,
            language: params.language,
            difficulty: params.difficulty,
            requirements: params.requirements,
          } as GenerateCodeTaskRequest),
        }
      );

      logCourseEvent('AI code task generation success', {
        language: params.language,
        difficulty: params.difficulty,
      });

      return {
        description: response.description,
        language: params.language,
        testCases: response.testCases,
        sampleSolution: response.exampleSolution,
      };
    } catch (error) {
      logCourseEvent('AI code task generation failed', { params, error });
      throw error;
    }
  };

  return {
    enhanceTextWithAi,
    generateTestQuestionsWithAi,
    generateCodeTaskWithAi,
  };
};
