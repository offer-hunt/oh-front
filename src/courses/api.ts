import {
  deleteCourseById,
  findCourseById,
  generateId,
  loadCourses,
  upsertCourse,
} from './storage';
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
};

const GLOBAL_USE_MOCKS = import.meta.env.VITE_USE_MOCKS as string | undefined;
const USE_MOCKS =
  GLOBAL_USE_MOCKS !== undefined
    ? GLOBAL_USE_MOCKS === 'true'
    : (import.meta.env.VITE_COURSES_USE_MOCKS as string | undefined) !== 'false';

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
};

export const courseApi: CourseApi = USE_MOCKS ? mockCourseApi : realCourseApi;
