import { useState } from 'react';
import type { Course } from '@/courses/types';
import { Icons } from '@/components/Icons';

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

  // Inline creation states
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
      <div className="sidebar-header flex justify-between items-center">
        <span>Содержание</span>
        <button onClick={() => setIsAddingChapter(true)} className="btn-icon" title="Добавить главу">
          <Icons.Plus />
        </button>
      </div>

      <div className="sidebar-scroll">
        {isAddingChapter && (
           <div className="p-2 mb-2 bg-[var(--bg-input)] border border-[var(--border)] rounded">
              <input
                autoFocus
                className="form-input mb-2 py-1"
                placeholder="Название главы"
                value={newItemTitle}
                onChange={e => setNewItemTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddChapterSubmit()}
              />
              <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm flex-1" onClick={handleAddChapterSubmit}>Создать</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setIsAddingChapter(false)}>Отмена</button>
              </div>
           </div>
        )}

        {course.chapters.length === 0 && !isAddingChapter && (
            <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
                Курс пуст
            </div>
        )}

        {course.chapters.map((ch, idx) => (
          <div key={ch.id} className="mb-2">
            {/* Chapter */}
            <div
                className={`tree-item ${selectedChapterId === ch.id && !selectedLessonId ? 'active' : ''}`}
                onClick={() => onSelectChapter(ch.id)}
            >
               <span className="text-[10px] font-bold text-[var(--text-tertiary)] w-6">CH {idx + 1}</span>
               <span className="font-semibold flex-1 truncate">{ch.title}</span>
               <div className="actions">
                   <button className="btn-icon w-5 h-5" onClick={(e) => { e.stopPropagation(); onSelectChapter(ch.id); setCreatingInChapterId(ch.id); }}>
                       <Icons.Plus width={14} height={14} />
                   </button>
               </div>
            </div>

            {creatingInChapterId === ch.id && (
                <div className="pl-6 pr-2 py-2">
                     <input autoFocus className="form-input mb-2 py-1 text-sm" placeholder="Название урока" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
                     <div className="flex gap-2">
                         <button className="btn btn-primary btn-sm flex-1" onClick={() => handleAddLessonSubmit(ch.id)}>OK</button>
                         <button className="btn btn-outline btn-sm" onClick={() => setCreatingInChapterId(null)}>✕</button>
                     </div>
                </div>
            )}

            {/* Lessons */}
            <div>
                {ch.lessons.map((l) => (
                    <div key={l.id}>
                        <div
                            className={`tree-item ${selectedLessonId === l.id && !selectedPageId ? 'active' : ''}`}
                            style={{paddingLeft: '1.5rem'}}
                            onClick={() => onSelectLesson(l.id)}
                        >
                             <Icons.Folder width={14} height={14} className="text-[var(--text-tertiary)] mr-2" />
                             <span className="flex-1 truncate">{l.title}</span>
                             <div className="actions">
                                 <button className="btn-icon w-5 h-5" title="Add Page" onClick={(e) => { e.stopPropagation(); onSelectLesson(l.id); setCreatingInLessonId(l.id); }}>
                                     <Icons.Plus width={12} height={12} />
                                 </button>
                                 <button className="btn-icon w-5 h-5 hover:text-[var(--danger)]" onClick={(e) => { e.stopPropagation(); onDeleteLesson(l.id); }}>
                                     <Icons.Trash width={12} height={12} />
                                 </button>
                             </div>
                        </div>

                        {creatingInLessonId === l.id && (
                             <div className="pl-8 pr-2 py-2 my-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded">
                                <input autoFocus className="form-input mb-2 py-1 text-sm" placeholder="Имя страницы" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
                                <select className="form-input mb-2 py-1 text-sm" value={pageType} onChange={e => setPageType(e.target.value)}>
                                    <option value="theory">Теория</option>
                                    <option value="quiz">Тест</option>
                                    <option value="code">Код</option>
                                    <option value="detailed">Ответ</option>
                                </select>
                                <div className="flex gap-2">
                                    <button className="btn btn-primary btn-sm flex-1" onClick={handleAddPageSubmit}>Add</button>
                                    <button className="btn btn-outline btn-sm" onClick={() => setCreatingInLessonId(null)}>✕</button>
                                </div>
                             </div>
                        )}

                        {/* Pages */}
                        {l.pages.map(p => {
                            let icon = <Icons.File width={13} height={13} />;
                            if (p.kind === 'code') icon = <span className="font-mono text-[10px] font-bold">{'<>'}</span>;
                            if (p.kind === 'quiz') icon = <span className="font-bold text-[10px]">?</span>;

                            return (
                                <div
                                    key={p.id}
                                    className={`tree-item ${selectedPageId === p.id ? 'active' : ''}`}
                                    style={{paddingLeft: '2.5rem', fontSize: '0.85rem'}}
                                    onClick={() => onSelectPage(p.id)}
                                >
                                    <span className="mr-2 text-[var(--text-tertiary)] w-4 flex justify-center">{icon}</span>
                                    <span className="flex-1 truncate">{p.title}</span>
                                    <div className="actions">
                                        <button className="btn-icon w-5 h-5 hover:text-[var(--danger)]" onClick={(e) => { e.stopPropagation(); onDeletePage(p.id); }}>
                                            <Icons.Trash width={11} height={11} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
