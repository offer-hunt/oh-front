import { useState } from 'react';
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

  // Сортировка
  onMoveChapter: (idx: number, dir: -1 | 1) => void;
  onMoveLesson: (chIdx: number, lIdx: number, dir: -1 | 1) => void;
  onMovePage: (chIdx: number, lIdx: number, pIdx: number, dir: -1 | 1) => void;
}

// Тип модального окна
type ModalType = 'chapter' | 'lesson' | 'page' | 'editChapter' | null;

// Иконки для типов страниц
const PAGE_TYPES = [
  { value: 'theory', label: 'Теория', icon: '📄', description: 'Текст, Markdown или видео материалы' },
  { value: 'quiz', label: 'Тест', icon: '❓', description: 'Вопрос с вариантами ответов' },
  { value: 'code', label: 'Код', icon: '💻', description: 'Задание с проверкой кода' },
  { value: 'detailed', label: 'Развернутый ответ', icon: '✍️', description: 'Задание с текстовым ответом' },
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
      case 'chapter':
        onAddChapter(modalTitle.trim());
        break;
      case 'lesson':
        onAddLesson(modalTitle.trim());
        break;
      case 'page':
        onAddPage(modalTitle.trim(), pageType);
        break;
      case 'editChapter':
        if (editingChapter && onUpdateChapter) {
          onUpdateChapter(editingChapter.id, {
            title: modalTitle.trim(),
            description: modalDesc.trim()
          });
        }
        break;
    }
    closeModal();
  };

  const getModalConfig = () => {
    switch (modalType) {
      case 'chapter':
        return { title: 'Новая глава', placeholder: 'Название главы', showDesc: false };
      case 'lesson':
        return { title: 'Новый урок', placeholder: 'Название урока', showDesc: false };
      case 'page':
        return { title: 'Новая страница', placeholder: 'Название страницы', showDesc: false, showPageType: true };
      case 'editChapter':
        return { title: 'Редактировать главу', placeholder: 'Название главы', showDesc: true };
      default:
        return { title: '', placeholder: '', showDesc: false };
    }
  };

  const config = getModalConfig();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span>Структура курса</span>
        <button
          onClick={() => openModal('chapter')}
          className="btn-icon text-[var(--primary)] hover:bg-[var(--primary-soft)]"
          title="Добавить главу"
        >
          <Icons.Plus />
        </button>
      </div>

      <div className="sidebar-scroll">
        {course.chapters.length === 0 && (
          <div className="p-6 text-center">
            <div className="text-4xl mb-3 opacity-30">📚</div>
            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              Курс пока пустой. Добавьте первую главу, чтобы начать.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => openModal('chapter')}
            >
              + Добавить главу
            </button>
          </div>
        )}

        {course.chapters.map((ch, chIdx) => (
          <div key={ch.id} className="mb-2">
            <div
              className={`tree-item ${selectedChapterId === ch.id && !selectedLessonId ? 'active' : ''}`}
              onClick={() => onSelectChapter(ch.id)}
            >
              <span className="font-bold text-[10px] text-[var(--text-tertiary)] w-5 mr-1">CH{chIdx + 1}</span>
              <div className="flex-1 truncate">
                <div className="font-semibold">{ch.title}</div>
                {ch.description && (
                  <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5 opacity-70 truncate">{ch.description}</div>
                )}
              </div>
              <div className="actions">
                <button className="btn-icon w-5 h-5 hover:text-white" onClick={e => { e.stopPropagation(); onMoveChapter(chIdx, -1); }} title="Вверх">
                  <Icons.ArrowUp width={10} height={10}/>
                </button>
                <button className="btn-icon w-5 h-5 hover:text-white" onClick={e => { e.stopPropagation(); onMoveChapter(chIdx, 1); }} title="Вниз">
                  <Icons.ArrowDown width={10} height={10}/>
                </button>
                <button className="btn-icon w-5 h-5 hover:text-[var(--primary)]" onClick={e => { e.stopPropagation(); openModal('editChapter', ch); }} title="Редактировать">
                  <Icons.File width={12} height={12} />
                </button>
                <button className="btn-icon w-5 h-5 hover:text-[var(--primary)]" onClick={e => { e.stopPropagation(); onSelectChapter(ch.id); openModal('lesson'); }} title="Добавить урок">
                  <Icons.Plus width={14} height={14} />
                </button>
                {onDeleteChapter && (
                  <button className="btn-icon w-5 h-5 hover:text-[var(--danger)]" onClick={e => { e.stopPropagation(); onDeleteChapter(ch.id); }} title="Удалить">
                    <Icons.Trash width={12} height={12} />
                  </button>
                )}
              </div>
            </div>

            <div>
              {ch.lessons.map((l, lIdx) => (
                <div key={l.id}>
                  <div
                    className={`tree-item ${selectedLessonId === l.id && !selectedPageId ? 'active' : ''}`}
                    style={{paddingLeft: '1.5rem'}}
                    onClick={() => onSelectLesson(l.id)}
                  >
                    <Icons.Folder width={14} height={14} className="text-[var(--text-tertiary)] opacity-70" />
                    <span className="flex-1 truncate text-[0.85rem]">{lIdx+1}. {l.title}</span>
                    <div className="actions">
                      <button className="btn-icon w-5 h-5 hover:text-white" onClick={e => { e.stopPropagation(); onMoveLesson(chIdx, lIdx, -1); }}>
                        <Icons.ArrowUp width={10} height={10}/>
                      </button>
                      <button className="btn-icon w-5 h-5 hover:text-white" onClick={e => { e.stopPropagation(); onMoveLesson(chIdx, lIdx, 1); }}>
                        <Icons.ArrowDown width={10} height={10}/>
                      </button>
                      <button className="btn-icon w-5 h-5 hover:text-[var(--primary)]" onClick={e => { e.stopPropagation(); onSelectLesson(l.id); openModal('page'); }} title="Добавить страницу">
                        <Icons.Plus width={12} height={12} />
                      </button>
                      <button className="btn-icon w-5 h-5 hover:text-[var(--danger)]" onClick={e => { e.stopPropagation(); onDeleteLesson(l.id); }}>
                        <Icons.Trash width={12} height={12} />
                      </button>
                    </div>
                  </div>

                  {l.pages.map((p, pIdx) => {
                    const pageTypeInfo = PAGE_TYPES.find(t => t.value === p.kind);
                    return (
                      <div
                        key={p.id}
                        className={`tree-item ${selectedPageId === p.id ? 'active' : ''}`}
                        style={{paddingLeft: '2.5rem'}}
                        onClick={() => onSelectPage(p.id)}
                      >
                        <span className="text-[var(--text-tertiary)] opacity-70">{pageTypeInfo?.icon || '📄'}</span>
                        <span className="flex-1 truncate text-[0.85rem]">{p.title}</span>
                        <div className="actions">
                          <button className="btn-icon w-4 h-4 hover:text-white" onClick={e => { e.stopPropagation(); onMovePage(chIdx, lIdx, pIdx, -1); }}>
                            <Icons.ArrowUp width={9} height={9}/>
                          </button>
                          <button className="btn-icon w-4 h-4 hover:text-white" onClick={e => { e.stopPropagation(); onMovePage(chIdx, lIdx, pIdx, 1); }}>
                            <Icons.ArrowDown width={9} height={9}/>
                          </button>
                          <button className="btn-icon w-5 h-5 hover:text-[var(--danger)]" onClick={e => { e.stopPropagation(); onDeletePage(p.id); }}>
                            <Icons.Trash width={11} height={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {ch.lessons.length === 0 && (
                <div className="pl-6 py-3 text-xs text-[var(--text-tertiary)] italic">
                  Нет уроков. Нажмите + чтобы добавить.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="relative w-full max-w-md mx-4 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{config.title}</h3>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)] transition-colors"
                onClick={closeModal}
              >
                <Icons.Trash width={16} height={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="form-label text-sm font-semibold mb-2">Название</label>
                <input
                  autoFocus
                  className="form-input text-base"
                  placeholder={config.placeholder}
                  value={modalTitle}
                  onChange={e => setModalTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                />
              </div>

              {config.showDesc && (
                <div>
                  <label className="form-label text-sm font-semibold mb-2">Описание (опционально)</label>
                  <textarea
                    className="form-input text-base"
                    placeholder="Краткое описание главы..."
                    value={modalDesc}
                    onChange={e => setModalDesc(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {modalType === 'page' && (
                <div>
                  <label className="form-label text-sm font-semibold mb-3">Тип страницы</label>
                  <div className="grid grid-cols-2 gap-3">
                    {PAGE_TYPES.map(type => (
                      <button
                        key={type.value}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          pageType === type.value
                            ? 'border-[var(--primary)] bg-[var(--primary-soft)] shadow-md'
                            : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-input)]'
                        }`}
                        onClick={() => setPageType(type.value)}
                      >
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <div className="font-semibold text-sm text-[var(--text-primary)]">{type.label}</div>
                        <div className="text-xs text-[var(--text-tertiary)] mt-1">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-input)]/50 rounded-b-2xl">
              <button className="btn btn-ghost" onClick={closeModal}>
                Отмена
              </button>
              <button
                className="btn btn-primary px-6"
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
