import {
  deleteCourseById,
  findCourseById,
  generateId,
  loadCourses,
  upsertCourse,
} from './storage';
import {
  findProgress,
  initializeCourseProgress,
  updatePageProgress,
  createSubmission,
  updateSubmissionResult,
  findLatestSubmission,
} from './learningStorage';
import { logCourseEvent } from './logger';
import type {
  Course,
  CourseAuthor,
  CourseSummary,
  CourseWithEnrollment,
  CreateCourseInput,
  CourseSearchParams,
  EnrollmentStatus,
  VersionSnapshot,
  CourseProgress,
  PageCompletionStatus,
  QuizEvaluationResult,
  CodeEvaluationResult,
  DetailedEvaluationResult,
  AIResponse,
  PageKind,
  SupportedLanguage,
  QuizSubmission,
  CodeSubmission,
  DetailedSubmission,
  CodePage,
  QuizPage,
} from './types';

export interface CourseApi {
  // Существующие методы
  listCourses(ownerId?: string): Promise<CourseSummary[]>;
  getCourse(courseId: string): Promise<Course>;
  createCourse(ownerId: string | undefined, input: CreateCourseInput): Promise<Course>;
  updateCourse(course: Course): Promise<Course>;
  deleteCourse(courseId: string): Promise<void>;
  saveVersion(courseId: string, comment?: string): Promise<VersionSnapshot>;
  restoreVersion(courseId: string, versionId: string): Promise<Course>;

  // Новые методы для каталога
  searchCourses(params: CourseSearchParams): Promise<CourseSummary[]>;
  getCoursePublic(courseId: string, userId?: string): Promise<CourseWithEnrollment>;
  enrollCourse(courseId: string, userId: string): Promise<EnrollmentStatus>;
  checkEnrollment(courseId: string, userId: string): Promise<EnrollmentStatus>;
  getAuthorInfo(authorId: string): Promise<CourseAuthor>;
  getAuthorCourses(authorId: string): Promise<CourseSummary[]>;

  // Методы для прохождения курса (learning)
  getCourseProgress(courseId: string, userId: string): Promise<CourseProgress>;
  updateProgress(courseId: string, userId: string, pageId: string, status: PageCompletionStatus, score?: number): Promise<void>;

  // Методы для отправки решений и проверки
  submitQuiz(courseId: string, userId: string, pageId: string, selectedOptionIds: string[]): Promise<QuizEvaluationResult>;
  submitCode(courseId: string, userId: string, pageId: string, code: string, language: SupportedLanguage): Promise<CodeEvaluationResult>;
  submitDetailed(courseId: string, userId: string, pageId: string, answer: string): Promise<DetailedEvaluationResult>;

  // Методы для AI-ассистента
  getAIExplanation(pageId: string, selectedText: string): Promise<AIResponse>;
  getAIHint(pageId: string, pageKind: PageKind, attemptCount: number): Promise<AIResponse>;
}


function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// Моковое хранилище для enrollments
const ENROLLMENTS_KEY = 'oh-front-enrollments';

interface EnrollmentRecord {
  courseId: string;
  userId: string;
  enrolledAt: string;
}

function loadEnrollments(): EnrollmentRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(ENROLLMENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as EnrollmentRecord[];
  } catch {
    return [];
  }
}

function saveEnrollments(enrollments: EnrollmentRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(enrollments));
}

function toSummary(course: Course): CourseSummary {
  const lessonsCount = course.chapters.reduce(
    (acc, ch) => acc + ch.lessons.length,
    0,
  );
  const pagesCount = course.chapters.reduce(
    (acc, ch) =>
      acc +
      ch.lessons.reduce((inner, l) => inner + l.pages.length, 0),
    0,
  );

  const enrollments = loadEnrollments();
  const enrollmentsCount = enrollments.filter(e => e.courseId === course.id).length;

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    author: course.author,
    status: course.status,
    tags: course.tags,
    duration: course.duration,
    enrollmentsCount,
    cover: course.cover,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    lessonsCount,
    pagesCount,
  };
}

