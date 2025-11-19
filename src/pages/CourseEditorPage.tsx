import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseApi } from '@/courses/api';
import { generateId } from '@/courses/storage';
import type { Course, LessonPage, PageKind, VersionSnapshot } from '@/courses/types';

import { CourseStructure } from '@/courses/components/CourseStructure';
import { PageEditor } from '@/courses/components/PageEditor';
import { CourseSettings } from '@/courses/components/CourseSettings';
import { CourseVersions } from '@/courses/components/CourseVersions';
import { CoursePreview } from '@/courses/components/CoursePreview';
import { Icons } from '@/components/Icons';

export default function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'content' | 'settings' | 'versions' | 'preview'>('content');
  const [toasts, setToasts] = useState<{id: string, msg: string, type: 'success'|'error'}[]>([]);

  const [selChapterId, setSelChapterId] = useState<string | null>(null);
  const [selLessonId, setSelLessonId] = useState<string | null>(null);
  const [selPageId, setSelPageId] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      courseApi.getCourse(courseId).then(setCourse).finally(() => setLoading(false));
    }
  }, [courseId]);

  const notify = (msg: string, type: 'success'|'error' = 'success') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleUpdateCourse = async (newCourse: Course) => {
    setCourse(newCourse);
    await courseApi.updateCourse(newCourse);
  };

  // Structure Handlers
  const handleAddChapter = (title: string) => {
    if (!course) return;
    const newCh = { id: generateId('ch'), title, lessons: [] };
    handleUpdateCourse({ ...course, chapters: [...course.chapters, newCh] });
    notify('Глава добавлена');
  };

  const handleAddLesson = (title: string) => {
    if (!course || !selChapterId) { notify('Выберите главу', 'error'); return; }
    const newLesson = { id: generateId('les'), title, pages: [] };
    const newChapters = course.chapters.map(ch =>
      ch.id === selChapterId ? { ...ch, lessons: [...ch.lessons, newLesson] } : ch
    );
    handleUpdateCourse({ ...course, chapters: newChapters });
    setSelLessonId(newLesson.id);
  };

  const handleAddPage = (title: string, kind: string) => {
    if (!course || !selChapterId || !selLessonId) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const base = { id: generateId('page'), title, kind: kind as PageKind };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let newPage: any = { ...base };

    if (kind === 'theory') newPage = { ...base, kind: 'theory', theory: { mode: 'text', text: '' } };
    else if (kind === 'quiz') newPage = { ...base, kind: 'quiz', quiz: { question: '', options: [] } };
    else if (kind === 'code') newPage = { ...base, kind: 'code', code: { description: '', language: 'javascript', testCases: [] } };
    else newPage = { ...base, kind: 'detailed', detailed: { description: '', answer: '', answerMode: 'exact' } };

    const newChapters = course.chapters.map(ch => {
        if (ch.id !== selChapterId) return ch;
        return { ...ch, lessons: ch.lessons.map(l => l.id === selLessonId ? { ...l, pages: [...l.pages, newPage] } : l) };
    });
    handleUpdateCourse({ ...course, chapters: newChapters });
    setSelPageId(newPage.id);
    notify('Страница создана');
  };

  const handleDeleteLesson = (id: string) => {
    if(!course || !selChapterId) return;
    const newChapters = course.chapters.map(ch => ch.id === selChapterId ? { ...ch, lessons: ch.lessons.filter(l => l.id !== id) } : ch);
    handleUpdateCourse({ ...course, chapters: newChapters });
    if(selLessonId === id) setSelLessonId(null);
  };

  const handleDeletePage = (id: string) => {
    if(!course || !selChapterId || !selLessonId) return;
    const newChapters = course.chapters.map(ch => {
      if (ch.id !== selChapterId) return ch;
      return { ...ch, lessons: ch.lessons.map(l => l.id === selLessonId ? { ...l, pages: l.pages.filter(p => p.id !== id) } : l) };
    });
    handleUpdateCourse({ ...course, chapters: newChapters });
    if(selPageId === id) setSelPageId(null);
  };

  const getSelectedPage = (): LessonPage | null => {
    if (!course || !selChapterId || !selLessonId || !selPageId) return null;
    return course.chapters.find(c => c.id === selChapterId)?.lessons.find(l => l.id === selLessonId)?.pages.find(p => p.id === selPageId) || null;
  };

  const handlePageUpdate = (updatedPage: LessonPage) => {
    if (!course) return;
    const newChapters = course.chapters.map(ch => ({
        ...ch,
        lessons: ch.lessons.map(l => ({ ...l, pages: l.pages.map(p => p.id === updatedPage.id ? updatedPage : p) }))
    }));
    setCourse({ ...course, chapters: newChapters });
  };

  // Save Version
  const handleSaveVersion = async (comment: string) => {
    if(!course) return;
    await courseApi.saveVersion(course.id, comment);
    const updated = await courseApi.getCourse(course.id);
    setCourse(updated);
    notify('Версия сохранена');
  };

  const handleRestoreVersion = async (v: VersionSnapshot) => {
    if(!course) return;
    const restored = await courseApi.restoreVersion(course.id, v.id);
    setCourse(restored);
    notify('Версия восстановлена');
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-[var(--text-tertiary)]">Загрузка...</div>;
  if (!course) return <div className="p-8 text-center">Курс не найден</div>;

  return (
    <div className="editor-shell">
      {/* Top Toolbar */}
      <div className="editor-toolbar">
          <div className="flex items-center gap-4">
              <button className="btn-icon" onClick={() => navigate('/courses')}>
                  <Icons.ChevronDown style={{transform: 'rotate(90deg)'}} width={20} height={20} />
              </button>
              <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{course.title}</span>
                  <span className={`badge ${course.status==='published' ? 'badge-published' : 'badge-draft'}`}>{course.status}</span>
              </div>
          </div>

          <div className="tabs">
              {['content', 'settings', 'versions', 'preview'].map(t => (
                  <div
                    key={t}
                    className={`tab-btn ${tab === t ? 'active' : ''}`}
                    onClick={() => setTab(t as any)}
                  >
                    {t === 'content' ? 'Контент' : t === 'settings' ? 'Настройки' : t === 'versions' ? 'Версии' : 'Предпросмотр'}
                  </div>
              ))}
          </div>

          <div style={{width: 32}}></div>
      </div>

      {/* Body */}
      <div className="editor-body">
          {tab === 'content' && (
              <>
                <CourseStructure
                    course={course}
                    selectedChapterId={selChapterId}
                    selectedLessonId={selLessonId}
                    selectedPageId={selPageId}
                    onSelectChapter={setSelChapterId}
                    onSelectLesson={setSelLessonId}
                    onSelectPage={setSelPageId}
                    onAddChapter={handleAddChapter}
                    onAddLesson={handleAddLesson}
                    onAddPage={handleAddPage}
                    onDeleteLesson={handleDeleteLesson}
                    onDeletePage={handleDeletePage}
                />
                <div className="content-area">
                    {getSelectedPage() ? (
                        <PageEditor
                            page={getSelectedPage()!}
                            onUpdate={handlePageUpdate}
                            onSave={() => { handleUpdateCourse(course); notify('Сохранено'); }}
                            notify={notify}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-[var(--text-tertiary)] flex-col gap-4">
                            <div style={{fontSize: 48, opacity: 0.2}}>✏️</div>
                            <div>Выберите страницу для редактирования</div>
                        </div>
                    )}
                </div>
              </>
          )}

          {tab === 'settings' && (
              <div className="content-area">
                 <div className="content-card">
                     <CourseSettings
                        course={course}
                        onUpdate={handleUpdateCourse}
                        onPublish={() => { handleUpdateCourse({...course, status: 'published'}); notify('Опубликовано!'); }}
                        onArchive={() => { handleUpdateCourse({...course, status: 'archived'}); notify('Архивировано'); }}
                        onDelete={() => {
                            if(confirm('Удалить курс?')) {
                                courseApi.deleteCourse(course.id);
                                navigate('/courses');
                            }
                        }}
                        notify={notify}
                     />
                 </div>
              </div>
          )}

          {tab === 'versions' && (
              <div className="content-area">
                  <div className="content-card">
                      <CourseVersions course={course} onSaveVersion={handleSaveVersion} onRestoreVersion={handleRestoreVersion} />
                  </div>
              </div>
          )}

          {tab === 'preview' && (
              <div className="content-area" style={{padding: 0, background: '#000'}}>
                  <CoursePreview course={course} />
              </div>
          )}
      </div>

      {/* Toasts */}
      <div className="toast-container">
          {toasts.map(t => (
              <div key={t.id} className="toast" style={{borderColor: t.type==='error' ? 'var(--danger)' : 'var(--border)'}}>
                  {t.type==='error' ? '⚠️' : '✅'} {t.msg}
              </div>
          ))}
      </div>
    </div>
  );
}
