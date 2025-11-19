import type { CreateCourseInput } from './types';

export const COURSE_TITLE_MIN = 10;
export const COURSE_TITLE_MAX = 100;
export const COURSE_DESCRIPTION_MAX = 1000;
export const TAG_MAX_COUNT = 10;
export const TAG_MAX_LENGTH = 15;
export const COVER_MAX_BYTES = 2 * 1024 * 1024; // 2 МБ

const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png'];

export function validateCourseTitle(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Название не может быть пустым';
  if (trimmed.length < COURSE_TITLE_MIN || trimmed.length > COURSE_TITLE_MAX) {
    return `Название должно быть от ${COURSE_TITLE_MIN} до ${COURSE_TITLE_MAX} символов`;
  }
  return null;
}

export function validateCourseDescription(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Описание не может быть пустым';
  if (trimmed.length > COURSE_DESCRIPTION_MAX) {
    return `Описание не должно превышать ${COURSE_DESCRIPTION_MAX} символов`;
  }
  return null;
}

export function validateCoverFile(file: File | null): string | null {
  if (!file) return null;
  if (!ALLOWED_COVER_TYPES.includes(file.type)) {
    return 'Неверный формат файла. Допустимы только JPG или PNG';
  }
  if (file.size > COVER_MAX_BYTES) {
    return 'Слишком большой размер файла. Максимум 2 МБ';
  }
  return null;
}

export function validateTags(tags: string[]): string | null {
  if (tags.length > TAG_MAX_COUNT) {
    return 'Количество тегов слишком большое';
  }
  if (tags.some((t) => t.trim().length > TAG_MAX_LENGTH)) {
    return `Один из тегов длиннее ${TAG_MAX_LENGTH} символов`;
  }
  return null;
}
