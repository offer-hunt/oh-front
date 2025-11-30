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
  CourseSummary,
  CreateCourseInput,
  VersionSnapshot,
} from './types';

export interface CourseApi {
  listCourses(ownerId?: string): Promise<CourseSummary[]>;
  getCourse(courseId: string): Promise<Course>;
  createCourse(ownerId: string | undefined, input: CreateCourseInput): Promise<Course>;
  updateCourse(course: Course): Promise<Course>;
  deleteCourse(courseId: string): Promise<void>;
  saveVersion(courseId: string, comment?: string): Promise<VersionSnapshot>;
  restoreVersion(courseId: string, versionId: string): Promise<Course>;
}

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
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

  return {
    id: course.id,
    title: course.title,
    status: course.status,
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
};

export const courseApi: CourseApi = USE_MOCKS ? mockCourseApi : realCourseApi;
