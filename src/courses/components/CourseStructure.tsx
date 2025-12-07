import { useState, useRef } from 'react';
import type { Course, Chapter } from '@/courses/types';
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
  onUpdateChapter?: (chapterId: string, updates: Partial<Chapter>) => void;
  onDeleteChapter?: (chapterId: string) => void;
  onMoveChapter: (idx: number, dir: -1 | 1) => void;
  onMoveLesson: (chIdx: number, lIdx: number, dir: -1 | 1) => void;
  onMovePage: (chIdx: number, lIdx: number, pIdx: number, dir: -1 | 1) => void;
}

type ModalType = 'chapter' | 'lesson' | 'page' | 'editChapter' | null;

type DragItem = {
  type: 'chapter' | 'lesson' | 'page';
  chapterIdx: number;
  lessonIdx?: number;
  pageIdx?: number;
};

const PAGE_TYPES = [
  { value: 'theory', label: 'Теория', icon: '📄', color: '#6366f1', description: 'Текст, Markdown или видео' },
  { value: 'quiz', label: 'Тест', icon: '❓', color: '#f59e0b', description: 'Вопрос с вариантами ответа' },
  { value: 'code', label: 'Код', icon: '💻', color: '#10b981', description: 'Задание на программирование' },
  { value: 'detailed', label: 'Развёрнутый', icon: '✍️', color: '#8b5cf6', description: 'Развёрнутый текстовый ответ' },
];

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
  onUpdateChapter,
  onDeleteChapter,
  onMoveChapter,
  onMoveLesson,
  onMovePage
}: CourseStructureProps) {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [pageType, setPageType] = useState('theory');
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // Drag and drop state
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<DragItem | null>(null);
  const dragNodeRef = useRef<HTMLElement | null>(null);

  const toggleChapter = (chapterId: string, forceExpand?: boolean) => {
    const next = new Set(expandedChapters);
    if (forceExpand) {
      next.add(chapterId);
    } else if (next.has(chapterId)) {
      next.delete(chapterId);
    } else {
      next.add(chapterId);
    }
    setExpandedChapters(next);
  };

  const openModal = (type: ModalType, chapter?: Chapter) => {
    setModalType(type);
    setModalTitle('');
    setModalDesc('');
    setPageType('theory');
    if (chapter) {
      setEditingChapter(chapter);
      setModalTitle(chapter.title);
      setModalDesc(chapter.description || '');
    }
  };

  const closeModal = () => {
    setModalType(null);
    setModalTitle('');
    setModalDesc('');
    setEditingChapter(null);
  };

  const handleSubmit = () => {
    if (!modalTitle.trim() && modalType !== 'editChapter') return;
    switch (modalType) {
      case 'chapter': onAddChapter(modalTitle.trim()); break;
      case 'lesson': onAddLesson(modalTitle.trim()); break;
      case 'page': onAddPage(modalTitle.trim(), pageType); break;
      case 'editChapter':
        if (editingChapter && onUpdateChapter) {
          onUpdateChapter(editingChapter.id, { title: modalTitle.trim(), description: modalDesc.trim() });
        }
        break;
    }
    closeModal();
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, item: DragItem, node: HTMLElement) => {
    setDragItem(item);
    dragNodeRef.current = node;

    // Set drag image
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for Firefox

    // Add dragging class after a small delay to not affect the drag image
    setTimeout(() => {
      node.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.classList.remove('opacity-50');
    }
    setDragItem(null);
    setDragOverItem(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, item: DragItem) => {
    e.preventDefault();
    if (!dragItem) return;

    // Only allow same type drag
    if (dragItem.type !== item.type) return;

    // For lessons, must be in same chapter
    if (dragItem.type === 'lesson' && dragItem.chapterIdx !== item.chapterIdx) return;

    // For pages, must be in same lesson
    if (dragItem.type === 'page' &&
        (dragItem.chapterIdx !== item.chapterIdx || dragItem.lessonIdx !== item.lessonIdx)) return;

    setDragOverItem(item);
  };

  const handleDrop = (e: React.DragEvent, targetItem: DragItem) => {
    e.preventDefault();
    if (!dragItem || !targetItem) return;
    if (dragItem.type !== targetItem.type) return;

    const fromIdx = dragItem.type === 'chapter' ? dragItem.chapterIdx :
                    dragItem.type === 'lesson' ? dragItem.lessonIdx! :
                    dragItem.pageIdx!;

    const toIdx = targetItem.type === 'chapter' ? targetItem.chapterIdx :
                  targetItem.type === 'lesson' ? targetItem.lessonIdx! :
                  targetItem.pageIdx!;

    if (fromIdx === toIdx) return;

    // Move items one step at a time to reach target
    const dir = fromIdx < toIdx ? 1 : -1;
    let currentIdx = fromIdx;

    while (currentIdx !== toIdx) {
      if (dragItem.type === 'chapter') {
        onMoveChapter(currentIdx, dir);
      } else if (dragItem.type === 'lesson') {
        onMoveLesson(dragItem.chapterIdx, currentIdx, dir);
      } else {
        onMovePage(dragItem.chapterIdx, dragItem.lessonIdx!, currentIdx, dir);
      }
      currentIdx += dir;
    }

    handleDragEnd();
  };

  const isDragOver = (item: DragItem) => {
    if (!dragOverItem || !dragItem) return false;
    if (dragItem.type !== item.type) return false;

    if (item.type === 'chapter') {
      return dragOverItem.chapterIdx === item.chapterIdx;
    }
    if (item.type === 'lesson') {
      return dragOverItem.chapterIdx === item.chapterIdx &&
             dragOverItem.lessonIdx === item.lessonIdx;
    }
    return dragOverItem.chapterIdx === item.chapterIdx &&
           dragOverItem.lessonIdx === item.lessonIdx &&
           dragOverItem.pageIdx === item.pageIdx;
  };

  const getModalConfig = () => {
    switch (modalType) {
      case 'chapter': return { title: 'Новая глава', subtitle: 'Глава объединяет связанные уроки', placeholder: 'Название главы', icon: '📖', color: '#6366f1', showDesc: false };
      case 'lesson': return { title: 'Новый урок', subtitle: 'Урок содержит страницы с контентом', placeholder: 'Название урока', icon: '📁', color: '#10b981', showDesc: false };
      case 'page': return { title: 'Новая страница', subtitle: 'Выберите тип и название', placeholder: 'Название страницы', icon: '📄', color: '#f59e0b', showDesc: false };
      case 'editChapter': return { title: 'Редактировать главу', subtitle: 'Измените название или описание', placeholder: 'Название главы', icon: '✏️', color: '#8b5cf6', showDesc: true };
      default: return { title: '', subtitle: '', placeholder: '', icon: '', color: '', showDesc: false };
    }
  };

  const config = getModalConfig();
  const totalLessons = course.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
  const totalPages = course.chapters.reduce((acc, ch) => acc + ch.lessons.reduce((sum, l) => sum + l.pages.length, 0), 0);

  return (
    <div className="sidebar flex flex-col" style={{ width: 320 }}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Структура</h2>
          <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
            <span>{course.chapters.length} гл</span>
            <span>{totalLessons} ур</span>
            <span>{totalPages} стр</span>
          </div>
        </div>
        <button
          onClick={() => openModal('chapter')}
          className="w-full h-10 rounded-lg flex items-center justify-center gap-2 bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all font-medium text-sm"
        >
          <Icons.Plus width={18} height={18} />
          Добавить главу
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {course.chapters.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--primary-soft)] flex items-center justify-center">
              <span className="text-3xl">📚</span>
            </div>
            <p className="text-sm text-[var(--text-tertiary)]">Добавьте первую главу</p>
          </div>
        ) : (
          <div className="space-y-2">
            {course.chapters.map((ch, chIdx) => {
              const isExpanded = expandedChapters.has(ch.id);
              const isChapterSelected = selectedChapterId === ch.id && !selectedLessonId;
              const chapterDragItem: DragItem = { type: 'chapter', chapterIdx: chIdx };

              const handleChapterClick = (e: React.MouseEvent) => {
                // Don't trigger on drag
                if (dragItem) return;
                onSelectChapter(ch.id);
                toggleChapter(ch.id, true); // Force expand on select
              };

              return (
                <div key={ch.id}>
                  {/* Chapter row */}
                  <div
                    draggable
                    onDragStart={e => handleDragStart(e, chapterDragItem, e.currentTarget)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => handleDragOver(e, chapterDragItem)}
                    onDrop={e => handleDrop(e, chapterDragItem)}
                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-grab active:cursor-grabbing transition-all ${
                      isChapterSelected ? 'bg-[var(--primary-soft)]' : 'hover:bg-[var(--bg-input)]'
                    } ${isDragOver(chapterDragItem) ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg-sidebar)]' : ''}`}
                    onClick={handleChapterClick}
                  >
                    {/* Drag handle */}
                    <div className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-tertiary)] opacity-40 group-hover:opacity-100 transition-opacity">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="9" cy="6" r="2"/><circle cx="15" cy="6" r="2"/>
                        <circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/>
                        <circle cx="9" cy="18" r="2"/><circle cx="15" cy="18" r="2"/>
                      </svg>
                    </div>

                    {/* Expand */}
                    <button
                      className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-[var(--bg-surface)] transition-colors"
                      onClick={e => { e.stopPropagation(); toggleChapter(ch.id); }}
                    >
                      <Icons.ChevronRight
                        width={14} height={14}
                        className="text-[var(--text-tertiary)]"
                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}
                      />
                    </button>

                    {/* Number */}
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isChapterSelected ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-tertiary)]'
                    }`}>
                      {chIdx + 1}
                    </span>

                    {/* Title */}
                    <span className="flex-1 text-sm font-medium text-[var(--text-primary)] truncate">{ch.title}</span>

                    {/* Lesson count */}
                    <span className="text-xs text-[var(--text-tertiary)] mr-1">{ch.lessons.length}</span>

                    {/* Hover actions */}
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      {onDeleteChapter && (
                        <button
                          className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                          onClick={e => { e.stopPropagation(); onDeleteChapter(ch.id); }}
                          title="Удалить"
                        >
                          <Icons.Trash width={12} height={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="ml-5 pl-4 border-l border-[var(--border-subtle)] mt-1 space-y-1">
                      {/* Lessons */}
                      {ch.lessons.map((l, lIdx) => {
                        const isLessonSelected = selectedLessonId === l.id && !selectedPageId;
                        const isLessonActive = selectedLessonId === l.id;
                        const lessonDragItem: DragItem = { type: 'lesson', chapterIdx: chIdx, lessonIdx: lIdx };

                        return (
                          <div key={l.id}>
                            {/* Lesson row */}
                            <div
                              draggable
                              onDragStart={e => handleDragStart(e, lessonDragItem, e.currentTarget)}
                              onDragEnd={handleDragEnd}
                              onDragOver={e => handleDragOver(e, lessonDragItem)}
                              onDrop={e => handleDrop(e, lessonDragItem)}
                              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all ${
                                isLessonSelected ? 'bg-emerald-500/15' : 'hover:bg-[var(--bg-input)]'
                              } ${isDragOver(lessonDragItem) ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[var(--bg-sidebar)]' : ''}`}
                              onClick={() => onSelectLesson(l.id)}
                            >
                              {/* Drag handle */}
                              <div className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-tertiary)] opacity-40 group-hover:opacity-100 transition-opacity">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                  <circle cx="9" cy="6" r="2"/><circle cx="15" cy="6" r="2"/>
                                  <circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/>
                                  <circle cx="9" cy="18" r="2"/><circle cx="15" cy="18" r="2"/>
                                </svg>
                              </div>

                              <Icons.Folder
                                width={14} height={14}
                                className={isLessonSelected ? 'text-emerald-400' : 'text-[var(--text-tertiary)]'}
                              />
                              <span className={`flex-1 text-sm truncate ${isLessonSelected ? 'text-emerald-400 font-medium' : 'text-[var(--text-primary)]'}`}>
                                {l.title}
                              </span>
                              <span className="text-xs text-[var(--text-tertiary)]">{l.pages.length}</span>

                              {/* Hover actions */}
                              <div className="hidden group-hover:flex items-center gap-0.5">
                                <button
                                  className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                                  onClick={e => { e.stopPropagation(); onDeleteLesson(l.id); }}
                                >
                                  <Icons.Trash width={10} height={10} />
                                </button>
                              </div>
                            </div>

                            {/* Pages (when lesson is active) */}
                            {isLessonActive && l.pages.length > 0 && (
                              <div className="ml-4 pl-3 border-l border-[var(--border-subtle)] mt-1 space-y-0.5">
                                {l.pages.map((p, pIdx) => {
                                  const pageTypeInfo = PAGE_TYPES.find(t => t.value === p.kind);
                                  const isPageSelected = selectedPageId === p.id;
                                  const pageDragItem: DragItem = { type: 'page', chapterIdx: chIdx, lessonIdx: lIdx, pageIdx: pIdx };

                                  return (
                                    <div
                                      key={p.id}
                                      draggable
                                      onDragStart={e => handleDragStart(e, pageDragItem, e.currentTarget)}
                                      onDragEnd={handleDragEnd}
                                      onDragOver={e => handleDragOver(e, pageDragItem)}
                                      onDrop={e => handleDrop(e, pageDragItem)}
                                      className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-all ${
                                        isPageSelected
                                          ? 'bg-[var(--primary)] text-white'
                                          : 'hover:bg-[var(--bg-input)] text-[var(--text-secondary)]'
                                      } ${isDragOver(pageDragItem) ? 'ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-[var(--bg-sidebar)]' : ''}`}
                                      onClick={() => onSelectPage(p.id)}
                                    >
                                      {/* Drag handle */}
                                      <div className={`w-4 h-4 rounded flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity ${
                                        isPageSelected ? 'text-white/70' : 'text-[var(--text-tertiary)]'
                                      }`}>
                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                                          <circle cx="9" cy="6" r="2"/><circle cx="15" cy="6" r="2"/>
                                          <circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/>
                                          <circle cx="9" cy="18" r="2"/><circle cx="15" cy="18" r="2"/>
                                        </svg>
                                      </div>

                                      <span className="text-sm">{pageTypeInfo?.icon || '📄'}</span>
                                      <span className="flex-1 text-xs truncate">{p.title}</span>

                                      {/* Hover actions */}
                                      <div className="hidden group-hover:flex items-center">
                                        <button
                                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                            isPageSelected ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]'
                                          }`}
                                          onClick={e => { e.stopPropagation(); onDeletePage(p.id); }}
                                        >
                                          <Icons.Trash width={10} height={10} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Add page button (when lesson is active) */}
                            {isLessonActive && (
                              <button
                                className="ml-4 mt-1 flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors"
                                onClick={() => openModal('page')}
                              >
                                <Icons.Plus width={12} height={12} />
                                Добавить страницу
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Add lesson button */}
                      <button
                        className="flex items-center gap-1.5 px-3 py-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors"
                        onClick={() => { onSelectChapter(ch.id); openModal('lesson'); }}
                      >
                        <Icons.Plus width={12} height={12} />
                        Добавить урок
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeModal}>
          <div
            className="relative w-full max-w-md bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-strong)] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--border-subtle)]" style={{ background: `linear-gradient(135deg, ${config.color}10, transparent)` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${config.color}20` }}>
                    {config.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">{config.title}</h3>
                    <p className="text-xs text-[var(--text-tertiary)]">{config.subtitle}</p>
                  </div>
                </div>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)] transition-all"
                  onClick={closeModal}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] mb-2 block uppercase tracking-wider">Название</label>
                <input
                  autoFocus
                  className="form-input"
                  placeholder={config.placeholder}
                  value={modalTitle}
                  onChange={e => setModalTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                />
              </div>

              {config.showDesc && (
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] mb-2 block uppercase tracking-wider">
                    Описание <span className="text-[var(--text-tertiary)] font-normal normal-case">(опционально)</span>
                  </label>
                  <textarea
                    className="form-input"
                    placeholder="Краткое описание..."
                    value={modalDesc}
                    onChange={e => setModalDesc(e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              {modalType === 'page' && (
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] mb-3 block uppercase tracking-wider">Тип страницы</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAGE_TYPES.map(type => (
                      <button
                        key={type.value}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          pageType === type.value ? 'shadow-md' : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                        }`}
                        style={{
                          borderColor: pageType === type.value ? type.color : undefined,
                          background: pageType === type.value ? `${type.color}10` : undefined,
                        }}
                        onClick={() => setPageType(type.value)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{type.icon}</span>
                          <span className="font-semibold text-sm" style={{ color: pageType === type.value ? type.color : 'var(--text-primary)' }}>
                            {type.label}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] leading-tight">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-input)]/30">
              <button className="btn btn-ghost" onClick={closeModal}>Отмена</button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!modalTitle.trim() && modalType !== 'editChapter'}
              >
                {modalType === 'editChapter' ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
