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
    <div className="min-h-screen bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-surface)]">
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        {/* Header with improved visual hierarchy */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 shadow-lg">
            <Icons.Plus width={32} height={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
            Создать новый курс
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Заполните основную информацию о курсе. Вы сможете добавить уроки и контент после создания.
          </p>
        </div>

        {/* Card with better spacing and shadows */}
        <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Section: Basic Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center">
                <span className="text-sm font-bold text-[var(--primary)]">1</span>
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Основная информация</h2>
            </div>

            {/* Title */}
            <div className="form-field">
              <label className="form-label text-sm font-semibold">
                Название курса <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                className={`form-input text-base ${errors.title ? 'border-[var(--danger)] focus:border-[var(--danger)]' : ''}`}
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                }}
                placeholder="Например: Основы React для начинающих"
                maxLength={100}
              />
              <div className="flex justify-between items-start mt-2">
                {errors.title && <div className="form-error">{errors.title}</div>}
                <div className="text-xs text-[var(--text-tertiary)] ml-auto">
                  {title.length} / 100
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="form-field">
              <label className="form-label text-sm font-semibold">
                Описание <span className="text-[var(--danger)]">*</span>
              </label>
              <textarea
                className={`form-input text-base leading-relaxed ${errors.description ? 'border-[var(--danger)] focus:border-[var(--danger)]' : ''}`}
                rows={6}
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                }}
                placeholder="Расскажите, о чем этот курс, что изучат студенты, какие навыки они получат..."
                maxLength={1000}
              />
              <div className="flex justify-between items-start mt-2">
                {errors.description && <div className="form-error">{errors.description}</div>}
                <div className="text-xs text-[var(--text-tertiary)] ml-auto">
                  {description.length} / 1000
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="form-field">
              <label className="form-label text-sm font-semibold">Длительность курса</label>
              <input
                className="form-input text-base"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="Например: 8 недель, 20 часов, 3 месяца"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                Укажите примерное время прохождения курса
              </p>
            </div>
          </div>

          {/* Section: Visual Assets */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center">
                <span className="text-sm font-bold text-[var(--primary)]">2</span>
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Обложка курса</h2>
            </div>

            <div className="form-field">
              <div className="bg-[var(--bg-input)] rounded-xl p-6 border border-[var(--border-subtle)]">
                {coverPreview ? (
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="relative w-full md:w-64 h-40 rounded-xl overflow-hidden border-2 border-[var(--border-strong)] shadow-lg group">
                      <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setCoverFile(null);
                            setCoverPreview(null);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--danger)] text-white rounded-lg px-4 py-2 font-medium hover:bg-[var(--danger)]/90 flex items-center gap-2"
                        >
                          <Icons.Trash width={16} height={16} />
                          Удалить
                        </button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[var(--text-primary)] mb-2">Обложка загружена</h4>
                      <p className="text-sm text-[var(--text-secondary)] mb-3">
                        Обложка помогает привлечь внимание студентов к вашему курсу
                      </p>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        <p>✓ Формат: {coverFile?.name.split('.').pop()?.toUpperCase()}</p>
                        <p>✓ Размер: {((coverFile?.size || 0) / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center py-12 cursor-pointer group">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                      <Icons.Plus width={32} height={32} className="text-white" />
                    </div>
                    <span className="text-base font-semibold text-[var(--text-primary)] mb-2">Загрузить обложку</span>
                    <span className="text-sm text-[var(--text-secondary)] mb-4">или перетащите файл сюда</span>
                    <div className="text-xs text-[var(--text-tertiary)] text-center">
                      <p>Рекомендуемый размер: 1200×630 пикселей</p>
                      <p>Форматы: JPG, PNG • Максимальный размер: 2 МБ</p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </label>
                )}
                {errors.cover && <div className="form-error mt-3">{errors.cover}</div>}
              </div>
            </div>
          </div>

          {/* Section: Tags */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center">
                <span className="text-sm font-bold text-[var(--primary)]">3</span>
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Теги и категории</h2>
            </div>

            <div className="form-field">
              <label className="form-label text-sm font-semibold mb-3">
                Теги курса
              </label>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Добавьте теги, чтобы студенты могли легче найти ваш курс. Например: React, JavaScript, Frontend
              </p>

              <div className="flex gap-3 mb-4">
                <input
                  className={`form-input flex-1 text-base ${errors.tags ? 'border-[var(--danger)] focus:border-[var(--danger)]' : ''}`}
                  value={tagInput}
                  onChange={e => {
                    setTagInput(e.target.value);
                    if (errors.tags) setErrors(prev => ({ ...prev, tags: '' }));
                  }}
                  placeholder="Введите тег..."
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
                  className="btn btn-primary px-6 whitespace-nowrap"
                  disabled={!tagInput.trim() || tags.length >= 10}
                >
                  + Добавить
                </button>
              </div>

              {tags.length > 0 && (
                <div className="bg-[var(--bg-input)] rounded-xl p-4 border border-[var(--border-subtle)]">
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 text-white text-sm font-medium shadow-md hover:shadow-lg transition-shadow"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        >
                          <Icons.Trash width={14} height={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start mt-3">
                {errors.tags && <div className="form-error">{errors.tags}</div>}
                <div className="text-xs text-[var(--text-tertiary)] ml-auto font-medium">
                  {tags.length} / 10 тегов
                </div>
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-5 rounded-xl bg-[var(--danger-soft)] border-2 border-[var(--danger)] text-[var(--danger)] flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="font-semibold mb-1">Ошибка создания курса</div>
                <div className="text-sm">{errors.submit}</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t-2 border-[var(--border-subtle)]">
            <button
              type="button"
              className="btn btn-ghost text-base order-2 sm:order-1"
              onClick={() => navigate('/courses')}
              disabled={loading}
            >
              Отменить
            </button>
            <button
              type="submit"
              className="btn btn-primary px-10 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow order-1 sm:order-2 w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Создание курса...
                </>
              ) : (
                <>
                  Сохранить черновик
                  <span className="ml-2">→</span>
                </>
              )}
            </button>
          </div>
        </form>
        </div>

        {/* Footer hint */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--text-tertiary)]">
            После создания курса вы сможете добавить главы, уроки и различные типы контента
          </p>
        </div>
      </div>
    </div>
  );
}
