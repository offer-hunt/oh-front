import { useState } from 'react';
import type { Course, CollaboratorRole } from '@/courses/types';
import { validateTags, validateCourseTitle, validateCourseDescription } from '@/courses/validation';

interface CourseSettingsProps {
  course: Course;
  onUpdate: (course: Course) => void;
  onPublish: () => void;
  onArchive: () => void;
  onDelete: () => void;
  notify: (msg: string, type?: 'success'|'error') => void;
}

export function CourseSettings({ course, onUpdate, onPublish, onArchive, onDelete, notify }: CourseSettingsProps) {
  const [tagInput, setTagInput] = useState('');
  const [collabEmail, setCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState<CollaboratorRole>('author');

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

  return (
    <div className="page-content">
       <h2 className="text-xl font-bold mb-6">Настройки курса</h2>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General Info */}
          <div>
              <h3 className="font-bold border-b pb-2 mb-4">Основная информация</h3>
              <div className="form-field">
                  <label className="form-label">Название</label>
                  <input className="form-input" value={course.title} onChange={e => handleMetaChange('title', e.target.value)} />
                  {validateCourseTitle(course.title) && <div className="form-error">{validateCourseTitle(course.title)}</div>}
              </div>
              <div className="form-field">
                  <label className="form-label">Описание</label>
                  <textarea className="form-input" rows={3} value={course.description} onChange={e => handleMetaChange('description', e.target.value)} />
                  {validateCourseDescription(course.description) && <div className="form-error">{validateCourseDescription(course.description)}</div>}
              </div>
              <div className="form-field">
                  <label className="form-label">Теги</label>
                  <div className="flex gap-2 mb-2">
                      <input className="form-input" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="React, JS..." onKeyDown={e => e.key === 'Enter' && handleAddTag()} />
                      <button className="btn btn-outline" onClick={handleAddTag}>+</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {course.tags.map(t => (
                          <span key={t} className="badge badge-draft flex items-center gap-1 px-3 py-1">
                              {t} <button onClick={() => onUpdate({...course, tags: course.tags.filter(tag => tag !== t)})} className="hover:text-red-600">×</button>
                          </span>
                      ))}
                  </div>
              </div>
          </div>

          {/* Collaborators & Actions */}
          <div>
              <h3 className="font-bold border-b pb-2 mb-4">Соавторы</h3>
              <div className="flex gap-2 mb-4 items-end">
                  <div className="flex-1">
                      <label className="form-label">Email</label>
                      <input className="form-input" value={collabEmail} onChange={e => setCollabEmail(e.target.value)} placeholder="colleague@example.com" />
                  </div>
                  <div className="w-32">
                      <label className="form-label">Роль</label>
                      <select className="form-input" value={collabRole} onChange={e => setCollabRole(e.target.value as any)}>
                          <option value="author">Автор</option>
                          <option value="moderator">Модератор</option>
                      </select>
                  </div>
                  <button className="btn btn-outline" onClick={handleAddCollaborator}>Добавить</button>
              </div>
              <div className="bg-[var(--bg-app)] rounded p-2 mb-8">
                  {course.collaborators.length === 0 && <div className="text-sm text-center text-[var(--text-tertiary)]">Нет соавторов</div>}
                  {course.collaborators.map(c => (
                      <div key={c.id} className="flex justify-between items-center p-2 border-b border-[var(--border)] last:border-0">
                          <div>
                              <div className="text-sm font-medium">{c.email}</div>
                              <div className="text-xs text-[var(--text-secondary)]">{c.role} • {c.isPending ? 'Pending' : 'Active'}</div>
                          </div>
                          <button onClick={() => onUpdate({...course, collaborators: course.collaborators.filter(x => x.id !== c.id)})} className="text-red-500 text-sm">Удалить</button>
                      </div>
                  ))}
              </div>

              <h3 className="font-bold border-b pb-2 mb-4">Управление статусом</h3>
              <div className="flex flex-col gap-3">
                  {course.status !== 'published' ? (
                       <button className="btn btn-primary w-full justify-center" onClick={onPublish}>🚀 Опубликовать курс</button>
                  ) : (
                       <div className="text-center p-2 bg-green-50 text-green-700 rounded border border-green-200 mb-2">Курс опубликован</div>
                  )}

                  <button className="btn btn-outline w-full justify-center" onClick={onArchive}>📁 Архивация</button>

                  <div className="pt-4 border-t mt-2">
                      <button className="btn btn-danger w-full justify-center" onClick={onDelete}>🗑 Удалить курс навсегда</button>
                  </div>
              </div>
          </div>
       </div>
    </div>
  );
}
