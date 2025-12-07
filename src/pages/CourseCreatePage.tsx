import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseApi } from '@/courses/api';
import { useAuth } from '@/auth/AuthContext';
import {
  validateCourseTitle,
  validateCourseDescription,
  validateCoverFile,
  validateTags,
  COVER_MAX_BYTES
} from '@/courses/validation';
import { logCourseEvent } from '@/courses/logger';
import { Icons } from '@/components/Icons';

export default function CourseCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      const error = validateCoverFile(file);
      if (error) {
        setErrors(prev => ({ ...prev, cover: error }));
        logCourseEvent('Course creation failed – invalid cover');
        return;
      }

      setCoverFile(file);
      setErrors(prev => ({ ...prev, cover: '' }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCoverFile(null);
      setCoverPreview(null);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;

    if (trimmed.length > 15) {
      setErrors(prev => ({ ...prev, tags: 'Тег не может быть длиннее 15 символов' }));
      return;
    }

    const newTags = [...tags, trimmed];
    const error = validateTags(newTags);

    if (error) {
      setErrors(prev => ({ ...prev, tags: error }));
      return;
    }

    setTags(newTags);
    setTagInput('');
    setErrors(prev => ({ ...prev, tags: '' }));
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
    setErrors(prev => ({ ...prev, tags: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const titleError = validateCourseTitle(title);
    if (titleError) {
      newErrors.title = titleError;
      logCourseEvent('Course creation failed – invalid title');
    }

    const descError = validateCourseDescription(description);
    if (descError) {
      newErrors.description = descError;
      logCourseEvent('Course creation failed – invalid description');
    }

    if (coverFile) {
      const coverError = validateCoverFile(coverFile);
      if (coverError) {
        newErrors.cover = coverError;
        logCourseEvent('Course creation failed – invalid cover');
      }
    }

    const tagsError = validateTags(tags);
    if (tagsError) {
      newErrors.tags = tagsError;
      logCourseEvent('Tags add failed – server error');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const newCourse = await courseApi.createCourse(user?.id, {
        title: title.trim(),
        description: description.trim(),
        duration: duration.trim() || undefined,
        tags,
        cover: coverFile ? {
          name: coverFile.name,
          size: coverFile.size
        } : null
      });

      logCourseEvent('Course created', { courseId: newCourse.id });
      navigate(`/courses/${newCourse.id}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Не удалось создать курс. Попробуйте позже';
      setErrors(prev => ({ ...prev, submit: errorMsg }));
      logCourseEvent('Course creation failed – server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Создать новый курс</h1>
        <p className="text-[var(--text-secondary)]">Заполните основную информацию о курсе. Вы сможете добавить уроки после создания.</p>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="form-field">
            <label className="form-label">
              Название курса <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              className={`form-input ${errors.title ? 'border-[var(--danger)]' : ''}`}
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
              }}
              placeholder="Например: Основы React для начинающих"
              maxLength={100}
            />
            <div className="flex justify-between items-start mt-1">
              {errors.title && <div className="form-error">{errors.title}</div>}
              <div className="text-xs text-[var(--text-tertiary)] ml-auto">
                {title.length} / 100
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="form-field">
            <label className="form-label">
              Описание <span className="text-[var(--danger)]">*</span>
            </label>
            <textarea
              className={`form-input ${errors.description ? 'border-[var(--danger)]' : ''}`}
              rows={5}
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
              }}
              placeholder="Расскажите, о чем этот курс, что изучат студенты..."
              maxLength={1000}
            />
            <div className="flex justify-between items-start mt-1">
              {errors.description && <div className="form-error">{errors.description}</div>}
              <div className="text-xs text-[var(--text-tertiary)] ml-auto">
                {description.length} / 1000
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="form-field">
            <label className="form-label">Обложка курса</label>
            <div className="flex gap-4 items-start">
              {coverPreview ? (
                <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-[var(--danger)] text-white rounded-full p-1 hover:bg-[var(--danger)]/80"
                  >
                    <Icons.Trash width={14} height={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-48 h-32 border-2 border-dashed border-[var(--border-subtle)] rounded-lg cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-all">
                  <Icons.Plus width={24} height={24} className="text-[var(--text-tertiary)] mb-2" />
                  <span className="text-sm text-[var(--text-secondary)]">Загрузить обложку</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
              )}
              <div className="flex-1">
                <p className="text-sm text-[var(--text-secondary)] mb-1">
                  Рекомендуемый размер: 1200×630 пикселей
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Форматы: JPG, PNG. Максимальный размер: 2 МБ
                </p>
                {errors.cover && <div className="form-error mt-2">{errors.cover}</div>}
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="form-field">
            <label className="form-label">Длительность курса</label>
            <input
              className="form-input"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="Например: 8 недель, 20 часов"
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Укажите примерное время прохождения курса
            </p>
          </div>

          {/* Tags */}
          <div className="form-field">
            <label className="form-label">Теги</label>
            <div className="flex gap-2 mb-3">
              <input
                className={`form-input flex-1 ${errors.tags ? 'border-[var(--danger)]' : ''}`}
                value={tagInput}
                onChange={e => {
                  setTagInput(e.target.value);
                  if (errors.tags) setErrors(prev => ({ ...prev, tags: '' }));
                }}
                placeholder="React, JavaScript, Frontend..."
                maxLength={15}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn btn-outline px-6"
                disabled={!tagInput.trim() || tags.length >= 10}
              >
                Добавить
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary-text)] text-sm font-medium border border-[var(--primary)]/20"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-[var(--danger)] transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-between items-start">
              {errors.tags && <div className="form-error">{errors.tags}</div>}
              <div className="text-xs text-[var(--text-tertiary)] ml-auto">
                {tags.length} / 10 тегов
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-4 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)]">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate('/courses')}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn-primary px-8"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Создание...
                </>
              ) : (
                'Сохранить черновик'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
