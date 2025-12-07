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
