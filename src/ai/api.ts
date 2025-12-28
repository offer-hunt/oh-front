import { useApi } from '@/api/client';

/**
 * Student AI API - функции для помощи студентам при прохождении курсов
 */

export interface ExplainMaterialRequest {
  text: string;
  pageId?: string;
}

export interface ExplainMaterialResponse {
  explanation: string;
}

export interface GetTaskHintRequest {
  code: string;
}

export interface GetTaskHintResponse {
  hint: string;
}

/**
 * Hook для работы с AI API для студентов
 */
export const useStudentAI = () => {
  const { apiFetch } = useApi();

  /**
   * Объяснить материал
   * @param text - Текст для объяснения
   * @param pageId - ID страницы (опционально, для контекста)
   */
  const explainMaterial = async (
    text: string,
    pageId?: string
  ): Promise<string> => {
    const response = await apiFetch<ExplainMaterialResponse>(
      '/learning/ai/explain',
      {
        method: 'POST',
        body: JSON.stringify({ text, pageId } as ExplainMaterialRequest),
      }
    );
    return response.explanation;
  };

  /**
   * Получить подсказку для задачи
   * @param taskId - ID задачи (pageId)
   * @param code - Текущий код студента
   */
  const getTaskHint = async (taskId: string, code: string): Promise<string> => {
    const response = await apiFetch<GetTaskHintResponse>(
      `/learning/ai/tasks/${taskId}/hint`,
      {
        method: 'POST',
        body: JSON.stringify({ code } as GetTaskHintRequest),
      }
    );
    return response.hint;
  };

  return {
    explainMaterial,
    getTaskHint,
  };
};
