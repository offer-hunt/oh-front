export type CourseStatus = 'draft' | 'published' | 'archived';

export type CourseAccessType = 'public' | 'private_link';

export type PageKind = 'theory' | 'quiz' | 'code' | 'detailed';

export type AiTextMode = 'simplify' | 'academic' | 'grammar' | 'expand' | 'example';

export type AiTestQuestionType = 'single' | 'multiple' | 'boolean';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'csharp';

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface TheoryPageContent {
  mode: 'text' | 'markdown' | 'video';
  text?: string;
  markdown?: string;
  videoUrl?: string;
  // Добавлено согласно UC 5.3 (прикрепление файлов)
  attachments?: AttachedFile[];
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizPageContent {
  question: string;
  options: QuizOption[];
}

export interface CodeTestCase {
  id: string;
  input: string;
  output: string;
}

export interface CodePageContent {
  description: string;
  language: SupportedLanguage | '';
  testCases: CodeTestCase[];
}

export type DetailedAnswerMode = 'exact' | 'prompt';

export interface DetailedAnswerPageContent {
  description: string;
  answer: string;
  // Обязательно для UC 8.3
  answerMode: DetailedAnswerMode;
}

export interface BasePage {
  id: string;
  title: string;
  kind: PageKind;
}

export interface TheoryPage extends BasePage {
  kind: 'theory';
  theory: TheoryPageContent;
}

export interface QuizPage extends BasePage {
  kind: 'quiz';
  quiz: QuizPageContent;
}

export interface CodePage extends BasePage {
  kind: 'code';
  code: CodePageContent;
}

export interface DetailedPage extends BasePage {
  kind: 'detailed';
  detailed: DetailedAnswerPageContent;
}

export type LessonPage = TheoryPage | QuizPage | CodePage | DetailedPage;

export interface Lesson {
  id: string;
  title: string;
  pages: LessonPage[];
  isDemoAvailable?: boolean; // Доступен для предпросмотра без записи
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export type CollaboratorRole = 'author' | 'moderator';

export interface Collaborator {
  id: string;
  email: string;
  role: CollaboratorRole;
  name?: string;
  isPending?: boolean;
}

export interface CourseAuthor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface VersionSnapshot {
  id: string;
  createdAt: string;
  label?: string;
  comment?: string;
  snapshot: string;
}

export interface Course {
  id: string;
  ownerId?: string;
  author?: CourseAuthor; // Информация об авторе для публичного отображения
  title: string;
  description: string;
  duration?: string;
  cover?: {
    name: string;
    size: number;
  } | null;
  tags: string[];
  status: CourseStatus;
  accessType?: CourseAccessType; // Публичный или по ссылке
  enrollmentsCount?: number; // Количество записавшихся
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
  collaborators: Collaborator[];
  versions: VersionSnapshot[];
}

export interface CourseSummary {
  id: string;
  title: string;
  description?: string;
  author?: CourseAuthor;
  status: CourseStatus;
  tags: string[];
  duration?: string;
  enrollmentsCount?: number;
  cover?: {
    name: string;
    size: number;
  } | null;
  createdAt: string;
  updatedAt: string;
  lessonsCount: number;
  pagesCount: number;
}

export interface CreateCourseInput {
  title: string;
  description: string;
  duration?: string;
  tags: string[];
  cover?: {
    name: string;
    size: number;
  } | null;
}

// Типы для поиска и фильтрации
export interface CourseFilters {
  languages?: string[]; // Языки программирования
  technologies?: string[]; // Технологии
  difficulty?: string[]; // Сложность (Junior, Middle, Senior)
  duration?: string[]; // Длительность
}

export interface CourseSearchParams {
  q?: string; // Текстовый поиск
  filters?: CourseFilters;
  authorId?: string; // Для просмотра курсов автора
}

// Типы для enrollment (записи на курс)
export interface EnrollmentStatus {
  isEnrolled: boolean;
  enrolledAt?: string;
}

export interface CourseWithEnrollment extends Course {
  enrollment?: EnrollmentStatus;
}

// ============================================
// ТИПЫ ДЛЯ ПРОХОЖДЕНИЯ КУРСА (LEARNING)
// ============================================

// Статус завершения страницы
export type PageCompletionStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

// Прогресс по конкретной странице
export interface PageProgress {
  pageId: string;
  status: PageCompletionStatus;
  startedAt?: string; // ISO дата начала
  completedAt?: string; // ISO дата завершения
  attempts: number; // Количество попыток
  lastAttemptAt?: string; // ISO дата последней попытки
  score?: number; // Оценка 0-100 (для quiz, code, detailed)
}

// Прогресс по всему курсу для пользователя
export interface CourseProgress {
  courseId: string;
  userId: string;
  startedAt: string; // ISO дата начала курса
  lastAccessedAt: string; // ISO дата последнего доступа
  lastPageId?: string; // ID последней просмотренной страницы (для возврата)
  pageProgress: Record<string, PageProgress>; // Маппинг pageId -> прогресс
  completionPercentage: number; // Процент завершения 0-100
}

// ============================================
// ТИПЫ ДЛЯ РЕШЕНИЙ (SUBMISSIONS)
// ============================================

// Статус проверки решения
export type SubmissionStatus = 'pending' | 'checking' | 'passed' | 'failed' | 'partial';

// Решение теста
export interface QuizSubmission {
  kind: 'quiz';
  pageId: string;
  selectedOptionIds: string[]; // ID выбранных опций
  submittedAt: string; // ISO дата отправки
}

// Решение кодовой задачи
export interface CodeSubmission {
  kind: 'code';
  pageId: string;
  code: string; // Код решения
  language: SupportedLanguage; // Язык программирования
  submittedAt: string; // ISO дата отправки
}

// Решение с развёрнутым ответом
export interface DetailedSubmission {
  kind: 'detailed';
  pageId: string;
  answer: string; // Текст ответа
  submittedAt: string; // ISO дата отправки
}

// Union type для всех типов решений
export type Submission = QuizSubmission | CodeSubmission | DetailedSubmission;

// ============================================
// ТИПЫ ДЛЯ РЕЗУЛЬТАТОВ ПРОВЕРКИ (EVALUATION)
// ============================================

// Результат проверки теста
export interface QuizEvaluationResult {
  status: SubmissionStatus;
  correctCount: number; // Количество правильных ответов
  totalCount: number; // Общее количество вопросов
  score: number; // Оценка 0-100
  correctOptionIds: string[]; // ID правильных опций (для отображения)
  feedback?: string; // Обратная связь
}

// Результат одного теста кодовой задачи
export interface CodeTestResult {
  testCaseId: string;
  passed: boolean; // Тест прошёл или нет
  input: string; // Входные данные
  expectedOutput: string; // Ожидаемый результат
  actualOutput?: string; // Фактический результат
  error?: string; // Сообщение об ошибке (если тест не прошёл)
}

// Результат проверки кодовой задачи
export interface CodeEvaluationResult {
  status: SubmissionStatus;
  passedTests: number; // Количество пройденных тестов
  totalTests: number; // Общее количество тестов
  score: number; // Оценка 0-100
  testResults: CodeTestResult[]; // Результаты каждого теста
  executionTime?: number; // Время выполнения в мс
  feedback?: string; // Обратная связь
}

// Результат проверки развёрнутого ответа
export interface DetailedEvaluationResult {
  status: SubmissionStatus;
  score: number; // Оценка 0-100
  feedback: string; // Обратная связь от проверяющего/AI
  suggestions?: string[]; // Рекомендации по улучшению
}

// Union type для всех типов результатов
export type EvaluationResult = QuizEvaluationResult | CodeEvaluationResult | DetailedEvaluationResult;

// Запись о решении с результатом
export interface SubmissionRecord {
  id: string; // ID записи
  courseId: string;
  userId: string;
  submission: Submission; // Само решение
  result?: EvaluationResult; // Результат проверки (может быть undefined если ещё проверяется)
  createdAt: string; // ISO дата создания
}

// ============================================
// ТИПЫ ДЛЯ AI-АССИСТЕНТА
// ============================================

// Типы действий AI-ассистента
export type AIAssistantAction = 'explain' | 'hint' | 'example';

// Запрос к AI-ассистенту
export interface AIRequest {
  action: AIAssistantAction;
  pageId: string;
  pageKind: PageKind;
  context: {
    selectedText?: string; // Для объяснения выделенного текста (theory)
    question?: string; // Для подсказок по задачам
    attemptCount?: number; // Количество попыток (для адаптивных подсказок)
  };
}

// Ответ от AI-ассистента
export interface AIResponse {
  action: AIAssistantAction;
  content: string; // Текст ответа
  timestamp: string; // ISO дата/время ответа
}

// Лимиты использования AI
export interface AIUsageLimit {
  hintsUsed: number; // Использовано подсказок
  maxHints: number; // Максимум подсказок (например, 3 на страницу)
}
