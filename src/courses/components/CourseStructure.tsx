import { useState } from 'react';
import type { Course } from '@/courses/types';

interface CourseStructureProps {
  course: Course;
  selectedChapterId: string | null;
  selectedLessonId: string | null;
  selectedPageId: string | null;
  onSelectChapter: (id: string) => void;
  onSelectLesson: (id: string) => void;
  onSelectPage: (id: string) => void;
  onAddChapter: (title: string) => void;
  onAddLesson: (title: string) => void;
  onAddPage: (title: string, kind: string) => void;
  onDeleteLesson: (id: string) => void;
  onDeletePage: (id: string) => void;
}

export function CourseStructure({
  course,
  selectedChapterId,
  selectedLessonId,
  selectedPageId,
  onSelectChapter,
  onSelectLesson,
  onSelectPage,
  onAddChapter,
  onAddLesson,
  onAddPage,
  onDeleteLesson,
  onDeletePage,
}: CourseStructureProps) {
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');

  // State for inline creation within a selected lesson
  const [creatingInLessonId, setCreatingInLessonId] = useState<string | null>(null);
  const [creatingInChapterId, setCreatingInChapterId] = useState<string | null>(null);
  const [pageType, setPageType] = useState('theory');

  const handleAddChapterSubmit = () => {
    if (newItemTitle.trim()) onAddChapter(newItemTitle);
    setNewItemTitle('');
    setIsAddingChapter(false);
  };

  const handleAddLessonSubmit = (chapterId: string) => {
    if (newItemTitle.trim()) onAddLesson(newItemTitle);
    setNewItemTitle('');
    setCreatingInChapterId(null);
  };

  const handleAddPageSubmit = () => {
    if (newItemTitle.trim()) onAddPage(newItemTitle, pageType);
    setNewItemTitle('');
    setCreatingInLessonId(null);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3 style={{fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)'}}>
          Содержание
        </h3>
      </div>

      <div className="sidebar-content">
        {course.chapters.length === 0 && (
            <div style={{textAlign: 'center', padding: '2rem 0', color: 'var(--text-tertiary)', fontSize: '0.9rem'}}>
                Курс пуст.<br/>Создайте первую главу.
            </div>
        )}

        {course.chapters.map((ch, idx) => (
          <div key={ch.id} style={{marginBottom: '0.5rem'}}>
            {/* Chapter Node */}
            <div
                className={`tree-item ${selectedChapterId === ch.id && !selectedLessonId ? 'active' : ''}`}
                onClick={() => onSelectChapter(ch.id)}
            >
               <span style={{fontWeight: 700, marginRight: 6, fontSize: '0.8rem', opacity: 0.7}}>ГЛ {idx + 1}</span>
               <span style={{fontWeight: 600}}>{ch.title}</span>
               <div className="tree-item-actions">
                   <button onClick={(e) => { e.stopPropagation(); onSelectChapter(ch.id); setCreatingInChapterId(ch.id); }} title="Добавить урок">+</button>
               </div>
            </div>

            {/* Lessons */}
            <div style={{marginLeft: '0.5rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border)'}}>
                {ch.lessons.map((l, lIdx) => (
                    <div key={l.id}>
                        <div
                            className={`tree-item ${selectedLessonId === l.id && !selectedPageId ? 'active' : ''}`}
                            onClick={() => onSelectLesson(l.id)}
                            style={{fontSize: '0.9rem'}}
                        >
                             <span style={{marginRight: 6, opacity: 0.7}}>{lIdx + 1}.</span>
                             <span className="truncate">{l.title}</span>
                             <div className="tree-item-actions">
                                 <button onClick={(e) => { e.stopPropagation(); onSelectLesson(l.id); setCreatingInLessonId(l.id); }} title="Добавить страницу">+</button>
                                 <button onClick={(e) => { e.stopPropagation(); onDeleteLesson(l.id); }} className="text-danger" title="Удалить урок">×</button>
                             </div>
                        </div>

                        {/* Pages */}
                        {l.pages.length > 0 && (
                            <div style={{marginLeft: '1rem'}}>
                                {l.pages.map(p => {
                                    let icon = '📄';
                                    if (p.kind === 'quiz') icon = '❓';
                                    if (p.kind === 'code') icon = '💻';
                                    if (p.kind === 'detailed') icon = '📝';

                                    return (
                                        <div
                                            key={p.id}
                                            className={`tree-item ${selectedPageId === p.id ? 'active' : ''}`}
                                            onClick={() => onSelectPage(p.id)}
                                            style={{fontSize: '0.85rem', padding: '0.25rem 0.5rem'}}
                                        >
                                            <span style={{marginRight: 6}}>{icon}</span>
                                            <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{p.title}</span>
                                            <div className="tree-item-actions">
                                                <button onClick={(e) => { e.stopPropagation(); onDeletePage(p.id); }} title="Удалить">×</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Inline Create Page Form */}
                        {creatingInLessonId === l.id && (
                            <div style={{padding: '0.5rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem', marginLeft: '1rem'}}>
                                <input autoFocus className="form-input" style={{padding: '0.3rem', fontSize: '0.85rem', marginBottom: '0.25rem'}} placeholder="Название страницы" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
                                <select className="form-input" style={{padding: '0.3rem', fontSize: '0.85rem', marginBottom: '0.25rem'}} value={pageType} onChange={e => setPageType(e.target.value)}>
                                    <option value="theory">Теория</option>
                                    <option value="quiz">Тест</option>
                                    <option value="code">Код</option>
                                    <option value="detailed">Ответ</option>
                                </select>
                                <div className="flex gap-2">
                                    <button className="btn btn-primary btn-sm w-full" onClick={handleAddPageSubmit}>OK</button>
                                    <button className="btn btn-outline btn-sm" onClick={() => setCreatingInLessonId(null)}>✕</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                 {/* Inline Create Lesson Form */}
                 {creatingInChapterId === ch.id && (
                    <div style={{padding: '0.5rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem'}}>
                        <input autoFocus className="form-input" style={{padding: '0.3rem', fontSize: '0.85rem', marginBottom: '0.25rem'}} placeholder="Название урока" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
                        <div className="flex gap-2">
                            <button className="btn btn-primary btn-sm w-full" onClick={() => handleAddLessonSubmit(ch.id)}>Добавить урок</button>
                            <button className="btn btn-outline btn-sm" onClick={() => setCreatingInChapterId(null)}>✕</button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        ))}

        {/* Add Chapter Button */}
        {!isAddingChapter ? (
             <button className="btn btn-outline w-full mt-4" onClick={() => setIsAddingChapter(true)}>+ Новая глава</button>
        ) : (
            <div style={{padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginTop: '1rem'}}>
                <input autoFocus className="form-input" style={{marginBottom: '0.5rem'}} placeholder="Название главы" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
                <div className="flex gap-2">
                    <button className="btn btn-primary btn-sm flex-1" onClick={handleAddChapterSubmit}>Создать</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setIsAddingChapter(false)}>Otmena</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
