import { useState, useRef } from 'react';
import type { Course, CollaboratorRole } from '@/courses/types';
import { validateTags, validateCourseTitle, validateCourseDescription } from '@/courses/validation';
import { Icons } from '@/components/Icons';

interface CourseSettingsProps {
  course: Course;
  onUpdate: (course: Course) => void;
  onPublish: () => void;
  onArchive: () => void;
  onDelete: () => void;
  notify: (msg: string, type?: 'success'|'error') => void;
}

interface PublishValidationError {
  field: string;
  message: string;
}

function validateCourseForPublish(course: Course): PublishValidationError[] {
  const errors: PublishValidationError[] = [];

  // UC 11.2: Check title and description
  if (!course.title || course.title.trim().length < 10) {
    errors.push({ field: 'title', message: 'Добавьте название курса (минимум 10 символов)' });
  }

  if (!course.description || course.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Добавьте описание курса' });
  }

  // UC 11.2: Check cover
  if (!course.cover) {
    errors.push({ field: 'cover', message: 'Добавьте обложку курса' });
  }

  // UC 11.2: Check at least one published lesson
  const hasLessons = course.chapters.some(ch => ch.lessons.length > 0);
  if (!hasLessons) {
    errors.push({ field: 'content', message: 'Добавьте хотя бы один урок' });
  }

  // UC 11.2: Check all lessons have required fields
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      if (!lesson.title || lesson.title.trim().length === 0) {
        errors.push({
          field: 'lessons',
          message: `Урок без названия в главе "${chapter.title}"`
        });
      }
      if (lesson.pages.length === 0) {
        errors.push({
          field: 'lessons',
          message: `Урок "${lesson.title}" не содержит страниц`
        });
      }
    }
  }

  return errors;
}

