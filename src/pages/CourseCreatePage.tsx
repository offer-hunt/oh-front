import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';
import { courseApi } from '@/courses/api';
import { logCourseEvent } from '@/courses/logger';
import {
  TAG_MAX_COUNT,
  validateCourseDescription,
  validateCourseTitle,
  validateCoverFile,
  validateTags,
  validateTagValue,
} from '@/courses/validation';

export default function CourseCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [titleError, setTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [tagsError, setTagsError] = useState<string | null>(null);

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    const error = validateCoverFile(file);
    setCoverError(error);
    if (error) {
      logCourseEvent('Course creation failed – invalid cover');
    }
  };

  const handleAddTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    const valueError = validateTagValue(value);
    if (valueError) {
      setTagsError(valueError);
      return;
    }
    if (tags.length >= TAG_MAX_COUNT) {
      setTagsError('Количество тегов слишком большое');
      return;
    }
    if (tags.includes(value)) return;
    setTags([...tags, value]);
    setTagInput('');
    setTagsError(null);
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const validateAll = (): boolean => {
    let ok = true;

    const tErr = validateCourseTitle(title);
    setTitleError(tErr);
    if (tErr) {
      logCourseEvent('Course creation failed – invalid title');
      ok = false;
    }

    const dErr = validateCourseDescription(description);
    setDescriptionError(dErr);
    if (dErr) {
      logCourseEvent('Course creation failed – invalid description');
      ok = false;
    }

    const cErr = validateCoverFile(coverFile);
    setCoverError(cErr);
    if (cErr) {
      logCourseEvent('Course creation failed – invalid cover');
      ok = false;
    }

    const tagsErr = validateTags(tags);
    setTagsError(tagsErr);
    if (tagsErr) {
      ok = false;
    }

    return ok;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (!validateAll()) return;

    setIsSubmitting(true);

    try {
      const course = await courseApi.createCourse(user?.id, {
        title,
        description,
        duration,
        tags,
        cover: coverFile
          ? {
              name: coverFile.name,
              size: coverFile.size,
            }
          : null,
      });

      setSuccessMessage('Курс успешно создан');
      logCourseEvent('Course created', { courseId: course.id });

      // редирект на страницу редактирования курса
      navigate(`/courses/${course.id}`, { replace: true });
    } catch (err) {
      setServerError('Не удалось создать курс. Попробуйте позже.');
      logCourseEvent('Course creation failed – server error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1>Создание курса</h1>

      {serverError && <div className="alert alert--error">{serverError}</div>}
      {successMessage && (
        <div className="alert alert--success">{successMessage}</div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="course-title" className="form-label">
            Название курса*
          </label>
          <input
            id="course-title"
            type="text"
            className={`form-input ${titleError ? 'form-input--error' : ''}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {titleError && <div className="form-error">{titleError}</div>}
        </div>

        <div className="form-field">
          <label htmlFor="course-description" className="form-label">
            Описание курса*
          </label>
          <textarea
            id="course-description"
            className={`form-input ${
              descriptionError ? 'form-input--error' : ''
            }`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
          {descriptionError && (
            <div className="form-error">{descriptionError}</div>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="course-duration" className="form-label">
            Длительность (например, &quot;6 недель&quot;)
          </label>
          <input
            id="course-duration"
            type="text"
            className="form-input"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="course-cover" className="form-label">
            Обложка (JPG/PNG, до 2 МБ)
          </label>
          <input
            id="course-cover"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleCoverChange}
          />
          {coverError && <div className="form-error">{coverError}</div>}
        </div>

        <div className="form-field">
          <label htmlFor="course-tags" className="form-label">
            Теги (до {TAG_MAX_COUNT})
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              id="course-tags"
              type="text"
              className={`form-input ${tagsError ? 'form-input--error' : ''}`}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleAddTag}
            >
              Добавить тег
            </button>
          </div>
          {tagsError && <div className="form-error">{tagsError}</div>}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '999px',
                    border: '1px solid var(--color-border, #ddd)',
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    className="btn btn-text"
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Удалить тег ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          Сохранить черновик
        </button>
      </form>
    </div>
  );
}
