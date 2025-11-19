import type { Course } from './types';

const STORAGE_KEY = 'oh-front-courses';

export function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID() as string}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeParse(raw: string | null): Course[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Course[];
  } catch {
    return [];
  }
}

export function loadCourses(): Course[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return safeParse(raw);
}

export function saveCourses(courses: Course[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

export function findCourseById(courseId: string): Course | undefined {
  const courses = loadCourses();
  return courses.find((c) => c.id === courseId);
}

export function upsertCourse(course: Course): Course {
  const courses = loadCourses();
  const idx = courses.findIndex((c) => c.id === course.id);
  if (idx >= 0) {
    courses[idx] = course;
  } else {
    courses.push(course);
  }
  saveCourses(courses);
  return course;
}

export function deleteCourseById(courseId: string): void {
  const courses = loadCourses().filter((c) => c.id !== courseId);
  saveCourses(courses);
}