const mockCourseApi: CourseApi = {
  async listCourses(ownerId?: string): Promise<CourseSummary[]> {
    const all = loadCourses();
    const filtered = ownerId ? all.filter((c) => c.ownerId === ownerId) : all;
    const summaries = filtered.map(toSummary);
    return delay(
      summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );
  },

  async getCourse(courseId: string): Promise<Course> {
    const course = findCourseById(courseId);
    if (!course) {
      throw new Error('NOT_FOUND');
    }
    return delay(course);
  },

  async createCourse(
    ownerId: string | undefined,
    input: CreateCourseInput,
  ): Promise<Course> {
    const now = new Date().toISOString();
    const course: Course = {
      id: generateId('course'),
      ownerId,
      title: input.title.trim(),
      description: input.description.trim(),
      duration: input.duration?.trim() || '',
      cover: input.cover ?? null,
      tags: input.tags.map((t) => t.trim()),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      chapters: [],
      collaborators: [],
      versions: [],
    };

    upsertCourse(course);
    logCourseEvent('Course created', { courseId: course.id });

    return delay(course);
  },

  async updateCourse(course: Course): Promise<Course> {
    const updated: Course = {
      ...course,
      updatedAt: new Date().toISOString(),
    };
    upsertCourse(updated);
    return delay(updated);
  },

  async deleteCourse(courseId: string): Promise<void> {
    deleteCourseById(courseId);
    return delay(undefined);
  },

  async saveVersion(courseId: string, comment?: string): Promise<VersionSnapshot> {
    const course = findCourseById(courseId);
    if (!course) {
      const err = new Error('NOT_FOUND');
      logCourseEvent('Version save failed – server error', { courseId });
      throw err;
    }

    const snapshot: VersionSnapshot = {
      id: generateId('ver'),
      createdAt: new Date().toISOString(),
      comment,
      label: comment || `Версия от ${new Date().toLocaleString()}`,
      snapshot: JSON.stringify({
        ...course,
        versions: [],
      }),
    };

    course.versions.push(snapshot);
    upsertCourse(course);
    logCourseEvent('Version saved', { courseId, versionId: snapshot.id });
    return delay(snapshot);
  },

  async restoreVersion(courseId: string, versionId: string): Promise<Course> {
    const course = findCourseById(courseId);
    if (!course) {
      const err = new Error('NOT_FOUND');
      logCourseEvent('Version save failed – server error', { courseId });
      throw err;
    }
    const version = course.versions.find((v) => v.id === versionId);
    if (!version) {
      const err = new Error('NOT_FOUND');
      logCourseEvent('Version save failed – server error', {
        courseId,
        versionId,
      });
      throw err;
    }

    const parsed = JSON.parse(version.snapshot) as Course;
    const restored: Course = {
      ...parsed,
      id: course.id,
      ownerId: course.ownerId,
      versions: course.versions,
      updatedAt: new Date().toISOString(),
      createdAt: course.createdAt,
    };

    upsertCourse(restored);
    logCourseEvent('Version restored', { courseId, versionId });
    return delay(restored);
  },

  // Новые методы
  async searchCourses(params: CourseSearchParams): Promise<CourseSummary[]> {
    let courses = loadCourses();

    // Фильтруем только опубликованные курсы для публичного каталога
    courses = courses.filter(c => c.status === 'published' && (!c.accessType || c.accessType === 'public'));

    // Если указан authorId, фильтруем по автору
    if (params.authorId) {
      courses = courses.filter(c => c.ownerId === params.authorId || c.author?.id === params.authorId);
    }

    // Текстовый поиск по названию и описанию
    if (params.q) {
      const query = params.q.toLowerCase();
      courses = courses.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
      );
    }

    // Применяем фильтры
    if (params.filters) {
      const { languages, technologies, difficulty, duration } = params.filters;

      // Внутри категории OR, между категориями AND
      if (languages && languages.length > 0) {
        courses = courses.filter(c =>
          c.tags.some(tag => languages.includes(tag))
        );
      }

      if (technologies && technologies.length > 0) {
        courses = courses.filter(c =>
          c.tags.some(tag => technologies.includes(tag))
        );
      }

      if (difficulty && difficulty.length > 0) {
        courses = courses.filter(c =>
          c.tags.some(tag => difficulty.includes(tag))
        );
      }

      if (duration && duration.length > 0) {
        courses = courses.filter(c =>
          c.duration && duration.includes(c.duration)
        );
      }
    }

    const summaries = courses.map(toSummary);
    return delay(
      summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    );
  },

  async getCoursePublic(courseId: string, userId?: string): Promise<CourseWithEnrollment> {
    const course = findCourseById(courseId);
    if (!course) {
      throw new Error('NOT_FOUND');
    }

    // Проверяем доступ: если курс не опубликован, возвращаем 404
    if (course.status !== 'published') {
      throw new Error('NOT_FOUND');
    }

    // Если курс private_link, проверяем доступ (упрощенная логика для мока)
    if (course.accessType === 'private_link' && !userId) {
      throw new Error('FORBIDDEN');
    }

    // Проверяем enrollment
    let enrollment: EnrollmentStatus | undefined;
    if (userId) {
      const enrollments = loadEnrollments();
      const userEnrollment = enrollments.find(
        e => e.courseId === courseId && e.userId === userId
      );
      enrollment = userEnrollment
        ? { isEnrolled: true, enrolledAt: userEnrollment.enrolledAt }
        : { isEnrolled: false };
    }

    return delay({ ...course, enrollment });
  },

  async enrollCourse(courseId: string, userId: string): Promise<EnrollmentStatus> {
    const course = findCourseById(courseId);
    if (!course || course.status !== 'published') {
      throw new Error('NOT_FOUND');
    }

    const enrollments = loadEnrollments();
    const existing = enrollments.find(
      e => e.courseId === courseId && e.userId === userId
    );

    if (existing) {
      return delay({ isEnrolled: true, enrolledAt: existing.enrolledAt });
    }

    const newEnrollment: EnrollmentRecord = {
      courseId,
      userId,
      enrolledAt: new Date().toISOString(),
    };

    enrollments.push(newEnrollment);
    saveEnrollments(enrollments);

    logCourseEvent('User enrolled', { courseId, userId });
    return delay({ isEnrolled: true, enrolledAt: newEnrollment.enrolledAt });
  },

  async checkEnrollment(courseId: string, userId: string): Promise<EnrollmentStatus> {
    const enrollments = loadEnrollments();
    const enrollment = enrollments.find(
      e => e.courseId === courseId && e.userId === userId
    );

    return delay(
      enrollment
        ? { isEnrolled: true, enrolledAt: enrollment.enrolledAt }
        : { isEnrolled: false }
    );
  },

  async getAuthorInfo(authorId: string): Promise<CourseAuthor> {
    // В моковой реализации создаем фейкового автора
    // В реальном API это будет запрос к User Service
    const courses = loadCourses();
    const authorCourse = courses.find(c => c.ownerId === authorId || c.author?.id === authorId);

    if (!authorCourse) {
      throw new Error('NOT_FOUND');
    }

    if (authorCourse.author) {
      return delay(authorCourse.author);
    }

    // Фоллбек на базовую информацию
    return delay({
      id: authorId,
      name: `Автор ${authorId.substring(0, 8)}`,
      email: `author${authorId.substring(0, 8)}@example.com`,
    });
  },

  async getAuthorCourses(authorId: string): Promise<CourseSummary[]> {
    const courses = loadCourses();
    const authorCourses = courses.filter(
      c => (c.ownerId === authorId || c.author?.id === authorId) && c.status === 'published'
    );

    const summaries = authorCourses.map(toSummary);
    return delay(
      summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    );
  },

  // ============================================
  // МЕТОДЫ ДЛЯ ПРОХОЖДЕНИЯ КУРСА (LEARNING)
  // ============================================

  async getCourseProgress(courseId: string, userId: string): Promise<CourseProgress> {
    const progress = findProgress(courseId, userId) || initializeCourseProgress(courseId, userId);
    return delay(progress, 200);
  },

  async updateProgress(
    courseId: string,
    userId: string,
    pageId: string,
    status: PageCompletionStatus,
    score?: number
  ): Promise<void> {
    updatePageProgress(courseId, userId, pageId, status, score);
    return delay(undefined, 150);
  },

  // ============================================
  // МЕТОДЫ ДЛЯ ОТПРАВКИ РЕШЕНИЙ И ПРОВЕРКИ
  // ============================================

  async submitQuiz(
    courseId: string,
    userId: string,
    pageId: string,
    selectedOptionIds: string[]
  ): Promise<QuizEvaluationResult> {
    // Найти страницу теста для получения правильных ответов
    const course = findCourseById(courseId);
    if (!course) throw new Error('NOT_FOUND');

    let quizPage: QuizPage | null = null;
    for (const ch of course.chapters) {
      for (const l of ch.lessons) {
        const page = l.pages.find((p) => p.id === pageId && p.kind === 'quiz');
        if (page) {
          quizPage = page as QuizPage;
          break;
        }
      }
      if (quizPage) break;
    }

    if (!quizPage) throw new Error('PAGE_NOT_FOUND');

    // Проверка ответов
    const correctOptionIds = quizPage.quiz.options.filter((o) => o.isCorrect).map((o) => o.id);
    const correctCount = selectedOptionIds.filter((id) => correctOptionIds.includes(id)).length;
    const incorrectCount = selectedOptionIds.filter((id) => !correctOptionIds.includes(id)).length;
    const totalCount = quizPage.quiz.options.length;

    // Расчет score: учитываем правильные ответы минус неправильные
    const score = Math.max(
      0,
      Math.round(((correctCount - incorrectCount) / correctOptionIds.length) * 100)
    );

    const result: QuizEvaluationResult = {
      status: score === 100 ? 'passed' : score >= 70 ? 'partial' : 'failed',
      correctCount,
      totalCount,
      score,
      correctOptionIds,
      feedback:
        score === 100
          ? 'Отлично! Все ответы верны!'
          : score >= 70
          ? 'Хорошо, но есть ошибки. Попробуйте еще раз.'
          : 'Есть ошибки. Внимательно изучите материал и попробуйте снова.',
    };

    // Сохранить решение
    const submission: QuizSubmission = {
      kind: 'quiz',
      pageId,
      selectedOptionIds,
      submittedAt: new Date().toISOString(),
    };
    const record = createSubmission(courseId, userId, submission);
    updateSubmissionResult(record.id, result);

    // Обновить прогресс
    updatePageProgress(courseId, userId, pageId, result.status === 'passed' ? 'completed' : 'failed', score);

    logCourseEvent('Quiz submitted', { courseId, userId, pageId, score, status: result.status });

    return delay(result, 500); // Симуляция времени проверки
  },

  async submitCode(
    courseId: string,
    userId: string,
    pageId: string,
    code: string,
    language: SupportedLanguage
  ): Promise<CodeEvaluationResult> {
    // Найти страницу с кодом
    const course = findCourseById(courseId);
    if (!course) throw new Error('NOT_FOUND');

    let codePage: CodePage | null = null;
    for (const ch of course.chapters) {
      for (const l of ch.lessons) {
        const page = l.pages.find((p) => p.id === pageId && p.kind === 'code');
        if (page) {
          codePage = page as CodePage;
          break;
        }
      }
      if (codePage) break;
    }

    if (!codePage) throw new Error('PAGE_NOT_FOUND');

    // Mock оценка: случайно проходит 70-100% тестов
    const passRate = 0.7 + Math.random() * 0.3;
    const testResults = codePage.code.testCases.map((tc) => {
      const passed = Math.random() < passRate;
      return {
        testCaseId: tc.id,
        passed,
        input: tc.input,
        expectedOutput: tc.output,
        actualOutput: passed ? tc.output : 'Неверный результат',
        error: passed ? undefined : 'Ошибка выполнения или неверный результат',
      };
    });

    const passedTests = testResults.filter((r) => r.passed).length;
    const totalTests = testResults.length;
    const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    const result: CodeEvaluationResult = {
      status: score === 100 ? 'passed' : score >= 70 ? 'partial' : 'failed',
      passedTests,
      totalTests,
      score,
      testResults,
      executionTime: Math.round(50 + Math.random() * 200), // 50-250ms
      feedback:
        score === 100
          ? 'Отлично! Все тесты пройдены!'
          : `${passedTests} из ${totalTests} тестов пройдено. Проверьте логику работы с непройденными тестами.`,
    };

    // Сохранить решение
    const submission: CodeSubmission = {
      kind: 'code',
      pageId,
      code,
      language,
      submittedAt: new Date().toISOString(),
    };
    const record = createSubmission(courseId, userId, submission);
    updateSubmissionResult(record.id, result);

    // Обновить прогресс
    updatePageProgress(
      courseId,
      userId,
      pageId,
      result.status === 'passed' ? 'completed' : 'in_progress',
      score
    );

    logCourseEvent('Code submitted', { courseId, userId, pageId, score, status: result.status });

    return delay(result, 1200); // Более долгая задержка для симуляции выполнения кода
  },

  async submitDetailed(
    courseId: string,
    userId: string,
    pageId: string,
    answer: string
  ): Promise<DetailedEvaluationResult> {
    // Mock AI оценка: оценка по длине ответа
    const wordCount = answer.trim().split(/\s+/).length;
    const score = Math.min(100, Math.round((wordCount / 50) * 100)); // Полный балл за 50+ слов

    const result: DetailedEvaluationResult = {
      status: score >= 80 ? 'passed' : score >= 60 ? 'partial' : 'failed',
      score,
      feedback:
        score >= 80
          ? 'Отличный развернутый ответ! Вы показали глубокое понимание темы.'
          : score >= 60
          ? 'Хороший ответ, но можно добавить больше деталей и примеров.'
          : 'Ответ слишком краткий. Добавьте больше информации, примеров и объяснений.',
      suggestions:
        score < 80
          ? [
              'Добавьте конкретные примеры',
              'Объясните концепцию подробнее',
              'Укажите практическое применение',
              'Структурируйте ответ: введение, основная часть, заключение',
            ]
          : undefined,
    };

    // Сохранить решение
    const submission: DetailedSubmission = {
      kind: 'detailed',
      pageId,
      answer,
      submittedAt: new Date().toISOString(),
    };
    const record = createSubmission(courseId, userId, submission);
    updateSubmissionResult(record.id, result);

    // Обновить прогресс
    updatePageProgress(
      courseId,
      userId,
      pageId,
      result.status === 'passed' ? 'completed' : 'in_progress',
      score
    );

    logCourseEvent('Detailed answer submitted', { courseId, userId, pageId, score, status: result.status });

    return delay(result, 800); // Симуляция AI проверки
  },

  // ============================================
  // МЕТОДЫ ДЛЯ AI-АССИСТЕНТА
  // ============================================

  async getAIExplanation(pageId: string, selectedText: string): Promise<AIResponse> {
    // Mock AI объяснение
    const mockExplanations = [
      `Давайте разберём это простыми словами:\n\n"${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"\n\nЭто означает, что... [упрощённое объяснение концепции]. Если представить это на примере из реальной жизни, это как... [аналогия].`,
      `Интересный вопрос! Вот объяснение:\n\n${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}\n\nПроще говоря, это работает следующим образом: [пошаговое объяснение]. Это важно понимать, потому что... [практическое применение].`,
      `Отличный выбор текста для разбора!\n\n"${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"\n\nКлючевая идея здесь в том, что... [основная концепция]. Давайте рассмотрим на конкретном примере... [пример с кодом или реальной ситуацией].`,
    ];

    const randomExplanation = mockExplanations[Math.floor(Math.random() * mockExplanations.length)];

    logCourseEvent('AI explanation requested', { pageId, textLength: selectedText.length });

    return delay(
      {
        action: 'explain',
        content: randomExplanation,
        timestamp: new Date().toISOString(),
      },
      600
    );
  },

  async getAIHint(pageId: string, pageKind: PageKind, attemptCount: number): Promise<AIResponse> {
    const hints: Record<PageKind, string[]> = {
      quiz: [
        'Внимательно прочитайте вопрос еще раз и обратите внимание на ключевые слова.',
        'Один из ответов явно неверный - попробуйте исключить его сначала.',
        'Подумайте, какие варианты логически связаны с темой урока.',
      ],
      code: [
        'Проверьте граничные условия: что происходит с пустым входом, с одним элементом, с максимальным размером?',
        'Обратите внимание на типы данных: возможно, нужно преобразование.',
        'Попробуйте разбить задачу на несколько шагов и решить каждый отдельно.',
        'Проверьте, правильно ли вы обрабатываете edge cases в своём решении.',
      ],
      detailed: [
        'Структурируйте ответ: введение (что это), основная часть (как работает), заключение (зачем нужно).',
        'Добавьте конкретные примеры из практики для иллюстрации концепции.',
        'Объясните не только "что", но и "почему" - это покажет глубину понимания.',
      ],
      theory: ['Перечитайте ключевые абзацы и выделите главные идеи.'],
    };

    const hintList = hints[pageKind] || ['Попробуйте еще раз, внимательно изучив материал.'];
    const hintIndex = Math.min(attemptCount, hintList.length - 1);

    logCourseEvent('AI hint requested', { pageId, pageKind, attemptCount });

    return delay(
      {
        action: 'hint',
        content: hintList[hintIndex],
        timestamp: new Date().toISOString(),
      },
      500
    );
  },
};