export function CourseSettings({ course, onUpdate, onPublish, onArchive, onDelete, notify }: CourseSettingsProps) {
  const [tagInput, setTagInput] = useState('');
  const [collabEmail, setCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState<CollaboratorRole>('author');
  const [showPublishErrors, setShowPublishErrors] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publishValidationErrors = validateCourseForPublish(course);

  const handleMetaChange = (field: keyof Course, value: string) => {
    onUpdate({ ...course, [field]: value });
  };

  const handleAddTag = () => {
    const val = tagInput.trim();
    if (!val) return;
    const newTags = [...course.tags, val];
    const err = validateTags(newTags);
    if (err) { notify(err, 'error'); return; }

    onUpdate({ ...course, tags: newTags });
    setTagInput('');
    notify('Тег добавлен', 'success');
  };

  const handleAddCollaborator = () => {
    if (!collabEmail.includes('@')) { notify('Некорректный email', 'error'); return; }
    if (course.collaborators.find(c => c.email === collabEmail)) { notify('Уже добавлен', 'error'); return; }

    // Mock logic: User existence check would happen in API
    const newCollab = {
        id: Date.now().toString(),
        email: collabEmail,
        role: collabRole,
        isPending: true // Point 10.4
    };
    onUpdate({ ...course, collaborators: [...course.collaborators, newCollab] });
    setCollabEmail('');
    notify(`Приглашение отправлено ${newCollab.email}`, 'success');
  };

  const handlePublishClick = () => {
    if (publishValidationErrors.length > 0) {
      setShowPublishErrors(true);
      notify('Курс не готов к публикации', 'error');
      return;
    }
    onPublish();
    setShowPublishErrors(false);
  };

  // Обработка загрузки обложки
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      notify('Пожалуйста, выберите изображение', 'error');
      return;
    }

    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notify('Размер файла не должен превышать 5MB', 'error');
      return;
    }

    // Создаём превью
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Обновляем курс
    onUpdate({
      ...course,
      cover: {
        name: file.name,
        size: file.size
      }
    });
    notify('Обложка загружена', 'success');
  };

  const handleRemoveCover = () => {
    onUpdate({ ...course, cover: null });
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    notify('Обложка удалена', 'success');
  };

  return (
    <div className="page-content">
       <h2 className="text-xl font-bold mb-6">Настройки курса</h2>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Cover Image Section */}
            <div>
              <h3 className="font-bold border-b border-[var(--border-subtle)] pb-2 mb-4">Обложка курса</h3>
              <div className="space-y-4">
                {/* Cover Preview */}
                <div
                  className="relative w-full aspect-video rounded-xl border-2 border-dashed border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-app)] cursor-pointer hover:border-[var(--primary)] transition-colors group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {coverPreview || course.cover ? (
                    <>
                      {/* Если есть превью или имя файла - показываем изображение */}
                      {coverPreview ? (
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🖼️</div>
                            <div className="text-sm text-[var(--text-secondary)]">{course.cover?.name}</div>
                            <div className="text-xs text-[var(--text-tertiary)]">
                              {course.cover?.size ? `${(course.cover.size / 1024).toFixed(1)} KB` : ''}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button
                          className="w-12 h-12 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          title="Заменить"
                        >
                          <Icons.File width={24} height={24} />
                        </button>
                        <button
                          className="w-12 h-12 rounded-xl bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-white transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleRemoveCover(); }}
                          title="Удалить"
                        >
                          <Icons.Trash width={24} height={24} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] group-hover:text-[var(--primary)] transition-colors">
                      <div className="w-16 h-16 rounded-2xl bg-[var(--primary-soft)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icons.Plus width={32} height={32} className="text-[var(--primary)]" />
                      </div>
                      <div className="text-sm font-medium">Нажмите для загрузки</div>
                      <div className="text-xs mt-1">PNG, JPG до 5MB</div>
                    </div>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />

                {/* Cover actions */}
                <div className="flex gap-2">
                  <button
                    className="btn btn-outline flex-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icons.Plus width={16} height={16} />
                    {course.cover ? 'Заменить' : 'Загрузить'}
                  </button>
                  {course.cover && (
                    <button
                      className="btn btn-outline text-[var(--danger)] hover:border-[var(--danger)]"
                      onClick={handleRemoveCover}
                    >
                      <Icons.Trash width={16} height={16} />
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* General Info */}
            <div>
              <h3 className="font-bold border-b border-[var(--border-subtle)] pb-2 mb-4">Основная информация</h3>
              <div className="form-field">
                  <label className="form-label">Название</label>
                  <input className="form-input" value={course.title} onChange={e => handleMetaChange('title', e.target.value)} />
                  {validateCourseTitle(course.title) && <div className="form-error">{validateCourseTitle(course.title)}</div>}
              </div>
              <div className="form-field">
                  <label className="form-label">Описание</label>
                  <textarea className="form-input" rows={4} value={course.description} onChange={e => handleMetaChange('description', e.target.value)} />
                  {validateCourseDescription(course.description) && <div className="form-error">{validateCourseDescription(course.description)}</div>}
              </div>
              <div className="form-field">
                  <label className="form-label">Теги</label>
                  <div className="flex gap-2 mb-3">
                      <input className="form-input" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="React, JS..." onKeyDown={e => e.key === 'Enter' && handleAddTag()} />
                      <button className="btn btn-outline" onClick={handleAddTag}>
                        <Icons.Plus width={16} height={16} />
                      </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {course.tags.map(t => (
                          <span key={t} className="badge badge-draft flex items-center gap-2 px-3 py-1.5 text-sm">
                              {t}
                              <button onClick={() => onUpdate({...course, tags: course.tags.filter(tag => tag !== t)})} className="hover:text-red-500 transition-colors">×</button>
                          </span>
                      ))}
                      {course.tags.length === 0 && (
                        <span className="text-sm text-[var(--text-tertiary)]">Нет тегов</span>
                      )}
                  </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Collaborators */}
            <div>
              <h3 className="font-bold border-b border-[var(--border-subtle)] pb-2 mb-4">Соавторы</h3>
              <div className="flex gap-2 mb-4 items-end">
                  <div className="flex-1">
                      <label className="form-label">Email</label>
                      <input className="form-input" value={collabEmail} onChange={e => setCollabEmail(e.target.value)} placeholder="colleague@example.com" />
                  </div>
                  <div className="w-32">
                      <label className="form-label">Роль</label>
                      <select className="form-input" value={collabRole} onChange={e => setCollabRole(e.target.value as CollaboratorRole)}>
                          <option value="author">Автор</option>
                          <option value="moderator">Модератор</option>
                      </select>
                  </div>
                  <button className="btn btn-outline h-[42px]" onClick={handleAddCollaborator}>
                    <Icons.Plus width={16} height={16} />
                    Добавить
                  </button>
              </div>
              <div className="bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                  {course.collaborators.length === 0 ? (
                    <div className="py-8 text-center text-[var(--text-tertiary)]">
                      <div className="text-3xl mb-2">👥</div>
                      <div className="text-sm">Нет соавторов</div>
                    </div>
                  ) : (
                    course.collaborators.map(c => (
                        <div key={c.id} className="flex justify-between items-center p-4 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface)] transition-colors">
                            <div>
                                <div className="font-medium">{c.email}</div>
                                <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                                  <span className="capitalize">{c.role}</span>
                                  <span>•</span>
                                  <span className={c.isPending ? 'text-amber-400' : 'text-emerald-400'}>
                                    {c.isPending ? 'Ожидает' : 'Активен'}
                                  </span>
                                </div>
                            </div>
                            <button
                              onClick={() => onUpdate({...course, collaborators: course.collaborators.filter(x => x.id !== c.id)})}
                              className="btn btn-ghost text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                            >
                              <Icons.Trash width={16} height={16} />
                            </button>
                        </div>
                    ))
                  )}
              </div>
            </div>

            {/* Status Management */}
            <div>
              <h3 className="font-bold border-b border-[var(--border-subtle)] pb-2 mb-4">Управление статусом</h3>

              {/* Publication Readiness Check */}
              {course.status !== 'published' && publishValidationErrors.length > 0 && showPublishErrors && (
                <div className="mb-4 p-4 rounded-xl bg-[var(--danger-soft)] border border-[var(--danger)]">
                  <div className="flex items-start gap-3">
                    <Icons.AlertTriangle width={20} height={20} className="text-[var(--danger)] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--danger)] mb-2">Курс не готов к публикации</div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-[var(--danger)]">
                        {publishValidationErrors.map((err, idx) => (
                          <li key={idx}>{err.message}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                  {course.status !== 'published' ? (
                       <button className="btn btn-primary w-full justify-center h-12 text-base" onClick={handlePublishClick}>
                         <Icons.CheckCircle width={20} height={20} />
                         Опубликовать курс
                       </button>
                  ) : (
                       <div className="text-center p-4 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2 font-medium">
                         <Icons.CheckCircle width={20} height={20} />
                         Курс опубликован
                       </div>
                  )}

                  <button className="btn btn-outline w-full justify-center h-11" onClick={onArchive}>
                    <Icons.Archive width={18} height={18} />
                    {course.status === 'archived' ? 'Курс в архиве' : 'Архивировать'}
                  </button>

                  <div className="pt-4 border-t border-[var(--border-subtle)] mt-2">
                      <button className="btn w-full justify-center h-11 bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/30 hover:bg-[var(--danger)] hover:text-white hover:border-[var(--danger)] transition-all" onClick={onDelete}>
                        <Icons.Trash width={18} height={18} />
                        Удалить курс навсегда
                      </button>
                  </div>
              </div>
            </div>
          </div>
       </div>
    </div>
  );
}
