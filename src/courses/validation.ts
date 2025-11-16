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
  if (!trimmed) return 'Название должно быть от 10 до 100 символов';
  if (trimmed.length < COURSE_TITLE_MIN || trimmed.length > COURSE_TITLE_MAX) {
    return 'Название должно быть от 10 до 100 символов';
  }
  return null;
}

export function validateCourseDescription(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Описание не может быть пустым';
  if (trimmed.length > COURSE_DESCRIPTION_MAX) {
    return 'Описание не должно превышать 1000 символов';
  }
  return null;
}

export function validateCoverFile(file: File | null): string | null {
  if (!file) return null;
  if (!ALLOWED_COVER_TYPES.includes(file.type)) {
    return 'Неверный формат или размер файла. Максимум 2 МБ, JPG или PNG';
  }
  if (file.size > COVER_MAX_BYTES) {
    return 'Неверный формат или размер файла. Максимум 2 МБ, JPG или PNG';
  }
  return null;
}

export function validateCoverMeta(
  cover: CreateCourseInput['cover'] | null | undefined,
): string | null {
  if (!cover) return null;
  if (cover.size > COVER_MAX_BYTES) {
    return 'Неверный формат или размер файла. Максимум 2 МБ, JPG или PNG';
  }
  return null;
}

export function validateTagValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Тег не может быть пустым';
  if (trimmed.length > TAG_MAX_LENGTH) {
    return 'Тег не должен быть длиннее 15 символов';
  }
  return null;
}

export function validateTags(tags: string[]): string | null {
  if (tags.length > TAG_MAX_COUNT) {
    return 'Количество тегов слишком большое';
  }
  if (tags.some((t) => t.trim().length > TAG_MAX_LENGTH)) {
    return 'Тег не должен быть длиннее 15 символов';
  }
  return null;
}