const USE_MOCKS =
  (import.meta.env.VITE_COURSES_USE_MOCKS as string | undefined) !== 'false';

const realCourseApi: CourseApi = {
  async listCourses() {
    throw new Error('Real course API is not implemented yet');
  },
  async getCourse() {
    throw new Error('Real course API is not implemented yet');
  },
  async createCourse() {
    throw new Error('Real course API is not implemented yet');
  },
  async updateCourse() {
    throw new Error('Real course API is not implemented yet');
  },
  async deleteCourse() {
    throw new Error('Real course API is not implemented yet');
  },
  async saveVersion() {
    throw new Error('Real course API is not implemented yet');
  },
  async restoreVersion() {
    throw new Error('Real course API is not implemented yet');
  },
  async searchCourses() {
    throw new Error('Real course API is not implemented yet');
  },
  async getCoursePublic() {
    throw new Error('Real course API is not implemented yet');
  },
  async enrollCourse() {
    throw new Error('Real course API is not implemented yet');
  },
  async checkEnrollment() {
    throw new Error('Real course API is not implemented yet');
  },
  async getAuthorInfo() {
    throw new Error('Real course API is not implemented yet');
  },
  async getAuthorCourses() {
    throw new Error('Real course API is not implemented yet');
  },
  async getCourseProgress() {
    throw new Error('Real course API is not implemented yet');
  },
  async updateProgress() {
    throw new Error('Real course API is not implemented yet');
  },
  async submitQuiz() {
    throw new Error('Real course API is not implemented yet');
  },
  async submitCode() {
    throw new Error('Real course API is not implemented yet');
  },
  async submitDetailed() {
    throw new Error('Real course API is not implemented yet');
  },
  async getAIExplanation() {
    throw new Error('Real course API is not implemented yet');
  },
  async getAIHint() {
    throw new Error('Real course API is not implemented yet');
  },
};

export const courseApi: CourseApi = USE_MOCKS ? mockCourseApi : realCourseApi;
