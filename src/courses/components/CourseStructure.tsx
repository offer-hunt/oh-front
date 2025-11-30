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

  // Сортировка
  onMoveChapter: (idx: number, dir: -1 | 1) => void;
  onMoveLesson: (chIdx: number, lIdx: number, dir: -1 | 1) => void;
  onMovePage: (chIdx: number, lIdx: number, pIdx: number, dir: -1 | 1) => void;
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
  onMoveChapter,
  onMoveLesson,
  onMovePage
}: CourseStructureProps) {
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [creatingInLessonId, setCreatingInLessonId] = useState<string | null>(null);
  const [creatingInChapterId, setCreatingInChapterId] = useState<string | null>(null);
  const [pageType, setPageType] = useState('theory');

  const submit = (action: () => void) => {
      if(newItemTitle.trim()) { action(); setNewItemTitle(''); setIsAddingChapter(false); setCreatingInChapterId(null); setCreatingInLessonId(null); }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span>Структура</span>
        <button onClick={() => setIsAddingChapter(true)} className="btn-icon text-[var(--primary)] hover:bg-[var(--primary-soft)]"><Icons.Plus /></button>
      </div>

      <div className="sidebar-scroll">
        {isAddingChapter && (
           <div className="p-3 mb-2 bg-[var(--bg-input)] border border-[var(--border-focus)] rounded-lg">
              <input autoFocus className="form-input mb-2 py-1 text-sm" placeholder="Название главы" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} onKeyDown={e => e.key==='Enter' && submit(() => onAddChapter(newItemTitle))} />
              <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm flex-1" onClick={() => submit(() => onAddChapter(newItemTitle))}>OK</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setIsAddingChapter(false)}>✕</button>
              </div>
           </div>
        )}

        {course.chapters.map((ch, chIdx) => (
          <div key={ch.id} className="mb-2">
            <div className={`tree-item ${selectedChapterId === ch.id && !selectedLessonId ? 'active' : ''}`} onClick={() => onSelectChapter(ch.id)}>
               <span className="font-bold text-[10px] text-[var(--text-tertiary)] w-5 mr-1">CH{chIdx + 1}</span>
               <span className="flex-1 truncate font-semibold">{ch.title}</span>
               <div className="actions">
                   <button className="btn-icon w-5 h-5 hover:text-white" onClick={e => { e.stopPropagation(); onMoveChapter(chIdx, -1); }}><Icons.ArrowUp width={10} height={10}/></button>
                   <button className="btn-icon w-5 h-5 hover:text-white" onClick={e => { e.stopPropagation(); onMoveChapter(chIdx, 1); }}><Icons.ArrowDown width={10} height={10}/></button>
                   <button className="btn-icon w-5 h-5 hover:text-[var(--primary)]" onClick={e => { e.stopPropagation(); onSelectChapter(ch.id); setCreatingInChapterId(ch.id); }}><Icons.Plus width={14} height={14} /></button>
               </div>
            </div>

            {creatingInChapterId === ch.id && (
                <div className="pl-6 pr-2 py-2 bg-[var(--bg-input)] border-y border-[var(--border-subtle)]">
                     <input autoFocus className="form-input mb-2 py-1 text-sm" placeholder="Название урока" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} onKeyDown={e => e.key==='Enter' && submit(() => onAddLesson(newItemTitle))} />
                     <div className="flex gap-2"><button className="btn btn-primary btn-sm flex-1" onClick={() => submit(() => onAddLesson(newItemTitle))}>OK</button><button className="btn btn-outline btn-sm" onClick={() => setCreatingInChapterId(null)}>✕</button></div>
                </div>
            )}

            <div>
                {ch.lessons.map((l, lIdx) => (
                    <div key={l.id}>
                        <div className={`tree-item ${selectedLessonId === l.id && !selectedPageId ? 'active' : ''}`} style={{paddingLeft: '1.5rem'}} onClick={() => onSelectLesson(l.id)}>
                             <Icons.Folder width={14} height={14} className="text-[var(--text-tertiary)] opacity-70" />
                             <span className="flex-1 truncate text-[0.85rem]">{lIdx+1}. {l.title}</span>
                             <div className="actions">
                                 <button className="btn-icon w-5 h-5 hover:text-white" onClick={e => { e.stopPropagation(); onMoveLesson(chIdx, lIdx, -1); }}><Icons.ArrowUp width={10} height={10}/></button>
                                 <button className="btn-icon w-5 h-5 hover:text-white" onClick={e => { e.stopPropagation(); onMoveLesson(chIdx, lIdx, 1); }}><Icons.ArrowDown width={10} height={10}/></button>
                                 <button className="btn-icon w-5 h-5 hover:text-[var(--primary)]" onClick={e => { e.stopPropagation(); onSelectLesson(l.id); setCreatingInLessonId(l.id); }}><Icons.Plus width={12} height={12} /></button>
                                 <button className="btn-icon w-5 h-5 hover:text-[var(--danger)]" onClick={e => { e.stopPropagation(); onDeleteLesson(l.id); }}><Icons.Trash width={12} height={12} /></button>
                             </div>
                        </div>

                        {creatingInLessonId === l.id && (
                             <div className="ml-8 mr-2 p-2 my-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded relative z-10">
                                <input autoFocus className="form-input mb-2 py-1 text-sm" placeholder="Страница" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
                                <select className="form-input mb-2 py-1 text-sm" value={pageType} onChange={e => setPageType(e.target.value)}><option value="theory">Теория</option><option value="quiz">Тест</option><option value="code">Код</option><option value="detailed">Ответ</option></select>
                                <div className="flex gap-2"><button className="btn btn-primary btn-sm flex-1" onClick={() => submit(() => onAddPage(newItemTitle, pageType))}>Add</button><button className="btn btn-outline btn-sm" onClick={() => setCreatingInLessonId(null)}>✕</button></div>
                             </div>
                        )}

                        {l.pages.map((p, pIdx) => {
                            let icon = <Icons.File width={12} height={12} />;
                            if (p.kind === 'code') icon = <span className="font-mono text-[10px] font-bold">{'<>'}</span>;
                            if (p.kind === 'quiz') icon = <span className="font-bold text-[10px]">?</span>;

                            return (
                                <div key={p.id} className={`tree-item ${selectedPageId === p.id ? 'active' : ''}`} style={{paddingLeft: '2.5rem'}} onClick={() => onSelectPage(p.id)}>
                                    <span className="text-[var(--text-tertiary)] opacity-70">{icon}</span>
                                    <span className="flex-1 truncate text-[0.85rem]">{p.title}</span>
                                    <div className="actions">
                                        <button className="btn-icon w-4 h-4 hover:text-white" onClick={e => { e.stopPropagation(); onMovePage(chIdx, lIdx, pIdx, -1); }}><Icons.ArrowUp width={9} height={9}/></button>
                                        <button className="btn-icon w-4 h-4 hover:text-white" onClick={e => { e.stopPropagation(); onMovePage(chIdx, lIdx, pIdx, 1); }}><Icons.ArrowDown width={9} height={9}/></button>
                                        <button className="btn-icon w-5 h-5 hover:text-[var(--danger)]" onClick={e => { e.stopPropagation(); onDeletePage(p.id); }}><Icons.Trash width={11} height={11} /></button>
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
