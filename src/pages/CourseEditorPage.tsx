import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseApi } from '@/courses/api';
import { generateId } from '@/courses/storage';
import type { Course, LessonPage, PageKind, VersionSnapshot } from '@/courses/types';

// Components
import { CourseStructure } from '@/courses/components/CourseStructure';
import { PageEditor } from '@/courses/components/PageEditor';
import { CourseSettings } from '@/courses/components/CourseSettings';
import { CourseVersions } from '@/courses/components/CourseVersions';
import { CoursePreview } from '@/courses/components/CoursePreview';

export default function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'content' | 'settings' | 'versions' | 'preview'>('content');
  const [toasts, setToasts] = useState<{id: string, msg: string, type: 'success'|'error'}[]>([]);

  // Selection State
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

  // --- STRUCTURE HANDLERS ---

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
    notify('Урок добавлен');
  };

  const handleDeleteLesson = (id: string) => {
    if (!course || !selChapterId) return;
    if(!confirm('Удалить урок?')) return;
    const newChapters = course.chapters.map(ch =>
        ch.id === selChapterId ? { ...ch, lessons: ch.lessons.filter(l => l.id !== id) } : ch
    );
    handleUpdateCourse({ ...course, chapters: newChapters });
    if (selLessonId === id) setSelLessonId(null);
  };

  const handleAddPage = (title: string, kind: string) => {
    if (!course || !selChapterId || !selLessonId) return;

    const base = { id: generateId('page'), title, kind: kind as PageKind };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let newPage: any;

    if (kind === 'theory') newPage = { ...base, kind: 'theory', theory: { mode: 'text', text: '', markdown: '', videoUrl: '' } };
    else if (kind === 'quiz') newPage = { ...base, kind: 'quiz', quiz: { question: '', options: [] } };
    else if (kind === 'code') newPage = { ...base, kind: 'code', code: { description: '', language: 'javascript', testCases: [] } };
    else newPage = { ...base, kind: 'detailed', detailed: { description: '', answer: '', answerMode: 'exact' } };

    const newChapters = course.chapters.map(ch => {
        if (ch.id !== selChapterId) return ch;
        return {
            ...ch,
            lessons: ch.lessons.map(l =>
                l.id === selLessonId ? { ...l, pages: [...l.pages, newPage] } : l
            )
        };
    });
    handleUpdateCourse({ ...course, chapters: newChapters });
    setSelPageId(newPage.id);
    notify('Страница создана');
  };

  const handleDeletePage = (id: string) => {
    if (!course || !selChapterId || !selLessonId) return;
    if(!confirm('Удалить страницу?')) return;
    const newChapters = course.chapters.map(ch => {
        if (ch.id !== selChapterId) return ch;
        return {
            ...ch,
            lessons: ch.lessons.map(l =>
                l.id === selLessonId ? { ...l, pages: l.pages.filter(p => p.id !== id) } : l
            )
        };
    });
    handleUpdateCourse({ ...course, chapters: newChapters });
    if (selPageId === id) setSelPageId(null);
  };

  // --- PAGE CONTENT HANDLER ---
  const getSelectedPage = (): LessonPage | null => {
    if (!course || !selChapterId || !selLessonId || !selPageId) return null;
    return course.chapters.find(c => c.id === selChapterId)
        ?.lessons.find(l => l.id === selLessonId)
        ?.pages.find(p => p.id === selPageId) || null;
  };

  const handlePageUpdate = (updatedPage: LessonPage) => {
    if (!course) return;
    const newChapters = course.chapters.map(ch => ({
        ...ch,
        lessons: ch.lessons.map(l => ({
            ...l,
            pages: l.pages.map(p => p.id === updatedPage.id ? updatedPage : p)
        }))
    }));
    setCourse({ ...course, chapters: newChapters }); // Optimistic UI
  };

  const handleSavePage = () => {
     if (course) {
         handleUpdateCourse(course);
         notify('Страница сохранена');
     }
  };

  // --- PUBLISH & ACTIONS ---
  const handlePublish = () => {
      if (!course) return;
      // Validation TS 11.2
      if (!course.cover) { notify('Добавьте обложку в настройках', 'error'); return; }
      if (!course.title || course.title.length < 10) { notify('Название слишком короткое', 'error'); return; }
      let hasLessons = false;
      course.chapters.forEach(c => { if(c.lessons.length > 0) hasLessons = true; });
      if (!hasLessons) { notify('Добавьте хотя бы один урок', 'error'); return; }

      handleUpdateCourse({ ...course, status: 'published' });
      notify('Курс успешно опубликован!', 'success');
  };

  const handleArchive = () => {
      if (!course) return;
      handleUpdateCourse({ ...course, status: 'archived' });
      notify('Курс архивирован');
  };

  const handleDelete = async () => {
      if (!course) return;
      if (confirm('Вы уверены? Это действие нельзя отменить.')) {
          await courseApi.deleteCourse(course.id);
          navigate('/courses');
      }
  };

  const handleSaveVersion = async (comment: string) => {
      if (!course) return;
      try {
        await courseApi.saveVersion(course.id, comment);
        const updated = await courseApi.getCourse(course.id);
        setCourse(updated);
        notify('Версия сохранена', 'success');
      } catch (e) { notify('Ошибка сохранения версии', 'error'); }
  };

  const handleRestoreVersion = async (v: VersionSnapshot) => {
      if (!course) return;
      try {
        const restored = await courseApi.restoreVersion(course.id, v.id);
        setCourse(restored);
        notify('Версия восстановлена', 'success');
      } catch (e) { notify('Ошибка восстановления', 'error'); }
  };


  if (loading) return <div className="container flex items-center justify-center h-screen">Загрузка...</div>;
  if (!course) return <div className="container">Курс не найден</div>;

  const selectedPage = getSelectedPage();

  return (
    <div className="container h-screen flex flex-col">
      {/* Toasts */}
      <div className="toast-container">
          {toasts.map(t => (
              <div key={t.id} className={`toast ${t.type === 'error' ? 'toast--error' : ''}`}>
                  {t.type === 'error' ? '⚠️' : '✅'} {t.msg}
              </div>
          ))}
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
         <div className="flex items-center gap-4">
             <button className="btn btn-outline btn-sm" onClick={() => navigate('/courses')}>← Назад</button>
             <div className="flex items-baseline gap-2">
                <h1 className="text-lg font-bold">{course.title}</h1>
                <span className={`badge ${course.status === 'published' ? 'badge-published' : 'badge-draft'}`}>{course.status}</span>
             </div>
         </div>

         <div className="tabs mb-0">
            <button className={`tab ${tab === 'content' ? 'active' : ''}`} onClick={() => setTab('content')}>Контент</button>
            <button className={`tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>Настройки</button>
            <button className={`tab ${tab === 'versions' ? 'active' : ''}`} onClick={() => setTab('versions')}>Версии</button>
            <button className={`tab ${tab === 'preview' ? 'active' : ''}`} onClick={() => setTab('preview')}>Предпросмотр</button>
         </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 min-h-0">
        {tab === 'content' && (
            <div className="editor-layout">
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
                <div className="h-full">
                    {selectedPage ? (
                        <PageEditor
                            page={selectedPage}
                            onUpdate={handlePageUpdate}
                            onSave={handleSavePage}
                            notify={notify}
                        />
                    ) : (
                        <div className="page-content flex items-center justify-center text-[var(--text-tertiary)]">
                            <div className="text-center">
                                <div className="text-4xl mb-2">👈</div>
                                <div>Выберите страницу слева<br/>или создайте новую структуру</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {tab === 'settings' && (
            <CourseSettings
                course={course}
                onUpdate={handleUpdateCourse}
                onPublish={handlePublish}
                onArchive={handleArchive}
                onDelete={handleDelete}
                notify={notify}
            />
        )}

        {tab === 'versions' && (
            <CourseVersions
                course={course}
                onSaveVersion={handleSaveVersion}
                onRestoreVersion={handleRestoreVersion}
            />
        )}

        {tab === 'preview' && (
            <CoursePreview course={course} />
        )}
      </div>
    </div>
  );
}
