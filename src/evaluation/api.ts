import { useApi } from '@/api/client';
import type {
  QuizEvaluationResult,
  CodeEvaluationResult,
  DetailedEvaluationResult,
  SupportedLanguage,
  CodeTestResult,
} from '@/courses/types';

/**
 * Evaluation API - сервис для проверки решений студентов
 */

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

// Типы решений для API
interface QuizSubmissionRequest {
  type: 'quiz';
  courseId: string;
  userId: string;
  pageId: string;
  selectedOptions: string[];
}

interface CodeSubmissionRequest {
  type: 'code';
  courseId: string;
  userId: string;
  pageId: string;
  code: string;
  language: string;
}

interface TextSubmissionRequest {
  type: 'text';
  courseId: string;
  userId: string;
  pageId: string;
  answer: string;
}

type SubmissionRequest =
  | QuizSubmissionRequest
  | CodeSubmissionRequest
  | TextSubmissionRequest;

// Ответ от API после отправки решения
interface SubmitSolutionResponse {
  submissionId: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
}

// Результат проверки для Quiz
interface QuizResultResponse {
  status: 'Pending' | 'Accepted' | 'Rejected';
  correctCount: number;
  totalCount: number;
  score: number;
  correctOptionIds: string[];
  feedback?: string;
}

// Результат проверки для Code
interface CodeResultResponse {
  status: 'Pending' | 'Accepted' | 'Rejected';
  passedTests: number;
  totalTests: number;
  score: number;
  testResults: Array<{
    testCaseId: string;
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput?: string;
    errorMessage?: string;
  }>;
  executionTime?: number;
  feedback?: string;
}

// Результат проверки для Text
interface TextResultResponse {
  status: 'Pending' | 'Accepted' | 'Rejected';
  score: number;
  feedback: string;
  suggestions?: string[];
}

type SubmissionResultResponse =
  | { type: 'quiz'; result: QuizResultResponse }
  | { type: 'code'; result: CodeResultResponse }
  | { type: 'text'; result: TextResultResponse };

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Маппинг статусов API в внутренние статусы
 */
function mapApiStatus(
  apiStatus: 'Pending' | 'Accepted' | 'Rejected'
): 'pending' | 'passed' | 'failed' | 'partial' {
  switch (apiStatus) {
    case 'Accepted':
      return 'passed';
    case 'Rejected':
      return 'failed';
    case 'Pending':
      return 'pending';
    default:
      return 'pending';
  }
}

/**
 * Определение partial статуса на основе score
 */
function getStatusWithPartial(
  apiStatus: 'Pending' | 'Accepted' | 'Rejected',
  score: number
): 'pending' | 'passed' | 'failed' | 'partial' {
  const baseStatus = mapApiStatus(apiStatus);

  // Если Accepted, но score между 60-79, считаем partial
  if (baseStatus === 'passed' && score >= 60 && score < 80) {
    return 'partial';
  }

  return baseStatus;
}

/**
 * Трансформация Quiz результата
 */
function transformQuizResult(response: QuizResultResponse): QuizEvaluationResult {
  return {
    status: getStatusWithPartial(response.status, response.score),
    correctCount: response.correctCount,
    totalCount: response.totalCount,
    score: response.score,
    correctOptionIds: response.correctOptionIds,
    feedback: response.feedback,
  };
}

/**
 * Трансформация Code результата
 */
function transformCodeResult(response: CodeResultResponse): CodeEvaluationResult {
  const testResults: CodeTestResult[] = response.testResults.map((tr) => ({
    testCaseId: tr.testCaseId,
    passed: tr.passed,
    input: tr.input,
    expectedOutput: tr.expectedOutput,
    actualOutput: tr.actualOutput,
    errorMessage: tr.errorMessage,
  }));

  return {
    status: getStatusWithPartial(response.status, response.score),
    passedTests: response.passedTests,
    totalTests: response.totalTests,
    score: response.score,
    testResults,
    executionTime: response.executionTime,
    feedback: response.feedback,
  };
}

/**
 * Трансформация Text результата
 */
function transformTextResult(response: TextResultResponse): DetailedEvaluationResult {
  return {
    status: getStatusWithPartial(response.status, response.score),
    score: response.score,
    feedback: response.feedback,
    suggestions: response.suggestions,
  };
}

// ============================================
// EVALUATION API HOOK
// ============================================

