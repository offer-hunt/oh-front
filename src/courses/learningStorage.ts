import { generateId } from './storage';
import type {
  CourseProgress,
  SubmissionRecord,
  PageProgress,
  PageCompletionStatus,
  Submission,
  EvaluationResult,
} from './types';

// Ключи для localStorage
const PROGRESS_KEY = 'oh-front-progress';
const SUBMISSIONS_KEY = 'oh-front-submissions';

// ============================================
// УТИЛИТЫ
// ============================================

function safeParseProgress(raw: string | null): CourseProgress[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CourseProgress[];
  } catch {
    return [];
  }
}

function safeParseSubmissions(raw: string | null): SubmissionRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SubmissionRecord[];
  } catch {
    return [];
  }
}

// ============================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ПРОГРЕССОМ
// ============================================

/**
 * Загрузить весь прогресс из localStorage
 */
export function loadAllProgress(): CourseProgress[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(PROGRESS_KEY);
  return safeParseProgress(raw);
}

/**
 * Сохранить весь прогресс в localStorage
 */
export function saveAllProgress(progressList: CourseProgress[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressList));
}

/**
 * Найти прогресс по курсу для конкретного пользователя
 */
export function findProgress(courseId: string, userId: string): CourseProgress | undefined {
  const allProgress = loadAllProgress();
  return allProgress.find((p) => p.courseId === courseId && p.userId === userId);
}

/**
 * Создать или обновить прогресс по курсу
 */
export function upsertProgress(progress: CourseProgress): void {
  const all = loadAllProgress();
  const idx = all.findIndex((p) => p.courseId === progress.courseId && p.userId === progress.userId);

  if (idx >= 0) {
    all[idx] = progress;
  } else {
    all.push(progress);
  }

  saveAllProgress(all);
}

/**
 * Инициализировать прогресс по курсу для пользователя (если ещё не существует)
 */
export function initializeCourseProgress(courseId: string, userId: string): CourseProgress {
  const existing = findProgress(courseId, userId);
  if (existing) return existing;

  const newProgress: CourseProgress = {
    courseId,
    userId,
    startedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    pageProgress: {},
    completionPercentage: 0,
  };

  upsertProgress(newProgress);
  return newProgress;
}

/**
 * Обновить прогресс по конкретной странице
 */
export function updatePageProgress(
  courseId: string,
  userId: string,
  pageId: string,
  status: PageCompletionStatus,
  score?: number
): void {
  const progress = findProgress(courseId, userId) || initializeCourseProgress(courseId, userId);

  // Получить или создать прогресс страницы
  const pageProgress: PageProgress = progress.pageProgress[pageId] || {
    pageId,
    status: 'not_started',
    attempts: 0,
  };

  // Обновить статус и попытки
  pageProgress.status = status;
  pageProgress.lastAttemptAt = new Date().toISOString();
  pageProgress.attempts += 1;

  // Если завершено - установить дату завершения
  if (status === 'completed' && !pageProgress.completedAt) {
    pageProgress.completedAt = new Date().toISOString();
  }

  // Если это первая попытка - установить дату начала
  if (!pageProgress.startedAt) {
    pageProgress.startedAt = new Date().toISOString();
  }

  // Обновить score если передан
  if (score !== undefined) {
    pageProgress.score = score;
  }

  // Сохранить обновлённый прогресс страницы
  progress.pageProgress[pageId] = pageProgress;
  progress.lastAccessedAt = new Date().toISOString();
  progress.lastPageId = pageId;

  upsertProgress(progress);
}

/**
 * Вычислить процент завершения курса
 */
export function calculateProgress(courseId: string, userId: string, totalPages: number): number {
  if (totalPages === 0) return 0;

  const progress = findProgress(courseId, userId);
  if (!progress) return 0;

  const completedCount = Object.values(progress.pageProgress).filter(
    (p) => p.status === 'completed'
  ).length;

  return Math.round((completedCount / totalPages) * 100);
}

/**
 * Обновить процент завершения в прогрессе курса
 */
export function updateCompletionPercentage(courseId: string, userId: string, totalPages: number): void {
  const progress = findProgress(courseId, userId);
  if (!progress) return;

  progress.completionPercentage = calculateProgress(courseId, userId, totalPages);
  upsertProgress(progress);
}

// ============================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С РЕШЕНИЯМИ
// ============================================

/**
 * Загрузить все решения из localStorage
 */
export function loadAllSubmissions(): SubmissionRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(SUBMISSIONS_KEY);
  return safeParseSubmissions(raw);
}

/**
 * Сохранить все решения в localStorage
 */
export function saveAllSubmissions(submissions: SubmissionRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
}

/**
 * Найти решения для курса/пользователя/страницы
 */
export function findSubmissions(courseId: string, userId: string, pageId?: string): SubmissionRecord[] {
  const all = loadAllSubmissions();
  return all.filter(
    (s) =>
      s.courseId === courseId &&
      s.userId === userId &&
      (!pageId || s.submission.pageId === pageId)
  );
}

/**
 * Создать новое решение
 */
export function createSubmission(courseId: string, userId: string, submission: Submission): SubmissionRecord {
  const record: SubmissionRecord = {
    id: generateId('sub'),
    courseId,
    userId,
    submission,
    createdAt: new Date().toISOString(),
  };

  const all = loadAllSubmissions();
  all.push(record);
  saveAllSubmissions(all);

  return record;
}

/**
 * Обновить результат проверки для решения
 */
export function updateSubmissionResult(submissionId: string, result: EvaluationResult): void {
  const all = loadAllSubmissions();
  const idx = all.findIndex((s) => s.id === submissionId);

  if (idx >= 0) {
    all[idx].result = result;
    saveAllSubmissions(all);
  }
}

/**
 * Найти последнее решение для конкретной страницы
 */
export function findLatestSubmission(courseId: string, userId: string, pageId: string): SubmissionRecord | undefined {
  const submissions = findSubmissions(courseId, userId, pageId);
  if (submissions.length === 0) return undefined;

  // Сортировка по дате создания (новые первыми)
  submissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return submissions[0];
}