export const useEvaluationApi = () => {
  const { apiFetch } = useApi();

  /**
   * Отправить решение на проверку
   */
  const submitSolution = async (
    request: SubmissionRequest
  ): Promise<{ submissionId: string; status: 'pending' | 'passed' | 'failed' | 'partial' }> => {
    const response = await apiFetch<SubmitSolutionResponse>(
      '/v1/submissions',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    return {
      submissionId: response.submissionId,
      status: mapApiStatus(response.status),
    };
  };

  /**
   * Получить результат проверки
   */
  const getSubmissionResult = async (
    submissionId: string
  ): Promise<
    | QuizEvaluationResult
    | CodeEvaluationResult
    | DetailedEvaluationResult
  > => {
    const response = await apiFetch<SubmissionResultResponse>(
      `/v1/submissions/${submissionId}/result`
    );

    // Трансформация в зависимости от типа
    switch (response.type) {
      case 'quiz':
        return transformQuizResult(response.result);
      case 'code':
        return transformCodeResult(response.result);
      case 'text':
        return transformTextResult(response.result);
      default:
        throw new Error('Unknown submission type');
    }
  };

  /**
   * Отправить Quiz решение
   */
  const submitQuizSolution = async (
    courseId: string,
    userId: string,
    pageId: string,
    selectedOptionIds: string[]
  ): Promise<QuizEvaluationResult> => {
    const submitResponse = await submitSolution({
      type: 'quiz',
      courseId,
      userId,
      pageId,
      selectedOptions: selectedOptionIds,
    });

    // Если статус сразу определен (синхронная проверка)
    if (submitResponse.status !== 'pending') {
      return await getSubmissionResult(submitResponse.submissionId) as QuizEvaluationResult;
    }

    // Для pending статуса сразу запрашиваем результат
    // (В реальности можно добавить polling или websocket)
    return await getSubmissionResult(submitResponse.submissionId) as QuizEvaluationResult;
  };

  /**
   * Отправить Code решение
   */
  const submitCodeSolution = async (
    courseId: string,
    userId: string,
    pageId: string,
    code: string,
    language: SupportedLanguage
  ): Promise<CodeEvaluationResult> => {
    const submitResponse = await submitSolution({
      type: 'code',
      courseId,
      userId,
      pageId,
      code,
      language,
    });

    // Получаем результат
    return await getSubmissionResult(submitResponse.submissionId) as CodeEvaluationResult;
  };

  /**
   * Отправить Text (Detailed) решение
   */
  const submitTextSolution = async (
    courseId: string,
    userId: string,
    pageId: string,
    answer: string
  ): Promise<DetailedEvaluationResult> => {
    const submitResponse = await submitSolution({
      type: 'text',
      courseId,
      userId,
      pageId,
      answer,
    });

    // Получаем результат
    return await getSubmissionResult(submitResponse.submissionId) as DetailedEvaluationResult;
  };

  return {
    submitSolution,
    getSubmissionResult,
    submitQuizSolution,
    submitCodeSolution,
    submitTextSolution,
  };
};

// ============================================
// STANDALONE FUNCTIONS (для использования без хука)
// ============================================

/**
 * Standalone функции для использования в courseApi (не в React компонентах)
 * Эти функции принимают apiFetch в качестве параметра
 */

export async function submitQuizToEvaluation(
  apiFetch: ReturnType<typeof useApi>['apiFetch'],
  courseId: string,
  userId: string,
  pageId: string,
  selectedOptionIds: string[]
): Promise<QuizEvaluationResult> {
  // Отправляем решение
  const submitResponse = await apiFetch<SubmitSolutionResponse>(
    '/v1/submissions',
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'quiz',
        courseId,
        userId,
        pageId,
        selectedOptions: selectedOptionIds,
      } as QuizSubmissionRequest),
    }
  );

  // Получаем результат
  const resultResponse = await apiFetch<SubmissionResultResponse>(
    `/v1/submissions/${submitResponse.submissionId}/result`
  );

  if (resultResponse.type !== 'quiz') {
    throw new Error('Invalid submission result type');
  }

  return transformQuizResult(resultResponse.result);
}

export async function submitCodeToEvaluation(
  apiFetch: ReturnType<typeof useApi>['apiFetch'],
  courseId: string,
  userId: string,
  pageId: string,
  code: string,
  language: SupportedLanguage
): Promise<CodeEvaluationResult> {
  // Отправляем решение
  const submitResponse = await apiFetch<SubmitSolutionResponse>(
    '/v1/submissions',
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'code',
        courseId,
        userId,
        pageId,
        code,
        language,
      } as CodeSubmissionRequest),
    }
  );

  // Получаем результат
  const resultResponse = await apiFetch<SubmissionResultResponse>(
    `/v1/submissions/${submitResponse.submissionId}/result`
  );

  if (resultResponse.type !== 'code') {
    throw new Error('Invalid submission result type');
  }

  return transformCodeResult(resultResponse.result);
}

export async function submitTextToEvaluation(
  apiFetch: ReturnType<typeof useApi>['apiFetch'],
  courseId: string,
  userId: string,
  pageId: string,
  answer: string
): Promise<DetailedEvaluationResult> {
  // Отправляем решение
  const submitResponse = await apiFetch<SubmitSolutionResponse>(
    '/v1/submissions',
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'text',
        courseId,
        userId,
        pageId,
        answer,
      } as TextSubmissionRequest),
    }
  );

  // Получаем результат
  const resultResponse = await apiFetch<SubmissionResultResponse>(
    `/v1/submissions/${submitResponse.submissionId}/result`
  );

  if (resultResponse.type !== 'text') {
    throw new Error('Invalid submission result type');
  }

  return transformTextResult(resultResponse.result);
}
