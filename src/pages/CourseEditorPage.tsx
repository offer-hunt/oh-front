import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';
import { courseApi } from '@/courses/api';
import {
  generateCodeTaskWithAi,
  generateTestQuestionsWithAi,
  enhanceTextWithAi,
  type GeneratedCodeTask,
  type GeneratedTestQuestion,
} from '@/courses/ai';
import { logCourseEvent } from '@/courses/logger';
import {
  TAG_MAX_COUNT,
  validateCourseDescription,
  validateCourseTitle,
  validateTags,
  validateTagValue,
} from '@/courses/validation';
import type {
  Chapter,
  CodePage,
  CodeTestCase,
  Course,
  DetailedAnswerMode,
  DetailedPage,
  Lesson,
  LessonPage,
  PageKind,
  QuizOption,
  QuizPage,
  SupportedLanguage,
  TheoryPage,
  VersionSnapshot,
} from '@/courses/types';
import { generateId } from '@/courses/storage';

type TabId = 'structure' | 'versions' | 'settings' | 'preview';

interface TagEditState {
  tagInput: string;
  error: string | null;
}

const ATTACH_MAX_BYTES = 5 * 1024 * 1024; // 5MB условный лимит для материалов

function findLessonAndPage(
  course: Course | null,
  lessonId: string | null,
  pageId: string | null,
): { lesson: Lesson | null; page: LessonPage | null } {
  if (!course || !lessonId || !pageId) {
    return { lesson: null, page: null };
  }
  for (const chapter of course.chapters) {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      const page = lesson.pages.find((p) => p.id === pageId) ?? null;
      return { lesson, page };
    }
  }
  return { lesson: null, page: null };
}

function getCourseTextContext(course: Course): string {
  const pieces: string[] = [];
  course.chapters.forEach((ch) => {
    pieces.push(ch.title);
    ch.lessons.forEach((l) => {
      pieces.push(l.title);
      l.pages.forEach((p) => {
        if (p.kind === 'theory') {
          if (p.theory.text) pieces.push(p.theory.text);
          if (p.theory.markdown) pieces.push(p.theory.markdown);
        }
      });
    });
  });
  return pieces.join('\n\n').slice(0, 5000);
}

function formatStatus(status: Course['status']): string {
  switch (status) {
    case 'draft':
      return 'Черновик';
    case 'published':
      return 'Опубликован';
    case 'archived':
      return 'Архивирован';
    default:
      return status;
  }
}

export default function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>('structure');

  // Метаданные
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  // Теги
  const [tagState, setTagState] = useState<TagEditState>({
    tagInput: '',
    error: null,
  });

  // Выбор для редактирования
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // Новые сущности
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterError, setNewChapterError] = useState<string | null>(null);

  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonError, setNewLessonError] = useState<string | null>(null);

  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageType, setNewPageType] = useState<PageKind>('theory');
  const [newPageError, setNewPageError] = useState<string | null>(null);

  // Контент редактора страниц
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<string | null>(null);

  // Версии
  const [versionComment, setVersionComment] = useState('');
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [versionsInfo, setVersionsInfo] = useState<string | null>(null);

  // Соавторы
  const [collabEmail, setCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState<'author' | 'moderator'>('author');
  const [collabError, setCollabError] = useState<string | null>(null);
  const [collabInfo, setCollabInfo] = useState<string | null>(null);

  // Публикация
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishInfo, setPublishInfo] = useState<string | null>(null);

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);

  // AI генерация теста / кода
  const [aiTestParams, setAiTestParams] = useState({
    theme: '',
    type: 'single' as 'single' | 'multiple' | 'boolean',
    count: 3,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<
    GeneratedTestQuestion[]
  >([]);

  const [aiCodeParams, setAiCodeParams] = useState<{
    theme: string;
    language: SupportedLanguage;
    difficulty: 'easy' | 'medium' | 'hard';
    requirements: string;
  }>({
    theme: '',
    language: 'javascript',
    difficulty: 'medium',
    requirements: '',
  });
  const [aiGeneratedCodeTask, setAiGeneratedCodeTask] =
    useState<GeneratedCodeTask | null>(null);

useEffect(() => {
  if (!courseId) {
    setLoadError('Некорректный адрес: не передан id курса');
    setIsLoading(false);
    return;
  }

  let isMounted = true;

  async function load(id: string) {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await courseApi.getCourse(id);
      if (isMounted) {
        setCourse(data);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      if (isMounted) {
        setLoadError('Не удалось загрузить курс.');
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  load(courseId);

  return () => {
    isMounted = false;
  };
}, [courseId]);



  const selectedChapter: Chapter | null = useMemo(() => {
    if (!course || !selectedChapterId) return null;
    return course.chapters.find((c) => c.id === selectedChapterId) ?? null;
  }, [course, selectedChapterId]);

  const selectedLesson: Lesson | null = useMemo(() => {
    if (!course || !selectedChapter || !selectedLessonId) return null;
    return (
      selectedChapter.lessons.find((l) => l.id === selectedLessonId) ?? null
    );
  }, [course, selectedChapter, selectedLessonId]);

  const selectedPage: LessonPage | null = useMemo(() => {
    const { page } = findLessonAndPage(course, selectedLessonId, selectedPageId);
    return page;
  }, [course, selectedLessonId, selectedPageId]);

  const handleUpdateCourseMeta = async (e: FormEvent) => {
    e.preventDefault();
    if (!course) return;

    const tErr = validateCourseTitle(course.title);
    const dErr = validateCourseDescription(course.description);
    setTitleError(tErr);
    setDescriptionError(dErr);

    if (tErr || dErr) return;

    try {
      const updated = await courseApi.updateCourse(course);
      setCourse(updated);
    } catch {
      setPublishError('Не удалось сохранить данные курса. Попробуйте позже.');
    }
  };

  const handleTitleChange = (value: string) => {
    if (!course) return;
    setCourse({ ...course, title: value });
    if (titleError) setTitleError(null);
  };

  const handleDescriptionChange = (value: string) => {
    if (!course) return;
    setCourse({ ...course, description: value });
    if (descriptionError) setDescriptionError(null);
  };

  const handleDurationChange = (value: string) => {
    if (!course) return;
    setCourse({ ...course, duration: value });
  };

  // --- Теги ---

  const handleAddTag = () => {
    if (!course) return;
    const value = tagState.tagInput.trim();
    if (!value) return;

    const err = validateTagValue(value);
    if (err) {
      setTagState((s) => ({ ...s, error: err }));
      return;
    }

    if (course.tags.length >= TAG_MAX_COUNT) {
      setTagState((s) => ({
        ...s,
        error: 'Количество тегов слишком большое',
      }));
      return;
    }

    if (course.tags.includes(value)) {
      setTagState((s) => ({ ...s, tagInput: '' }));
      return;
    }

    const updated = { ...course, tags: [...course.tags, value] };
    setCourse(updated);
    setTagState({ tagInput: '', error: null });
  };

  const handleRemoveTag = (tag: string) => {
    if (!course) return;
    const updated = { ...course, tags: course.tags.filter((t) => t !== tag) };
    setCourse(updated);
  };

  const handleSaveTags = async () => {
    if (!course) return;

    const err = validateTags(course.tags);
    if (err) {
      setTagState((s) => ({ ...s, error: err }));
      logCourseEvent('Tags add failed – server error', { reason: err });
      return;
    }

    if (course.tags.length === 0) {
      setTagState((s) => ({
        ...s,
        error: 'Количество тегов слишком маленькое, добавьте хотя бы один тег',
      }));
      logCourseEvent('Tags delete failed – server error', {
        reason: 'no-tags',
      });
      return;
    }

    try {
      const beforeCount = course.tags.length;
      const updated = await courseApi.updateCourse(course);
      setCourse(updated);
      const afterCount = updated.tags.length;

      if (afterCount > beforeCount) {
        logCourseEvent('Tags added', { courseId: updated.id });
      } else if (afterCount < beforeCount) {
        logCourseEvent('Tags deleted', { courseId: updated.id });
      }
      setTagState((s) => ({
        ...s,
        error: null,
      }));
    } catch (err) {
      setTagState((s) => ({
        ...s,
        error: 'Не удалось добавить теги. Попробуйте позже.',
      }));
      logCourseEvent('Tags add failed – server error', err);
    }
  };

  // --- Структура: главы, уроки, страницы ---

  const handleAddChapter = async () => {
    if (!course) return;

    if (!newChapterTitle.trim()) {
      setNewChapterError('Название главы не может быть пустым');
      logCourseEvent('Chapter add failed – empty title', { courseId: course.id });
      return;
    }

    const chapter: Chapter = {
      id: generateId('ch'),
      title: newChapterTitle.trim(),
      description: '',
      lessons: [],
    };

    const updated: Course = {
      ...course,
      chapters: [...course.chapters, chapter],
    };

    setCourse(updated);
    setNewChapterTitle('');
    setNewChapterError(null);

    try {
      const saved = await courseApi.updateCourse(updated);
      setCourse(saved);
      logCourseEvent('Chapter added', {
        courseId: saved.id,
        chapterId: chapter.id,
      });
      setSelectedChapterId(chapter.id);
      setSelectedLessonId(null);
      setSelectedPageId(null);
    } catch (err) {
      setNewChapterError('Не удалось сохранить главу. Попробуйте позже.');
      logCourseEvent('Chapter add failed – server error', err);
    }
  };

  const handleChapterTitleChange = (chapterId: string, value: string) => {
    if (!course) return;
    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === chapterId ? { ...ch, title: value } : ch,
      ),
    };
    setCourse(updated);
  };

  const handleChapterDescriptionChange = (chapterId: string, value: string) => {
    if (!course) return;
    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === chapterId ? { ...ch, description: value } : ch,
      ),
    };
    setCourse(updated);
  };

  const handleSaveChapter = async (chapterId: string) => {
    if (!course) return;
    const chapter = course.chapters.find((ch) => ch.id === chapterId);
    if (!chapter) return;

    if (!chapter.title.trim()) {
      setNewChapterError('Название главы не может быть пустым');
      logCourseEvent('Chapter add failed – empty title', {
        courseId: course.id,
      });
      return;
    }

    try {
      const saved = await courseApi.updateCourse(course);
      setCourse(saved);
      setNewChapterError(null);
    } catch (err) {
      setNewChapterError('Не удалось сохранить главу. Попробуйте позже.');
      logCourseEvent('Chapter add failed – server error', err);
    }
  };

  const handleAddLesson = async () => {
    if (!course || !selectedChapterId) return;

    if (!newLessonTitle.trim()) {
      setNewLessonError('Название урока не может быть пустым');
      logCourseEvent('Lesson add failed – empty title', {
        courseId: course.id,
      });
      return;
    }

    const newLesson: Lesson = {
      id: generateId('lesson'),
      title: newLessonTitle.trim(),
      pages: [],
    };

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? { ...ch, lessons: [...ch.lessons, newLesson] }
          : ch,
      ),
    };

    setCourse(updated);
    setNewLessonTitle('');
    setNewLessonError(null);

    try {
      const saved = await courseApi.updateCourse(updated);
      setCourse(saved);
      logCourseEvent('Lesson added', {
        courseId: saved.id,
        lessonId: newLesson.id,
      });
      setSelectedLessonId(newLesson.id);
      setSelectedPageId(null);
    } catch (err) {
      setNewLessonError('Не удалось сохранить урок. Попробуйте позже.');
      logCourseEvent('Lesson add failed – server error', err);
    }
  };

  const handleLessonTitleChange = (lessonId: string, value: string) => {
    if (!course || !selectedChapterId) return;
    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === lessonId ? { ...l, title: value } : l,
              ),
            }
          : ch,
      ),
    };
    setCourse(updated);
  };

  const handleSaveLesson = async (lessonId: string) => {
    if (!course || !selectedChapterId) return;

    const chapter = course.chapters.find((c) => c.id === selectedChapterId);
    const lesson = chapter?.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    if (!lesson.title.trim()) {
      setNewLessonError('Название урока не может быть пустым');
      logCourseEvent('Lesson add failed – empty title', {
        courseId: course.id,
      });
      return;
    }

    try {
      const saved = await courseApi.updateCourse(course);
      setCourse(saved);
      setNewLessonError(null);
    } catch (err) {
      setNewLessonError('Не удалось сохранить урок. Попробуйте позже.');
      logCourseEvent('Lesson add failed – server error', err);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!course || !selectedChapterId) return;
    const confirmDelete = window.confirm('Вы точно хотите удалить урок?');
    if (!confirmDelete) return;

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.filter((l) => l.id !== lessonId),
            }
          : ch,
      ),
    };

    setCourse(updated);

    try {
      const saved = await courseApi.updateCourse(updated);
      setCourse(saved);
      if (selectedLessonId === lessonId) {
        setSelectedLessonId(null);
        setSelectedPageId(null);
      }
    } catch (err) {
      setNewLessonError('Не удалось обновить курс. Попробуйте позже.');
      logCourseEvent('Course archivation failed – server error', err);
    }
  };

  const handleAddPage = async () => {
    if (!course || !selectedChapterId || !selectedLessonId) return;

    if (!newPageTitle.trim()) {
      setNewPageError('Название урока не может быть пустым');
      logCourseEvent('Page add failed – empty title', { courseId: course.id });
      return;
    }

    let page: LessonPage;

    if (newPageType === 'theory') {
      const theoryPage: TheoryPage = {
        id: generateId('page'),
        kind: 'theory',
        title: newPageTitle.trim(),
        theory: {
          mode: 'text',
          text: '',
          markdown: '',
          videoUrl: '',
          attachmentName: null,
          attachmentSize: null,
        },
      };
      page = theoryPage;
    } else if (newPageType === 'quiz') {
      const quizPage: QuizPage = {
        id: generateId('page'),
        kind: 'quiz',
        title: newPageTitle.trim(),
        quiz: {
          question: '',
          options: [],
        },
      };
      page = quizPage;
    } else if (newPageType === 'code') {
      const codePage: CodePage = {
        id: generateId('page'),
        kind: 'code',
        title: newPageTitle.trim(),
        code: {
          description: '',
          language: '',
          testCases: [],
          files: [],
        },
      };
      page = codePage;
    } else {
      const detailedPage: DetailedPage = {
        id: generateId('page'),
        kind: 'detailed',
        title: newPageTitle.trim(),
        detailed: {
          description: '',
          answer: '',
          answerMode: null,
        },
      };
      page = detailedPage;
    }

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === selectedLessonId
                  ? { ...l, pages: [...l.pages, page] }
                  : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updated);
    setNewPageTitle('');
    setNewPageError(null);
    setSelectedPageId(page.id);

    try {
      const saved = await courseApi.updateCourse(updated);
      setCourse(saved);
      switch (newPageType) {
        case 'theory':
          logCourseEvent('Theory page added', {
            courseId: saved.id,
            lessonId: selectedLessonId,
          });
          break;
        case 'quiz':
          logCourseEvent('Test page added', {
            courseId: saved.id,
            lessonId: selectedLessonId,
          });
          break;
        case 'code':
          logCourseEvent('Code page added', {
            courseId: saved.id,
            lessonId: selectedLessonId,
          });
          break;
        case 'detailed':
          logCourseEvent('Detailed answer page added', {
            courseId: saved.id,
            lessonId: selectedLessonId,
          });
          break;
        default:
          break;
      }
    } catch (err) {
      setNewPageError('Не удалось сохранить страницу. Попробуйте позже.');
      logCourseEvent('Theory page add failed – server error', err);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!course || !selectedChapterId || !selectedLessonId) return;
    const confirmDelete = window.confirm('Вы точно хотите удалить урок?');
    if (!confirmDelete) return;

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === selectedLessonId
                  ? { ...l, pages: l.pages.filter((p) => p.id !== pageId) }
                  : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updated);
    if (selectedPageId === pageId) {
      setSelectedPageId(null);
    }

    try {
      const saved = await courseApi.updateCourse(updated);
      setCourse(saved);
    } catch (err) {
      setPageError('Не удалось обновить курс. Попробуйте позже.');
      logCourseEvent('Course archivation failed – server error', err);
    }
  };

  // --- Редактирование содержимого страниц ---

  const handleSavePageContent = async () => {
    if (!course || !selectedChapterId || !selectedLessonId || !selectedPageId) {
      return;
    }

    const { lesson, page } = findLessonAndPage(
      course,
      selectedLessonId,
      selectedPageId,
    );
    if (!lesson || !page) return;

    // Валидации по типам страниц
    if (!page.title.trim()) {
      setPageError('Название урока не может быть пустым');
      logCourseEvent('Page add failed – empty title', {
        courseId: course.id,
      });
      return;
    }

    if (page.kind === 'theory') {
      const content = page.theory;
      const mode = content.mode;
      if (mode === 'text' && !(content.text && content.text.trim())) {
        setPageError('Содержимое страницы не может быть пустым');
        return;
      }
      if (mode === 'markdown' && !(content.markdown && content.markdown.trim())) {
        setPageError('Содержимое страницы не может быть пустым');
        return;
      }
      if (mode === 'video' && !(content.videoUrl && content.videoUrl.trim())) {
        setPageError('Содержимое страницы не может быть пустым');
        return;
      }
      logCourseEvent('Theory page saved', {
        courseId: course.id,
        lessonId: lesson.id,
      });
    }

    if (page.kind === 'quiz') {
      const q = page.quiz;
      if (!q.question.trim()) {
        setPageError('Текст вопроса не может быть пустым');
        return;
      }
      if (q.options.length === 0 || q.options.length > 10) {
        setPageError('Добавьте от 1 до 10 вариантов ответа');
        return;
      }
      if (q.options.some((opt) => !opt.text.trim())) {
        setPageError('Поле для варианта ответа не должно быть пустым');
        return;
      }
      if (!q.options.some((opt) => opt.isCorrect)) {
        setPageError(
          'Ни один из вариантов ответа не помечен, как правильный',
        );
        return;
      }
      logCourseEvent('Test page saved', {
        courseId: course.id,
        lessonId: lesson.id,
      });
    }

    if (page.kind === 'code') {
      const c = page.code;
      if (!c.description.trim()) {
        setPageError('Поле с текстом задания не может быть пустым');
        return;
      }
      if (!c.language) {
        setPageError('Не выбран язык программирования');
        return;
      }
      if (!c.testCases.length) {
        setPageError('Не добавлены тесты');
        return;
      }
      logCourseEvent('Code page saved', {
        courseId: course.id,
        lessonId: lesson.id,
      });
    }

    if (page.kind === 'detailed') {
      const d = page.detailed;
      if (!d.description.trim()) {
        setPageError('Поле description с описанием задания пустое');
        return;
      }
      if (!d.answer.trim()) {
        setPageError('Поле answer с описанием задания пустое');
        return;
      }
      if (!d.answerMode) {
        setPageError('Поле для ответа не определено');
        return;
      }
      if (d.answerMode === 'prompt' && d.answer.trim().length < 20) {
        setPageError('Некорректный промт. Исправьте формулировку');
        return;
      }
      logCourseEvent('Detailed answer page saved', {
        courseId: course.id,
        lessonId: lesson.id,
      });
    }

    setPageError(null);
    setPageInfo('Страница сохранена');

    try {
      const saved = await courseApi.updateCourse(course);
      setCourse(saved);
    } catch (err) {
      setPageError('Не удалось сохранить страницу. Попробуйте позже.');
      if (selectedPage?.kind === 'theory') {
        logCourseEvent('Theory page content (text) add failed – server error', err);
      } else if (selectedPage?.kind === 'quiz') {
        logCourseEvent('Test page content saved failed – server error', err);
      } else if (selectedPage?.kind === 'code') {
        logCourseEvent('Code page add failed – server error', err);
      } else if (selectedPage?.kind === 'detailed') {
        logCourseEvent('Detailed answer page save failed – server error', err);
      }
    }
  };

  const handleTheoryFieldChange = (
    field: 'mode' | 'text' | 'markdown' | 'videoUrl',
    value: string,
  ) => {
    if (!course || !selectedChapterId || !selectedLessonId || !selectedPageId) {
      return;
    }

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === selectedLessonId
                  ? {
                      ...l,
                      pages: l.pages.map((p) => {
                        if (p.id !== selectedPageId || p.kind !== 'theory') {
                          return p;
                        }
                        const next = { ...p };
                        const nextTheory = { ...next.theory };

                        if (field === 'mode') {
                          nextTheory.mode = value as TheoryPage['theory']['mode'];
                        } else if (field === 'text') {
                          nextTheory.text = value;
                        } else if (field === 'markdown') {
                          nextTheory.markdown = value;
                        } else if (field === 'videoUrl') {
                          nextTheory.videoUrl = value;
                        }
                        next.theory = nextTheory;
                        return next;
                      }),
                    }
                  : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updated);
  };

  const handleTheoryAttachmentChange = (file: File | null) => {
    if (!course || !selectedChapterId || !selectedLessonId || !selectedPageId) {
      return;
    }

    if (file && file.size > ATTACH_MAX_BYTES) {
      setPageError('Слишком большой размер файла');
      return;
    }

    setPageError(null);

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === selectedLessonId
                  ? {
                      ...l,
                      pages: l.pages.map((p) => {
                        if (p.id !== selectedPageId || p.kind !== 'theory') {
                          return p;
                        }
                        return {
                          ...p,
                          theory: {
                            ...p.theory,
                            attachmentName: file ? file.name : null,
                            attachmentSize: file ? file.size : null,
                          },
                        };
                      }),
                    }
                  : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updated);
  };

  const handleQuizFieldChange = (field: 'question', value: string) => {
    if (!course || !selectedChapterId || !selectedLessonId || !selectedPageId)
      return;

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === selectedLessonId
                  ? {
                      ...l,
                      pages: l.pages.map((p) => {
                        if (p.id !== selectedPageId || p.kind !== 'quiz') return p;
                        return {
                          ...p,
                          quiz: {
                            ...p.quiz,
                            [field]: value,
                          },
                        };
                      }),
                    }
                  : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updated);
  };

  const handleQuizOptionChange = (
    optionId: string,
    field: 'text' | 'isCorrect',
    value: string | boolean,
  ) => {
    if (!course || !selectedChapterId || !selectedLessonId || !selectedPageId)
      return;

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === selectedLessonId
                  ? {
                      ...l,
                      pages: l.pages.map((p) => {
                        if (p.id !== selectedPageId || p.kind !== 'quiz') return p;
                        const quiz = p.quiz;
                        const options = quiz.options.map((opt) =>
                          opt.id === optionId ? { ...opt, [field]: value } : opt,
                        );
                        return {
                          ...p,
                          quiz: { ...quiz, options },
                        };
                      }),
                    }
                  : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updated);
  };

  const handleAddQuizOption = () => {
    if (!course || !selectedChapterId || !selectedLessonId || !selectedPageId)
      return;

    const { page } = findLessonAndPage(
      course,
      selectedLessonId,
      selectedPageId,
    );
    if (!page || page.kind !== 'quiz') return;
    if (page.quiz.options.length >= 10) {
      setPageError('Добавьте от 1 до 10 вариантов ответа');
      return;
    }

    const option: QuizOption = {
      id: generateId('opt'),
      text: '',
      isCorrect: false,
    };

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === selectedLessonId
                  ? {
                      ...l,
                      pages: l.pages.map((p) => {
                        if (p.id !== selectedPageId || p.kind !== 'quiz') return p;
                        return {
                          ...p,
                          quiz: {
                            ...p.quiz,
                            options: [...p.quiz.options, option],
                          },
                        };
                      }),
                    }
                  : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updated);
  };

  const handleRemoveQuizOption = (optionId: string) => {
    if (!course || !selectedChapterId || !selectedLessonId || !selectedPageId)
      return;

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === selectedLessonId
                  ? {
                      ...l,
                      pages: l.pages.map((p) => {
                        if (p.id !== selectedPageId || p.kind !== 'quiz') return p;
                        return {
                          ...p,
                          quiz: {
                            ...p.quiz,
                            options: p.quiz.options.filter(
                              (opt) => opt.id !== optionId,
                            ),
                          },
                        };
                      }),
                    }
                  : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updated);
  };

  const handleCodeFieldChange = (
    field: 'description' | 'language',
    value: string,
  ) => {
    if (!course || !selectedChapterId || !selectedLessonId || !selectedPageId)
      return;

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === selectedLessonId
                  ? {
                      ...l,
                      pages: l.pages.map((p) => {
                        if (p.id !== selectedPageId || p.kind !== 'code') return p;
                        const code = p.code;
                        const next: CodePage = {
                          ...p,
                          code: {
                            ...code,
                            [field]: value,
                          },
                        };
                        return next;
                      }),
                    }
                  : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updated);
  };

  const handleAddCodeTestCase = () => {
    if (!course || !selectedChapterId || !selectedLessonId || !selectedPageId)
      return;

    const testCase: CodeTestCase = {
      id: generateId('test'),
      input: '',
      output: '',
    };

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === selectedLessonId
                  ? {
                      ...l,
                      pages: l.pages.map((p) => {
                        if (p.id !== selectedPageId || p.kind !== 'code') return p;
                        return {
                          ...p,
                          code: {
                            ...p.code,
                            testCases: [...p.code.testCases, testCase],
                          },
                        };
                      }),
                    }
                  : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updated);
  };

  const handleCodeTestCaseChange = (
    testId: string,
    field: 'input' | 'output',
    value: string,
  ) => {
    if (!course || !selectedChapterId || !selectedLessonId || !selectedPageId)
      return;

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === selectedLessonId
                  ? {
                      ...l,
                      pages: l.pages.map((p) => {
                        if (p.id !== selectedPageId || p.kind !== 'code') return p;
                        return {
                          ...p,
                          code: {
                            ...p.code,
                            testCases: p.code.testCases.map((tc) =>
                              tc.id === testId ? { ...tc, [field]: value } : tc,
                            ),
                          },
                        };
                      }),
                    }
                  : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updated);
  };

  const handleRemoveCodeTestCase = (testId: string) => {
    if (!course || !selectedChapterId || !selectedLessonId || !selectedPageId)
      return;

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === selectedLessonId
                  ? {
                      ...l,
                      pages: l.pages.map((p) => {
                        if (p.id !== selectedPageId || p.kind !== 'code') return p;
                        return {
                          ...p,
                          code: {
                            ...p.code,
                            testCases: p.code.testCases.filter(
                              (tc) => tc.id !== testId,
                            ),
                          },
                        };
                      }),
                    }
                  : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updated);
  };

  const handleDetailedFieldChange = (
    field: 'description' | 'answer' | 'answerMode',
    value: string,
  ) => {
    if (!course || !selectedChapterId || !selectedLessonId || !selectedPageId)
      return;

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === selectedLessonId
                  ? {
                      ...l,
                      pages: l.pages.map((p) => {
                        if (p.id !== selectedPageId || p.kind !== 'detailed')
                          return p;
                        const detailed = p.detailed;
                        const next: DetailedPage = {
                          ...p,
                          detailed: {
                            ...detailed,
                            [field]:
                              field === 'answerMode'
                                ? (value as DetailedAnswerMode)
                                : value,
                          },
                        };
                        return next;
                      }),
                    }
                  : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updated);
  };

  // --- Версионирование ---

  const handleSaveVersion = async () => {
    if (!course) return;
    setVersionsError(null);
    setVersionsInfo(null);

    try {
      const version = await courseApi.saveVersion(course.id, versionComment);
      const updated = await courseApi.getCourse(course.id);
      setCourse(updated);
      setVersionsInfo(`Версия сохранена (${version.label ?? version.id})`);
    } catch (err) {
      setVersionsError('Не удалось сохранить версию.');
      logCourseEvent('Version save failed – server error', err);
    }
  };

  const handleRestoreVersion = async (version: VersionSnapshot) => {
    if (!course) return;
    const confirmRestore = window.confirm(
      'Вы уверены, что хотите откатиться к выбранной версии?',
    );
    if (!confirmRestore) return;

    setVersionsError(null);
    setVersionsInfo(null);

    try {
      const restored = await courseApi.restoreVersion(course.id, version.id);
      setCourse(restored);
      setVersionsInfo('Версия восстановлена');
    } catch (err) {
      setVersionsError('Не удалось восстановить версию.');
      logCourseEvent('Version save failed – server error', err);
    }
  };

  // --- Соавторы и роли ---

  const knownUsers = [
    {
      id: 'coauthor',
      email: 'coauthor@example.com',
      name: 'Соавтор',
    },
    {
      id: 'moderator',
      email: 'moderator@example.com',
      name: 'Модератор',
    },
  ];

  const handleAddCollaborator = () => {
    if (!course) return;
    setCollabError(null);
    setCollabInfo(null);

    const email = collabEmail.trim().toLowerCase();
    if (!email) {
      setCollabError('Введите email пользователя');
      return;
    }

    const existing = course.collaborators.find(
      (c) => c.email.toLowerCase() === email,
    );
    if (existing) {
      setCollabError('Этот пользователь уже является соавтором');
      logCourseEvent('Collaborator add failed – user already added', {
        courseId: course.id,
        email,
      });
      return;
    }

    const userRecord = knownUsers.find((u) => u.email === email);
    if (!userRecord) {
      setCollabError('Пользователь с таким email не найден');
      logCourseEvent('Collaborator add failed – user not found', {
        courseId: course.id,
        email,
      });
      return;
    }

    const collaborator = {
      id: userRecord.id,
      email: userRecord.email,
      role: collabRole,
      name: userRecord.name,
      isPending: true,
    } as const;

    const updated: Course = {
      ...course,
      collaborators: [...course.collaborators, collaborator],
    };

    setCourse(updated);
    setCollabEmail('');
    setCollabRole('author');

    courseApi
      .updateCourse(updated)
      .then((saved) => {
        setCourse(saved);
        setCollabInfo('Соавтор успешно добавлен');
        logCourseEvent('Collaborator added', {
          courseId: saved.id,
          collaboratorEmail: email,
        });
      })
      .catch((err) => {
        setCollabError('Не удалось добавить соавтора. Попробуйте позже.');
        logCourseEvent('Collaborator add failed – server error', err);
      });
  };

  // --- Публикация, обновление, архив, удаление ---

  const validateForPublish = (c: Course): string[] => {
    const errors: string[] = [];

    if (validateCourseTitle(c.title)) {
      errors.push('Добавьте корректное название курса');
    }
    if (validateCourseDescription(c.description)) {
      errors.push('Добавьте корректное описание курса');
    }
    if (!c.cover) {
      errors.push('Добавьте обложку курса');
    }

    const hasLessonsWithPages = c.chapters.some((ch) =>
      ch.lessons.some((l) => l.pages.length > 0),
    );
    if (!hasLessonsWithPages) {
      errors.push('Добавьте хотя бы один урок с содержимым');
    }

    c.chapters.forEach((ch) => {
      if (!ch.title.trim()) {
        errors.push(`Глава без названия`);
      }
      ch.lessons.forEach((l) => {
        if (!l.title.trim()) {
          errors.push(`Урок без названия`);
        }
        l.pages.forEach((p) => {
          if (!p.title.trim()) {
            errors.push('Страница без названия');
          }
        });
      });
    });

    return errors;
  };

  const handlePublishCourse = async () => {
    if (!course) return;
    setPublishError(null);
    setPublishInfo(null);

    const errors = validateForPublish(course);
    if (errors.length > 0) {
      setPublishError(errors.join('; '));
      logCourseEvent('Course publication failed – requirements not met', {
        courseId: course.id,
        errors,
      });
      return;
    }

    const updated: Course = {
      ...course,
      status: 'published',
    };

    try {
      const saved = await courseApi.updateCourse(updated);
      setCourse(saved);
      setPublishInfo('Курс опубликован');
      logCourseEvent('Course published', { courseId: saved.id });
    } catch (err) {
      setPublishError('Не удалось опубликовать курс. Попробуйте позже.');
      logCourseEvent('Course publication failed – server error', err);
    }
  };

  const handleUpdatePublished = async () => {
    if (!course) return;
    setPublishError(null);
    setPublishInfo(null);

    const updated: Course = {
      ...course,
      status: 'published',
    };

    try {
      const saved = await courseApi.updateCourse(updated);
      setCourse(saved);
      setPublishInfo('Опубликованная версия обновлена');
    } catch (err) {
      setPublishError('Не удалось обновить курс. Попробуйте позже.');
      logCourseEvent('Course publication failed – server error', err);
    }
  };

  const handleArchiveCourse = async () => {
    if (!course) return;
    setPublishError(null);
    setPublishInfo(null);

    const updated: Course = {
      ...course,
      status: 'archived',
    };

    try {
      const saved = await courseApi.updateCourse(updated);
      setCourse(saved);
      setPublishInfo('Курс архивирован');
    } catch (err) {
      setPublishError('Не удалось обновить курс. Попробуйте позже.');
      logCourseEvent('Course archivation failed – server error', err);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    const confirmDelete = window.confirm(
      'Вы точно хотите удалить опубликованный курс?',
    );
    if (!confirmDelete) return;

    setPublishError(null);
    setPublishInfo(null);

    try {
      await courseApi.deleteCourse(course.id);
      navigate('/courses');
    } catch (err) {
      setPublishError('Не удалось обновить курс. Попробуйте позже.');
      logCourseEvent('Course delete failed – server error', err);
    }
  };

  // --- AI улучшение текста ---

  const handleAiEnhanceText = async (
    mode: 'simplify' | 'academic' | 'grammar' | 'expand' | 'example',
  ) => {
    if (!selectedPage || selectedPage.kind !== 'theory') {
      setAiError('Улучшать можно только текст теоретических материалов.');
      return;
    }

    const content = selectedPage.theory;
    const text =
      content.mode === 'markdown'
        ? content.markdown || ''
        : content.mode === 'video'
        ? content.videoUrl || ''
        : content.text || '';

    if (!text.trim()) {
      setAiError('Нет текста для улучшения.');
      return;
    }

    setAiError(null);
    setAiResult(null);
    setAiLoading(true);

    try {
      const result = await enhanceTextWithAi(text, mode);
      setAiResult(result);
    } catch (err) {
      setAiError(
        'AI-ассистент временно недоступен. Пожалуйста, попробуйте позже.',
      );
      logCourseEvent('AI service unavailable', err);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = (mode: 'replace' | 'append') => {
    if (!course || !selectedPage || selectedPage.kind !== 'theory' || !aiResult) {
      return;
    }

    const textToUse = aiResult;

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) => ({
          ...l,
          pages: l.pages.map((p) => {
            if (p.id !== selectedPage.id || p.kind !== 'theory') return p;
            const next = { ...p };
            const theory = { ...next.theory };

            if (theory.mode === 'markdown') {
              theory.markdown =
                mode === 'replace'
                  ? textToUse
                  : `${theory.markdown || ''}\n\n${textToUse}`;
            } else {
              theory.text =
                mode === 'replace'
                  ? textToUse
                  : `${theory.text || ''}\n\n${textToUse}`;
            }

            next.theory = theory;
            return next;
          }),
        })),
      })),
    };

    setCourse(updated);
    setAiResult(null);
  };

  // --- AI генерация теста ---

  const handleGenerateTestWithAi = async () => {
    if (!course) return;

    setAiError(null);
    setAiResult(null);
    setAiLoading(true);
    setAiGeneratedQuestions([]);

    const context = getCourseTextContext(course);

    try {
      const questions = await generateTestQuestionsWithAi(context, {
        theme: aiTestParams.theme || undefined,
        type: aiTestParams.type,
        count: aiTestParams.count,
        difficulty: aiTestParams.difficulty,
      });
      setAiGeneratedQuestions(questions);
    } catch (err) {
      if (err instanceof Error && err.message === 'INSUFFICIENT_CONTEXT') {
        setAiError(
          'Недостаточно контекста для генерации вопросов. Добавьте больше учебного материала в урок.',
        );
        // Событие AI test generation insufficient context логируется внутри ai.ts
      } else {
        setAiError(
          'AI-ассистент временно недоступен. Пожалуйста, попробуйте позже.',
        );
        logCourseEvent('AI service unavailable', err);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiGeneratedQuestionChange = (
    questionId: string,
    value: string,
  ) => {
    setAiGeneratedQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, question: value } : q)),
    );
  };

  const handleAiGeneratedOptionChange = (
    questionId: string,
    index: number,
    field: 'text' | 'isCorrect',
    value: string | boolean,
  ) => {
    setAiGeneratedQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const options = q.options.map((opt, i) =>
          i === index ? { ...opt, [field]: value } : opt,
        );
        return { ...q, options };
      }),
    );
  };

  const handleRemoveGeneratedQuestion = (questionId: string) => {
    setAiGeneratedQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleAddGeneratedQuestionsToLesson = async () => {
    if (!course || !selectedChapterId || !selectedLessonId) return;
    if (aiGeneratedQuestions.length === 0) return;

    const chapterIndex = course.chapters.findIndex(
      (ch) => ch.id === selectedChapterId,
    );
    if (chapterIndex === -1) return;
    const chapter = course.chapters[chapterIndex];

    const lessonIndex = chapter.lessons.findIndex(
      (l) => l.id === selectedLessonId,
    );
    if (lessonIndex === -1) return;
    const lesson = chapter.lessons[lessonIndex];

    const newPages: QuizPage[] = aiGeneratedQuestions.map((q, idx) => ({
      id: generateId('page'),
      kind: 'quiz',
      title: q.question.slice(0, 60) || `Тестовый вопрос ${idx + 1}`,
      quiz: {
        question: q.question,
        options: q.options.map((opt) => ({
          id: generateId('opt'),
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      },
    }));

    const updatedLesson: Lesson = {
      ...lesson,
      pages: [...lesson.pages, ...newPages],
    };

    const updatedCourse: Course = {
      ...course,
      chapters: course.chapters.map((ch, idx) =>
        idx === chapterIndex
          ? {
              ...ch,
              lessons: ch.lessons.map((l, lIdx) =>
                lIdx === lessonIndex ? updatedLesson : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updatedCourse);

    try {
      const saved = await courseApi.updateCourse(updatedCourse);
      setCourse(saved);
      setPageInfo(`Добавлено вопросов в урок: ${newPages.length}`);
      setAiGeneratedQuestions([]);
      logCourseEvent('AI test generation success', {
        courseId: saved.id,
        lessonId: selectedLessonId,
        count: newPages.length,
      });
    } catch (err) {
      setPageError(
        'Не удалось сохранить сгенерированные вопросы. Попробуйте позже.',
      );
      logCourseEvent('Test page content saved failed – server error', err);
    }
  };

  // --- AI генерация кодового задания ---

  const handleGenerateCodeTaskWithAi = async () => {
    if (!course) return;

    setAiError(null);
    setAiResult(null);
    setAiLoading(true);
    setAiGeneratedCodeTask(null);

    try {
      const result = await generateCodeTaskWithAi({
        theme: aiCodeParams.theme || 'задача по программированию',
        language: aiCodeParams.language,
        difficulty: aiCodeParams.difficulty,
        requirements: aiCodeParams.requirements || undefined,
      });
      setAiGeneratedCodeTask(result);
      // Успех логируется внутри ai.ts (AI code task generation success)
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_PARAMETERS') {
        setAiError(
          'Невозможно сгенерировать задание с указанными параметрами. Проверьте корректность введённых данных.',
        );
        // AI code task generation invalid parameters логируется внутри ai.ts
      } else {
        setAiError(
          'AI-ассистент временно недоступен. Пожалуйста, попробуйте позже.',
        );
        logCourseEvent('AI service unavailable', err);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleGeneratedCodeFieldChange = (
    field: 'description' | 'language' | 'sampleSolution',
    value: string,
  ) => {
    setAiGeneratedCodeTask((prev) =>
      prev
        ? {
            ...prev,
            [field]:
              field === 'language'
                ? (value as SupportedLanguage)
                : value,
          }
        : prev,
    );
  };

  const handleGeneratedCodeTestCaseChange = (
    index: number,
    field: 'input' | 'output',
    value: string,
  ) => {
    setAiGeneratedCodeTask((prev) => {
      if (!prev) return prev;
      const nextCases = prev.testCases.map((tc, i) =>
        i === index ? { ...tc, [field]: value } : tc,
      );
      return { ...prev, testCases: nextCases };
    });
  };

  const handleAddGeneratedCodeTestCase = () => {
    setAiGeneratedCodeTask((prev) =>
      prev
        ? {
            ...prev,
            testCases: [...prev.testCases, { input: '', output: '' }],
          }
        : prev,
    );
  };

  const handleRemoveGeneratedCodeTestCase = (index: number) => {
    setAiGeneratedCodeTask((prev) => {
      if (!prev) return prev;
      const nextCases = prev.testCases.filter((_, i) => i !== index);
      return { ...prev, testCases: nextCases };
    });
  };

  const handleApplyGeneratedCodeTask = async () => {
    if (
      !course ||
      !selectedChapterId ||
      !selectedLessonId ||
      !aiGeneratedCodeTask
    ) {
      return;
    }

    const chapterIndex = course.chapters.findIndex(
      (ch) => ch.id === selectedChapterId,
    );
    if (chapterIndex === -1) return;
    const chapter = course.chapters[chapterIndex];

    const lessonIndex = chapter.lessons.findIndex(
      (l) => l.id === selectedLessonId,
    );
    if (lessonIndex === -1) return;
    const lesson = chapter.lessons[lessonIndex];

    const codePage: CodePage = {
      id: generateId('page'),
      kind: 'code',
      title:
        aiGeneratedCodeTask.description.slice(0, 60) || 'Кодовое задание',
      code: {
        description: aiGeneratedCodeTask.description,
        language: aiGeneratedCodeTask.language,
        testCases: aiGeneratedCodeTask.testCases.map((tc) => ({
          id: generateId('test'),
          input: tc.input,
          output: tc.output,
        })),
        files: [],
      },
    };

    const updatedLesson: Lesson = {
      ...lesson,
      pages: [...lesson.pages, codePage],
    };

    const updatedCourse: Course = {
      ...course,
      chapters: course.chapters.map((ch, idx) =>
        idx === chapterIndex
          ? {
              ...ch,
              lessons: ch.lessons.map((l, lIdx) =>
                lIdx === lessonIndex ? updatedLesson : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updatedCourse);

    try {
      const saved = await courseApi.updateCourse(updatedCourse);
      setCourse(saved);
      setSelectedPageId(codePage.id);
      setAiGeneratedCodeTask(null);
      setPageInfo('Кодовое задание добавлено в урок');
      logCourseEvent('AI code task generation success', {
        courseId: saved.id,
        lessonId: selectedLessonId,
        language: codePage.code.language,
      });
    } catch (err) {
      setPageError('Не удалось сохранить кодовое задание. Попробуйте позже.');
      logCourseEvent('Code page add failed – server error', err);
    }
  };

  // --- Выбор элементов структуры ---

  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    const chapter = course?.chapters.find((ch) => ch.id === chapterId);
    const firstLesson = chapter?.lessons[0];
    if (firstLesson) {
      setSelectedLessonId(firstLesson.id);
      const firstPage = firstLesson.pages[0];
      setSelectedPageId(firstPage?.id ?? null);
    } else {
      setSelectedLessonId(null);
      setSelectedPageId(null);
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    const chapter = course?.chapters.find((ch) => ch.id === selectedChapterId);
    const lesson = chapter?.lessons.find((l) => l.id === lessonId);
    const firstPage = lesson?.pages[0];
    setSelectedPageId(firstPage?.id ?? null);
  };

  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId);
  };

  const handlePageTitleChange = (pageId: string, value: string) => {
    if (!course || !selectedChapterId || !selectedLessonId) return;

    const updated: Course = {
      ...course,
      chapters: course.chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: ch.lessons.map((l) =>
                l.id === selectedLessonId
                  ? {
                      ...l,
                      pages: l.pages.map((p) =>
                        p.id === pageId ? { ...p, title: value } : p,
                      ),
                    }
                  : l,
              ),
            }
          : ch,
      ),
    };

    setCourse(updated);
  };

  // --- Рендер редактора страницы ---

  const renderPageEditor = () => {
    if (!selectedChapter) {
      return <p>Выберите главу, урок и страницу для редактирования.</p>;
    }

    if (!selectedLesson) {
      return <p>Выберите урок или создайте новый.</p>;
    }

    if (!selectedPage) {
      return <p>Выберите страницу или добавьте новую.</p>;
    }

    return (
      <div>
        <h2 style={{ marginBottom: '1rem' }}>
          Редактор страницы: <span>{selectedPage.title || 'Без названия'}</span>
        </h2>

        <div className="form-field">
          <label className="form-label" htmlFor="page-title">
            Название страницы
          </label>
          <input
            id="page-title"
            className="form-input"
            type="text"
            value={selectedPage.title}
            onChange={(e) => handlePageTitleChange(selectedPage.id, e.target.value)}
          />
        </div>

        {selectedPage.kind === 'theory' && (
          <>
            <div className="form-field">
              <label className="form-label" htmlFor="theory-mode">
                Тип содержимого
              </label>
              <select
                id="theory-mode"
                className="form-input"
                value={selectedPage.theory.mode}
                onChange={(e) =>
                  handleTheoryFieldChange('mode', e.target.value as string)
                }
              >
                <option value="text">Текст</option>
                <option value="markdown">Markdown</option>
                <option value="video">Видео (URL)</option>
              </select>
            </div>

            {selectedPage.theory.mode === 'text' && (
              <div className="form-field">
                <label className="form-label" htmlFor="theory-text">
                  Текст
                </label>
                <textarea
                  id="theory-text"
                  className="form-input"
                  rows={10}
                  value={selectedPage.theory.text || ''}
                  onChange={(e) => handleTheoryFieldChange('text', e.target.value)}
                />
              </div>
            )}

            {selectedPage.theory.mode === 'markdown' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                  gap: '1rem',
                }}
              >
                <div className="form-field">
                  <label className="form-label" htmlFor="theory-md">
                    Markdown содержимое
                  </label>
                  <textarea
                    id="theory-md"
                    className="form-input"
                    rows={10}
                    value={selectedPage.theory.markdown || ''}
                    onChange={(e) =>
                      handleTheoryFieldChange('markdown', e.target.value)
                    }
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Предпросмотр (сырой текст)</label>
                  <div
                    style={{
                      border: '1px solid var(--color-border, #ddd)',
                      borderRadius: 4,
                      padding: '0.75rem',
                      minHeight: '10rem',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      background: 'var(--color-bg-subtle, #fafafa)',
                    }}
                  >
                    {selectedPage.theory.markdown || 'Предпросмотр пуст'}
                  </div>
                </div>
              </div>
            )}

            {selectedPage.theory.mode === 'video' && (
              <div className="form-field">
                <label className="form-label" htmlFor="theory-video">
                  Ссылка на видео (MP4 или платформа)
                </label>
                <input
                  id="theory-video"
                  className="form-input"
                  type="text"
                  value={selectedPage.theory.videoUrl || ''}
                  onChange={(e) =>
                    handleTheoryFieldChange('videoUrl', e.target.value)
                  }
                />
              </div>
            )}

            <div className="form-field">
              <label className="form-label" htmlFor="theory-attach">
                Прикрепить материал (.pdf, .docx, .md и т.п.)
              </label>
              <input
                id="theory-attach"
                type="file"
                onChange={(e) =>
                  handleTheoryAttachmentChange(e.target.files?.[0] ?? null)
                }
              />
              {selectedPage.theory.attachmentName && (
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Прикреплено: {selectedPage.theory.attachmentName} (
                  {Math.round((selectedPage.theory.attachmentSize ?? 0) / 1024)} КБ)
                </p>
              )}
            </div>

            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: 4,
                border: '1px solid var(--color-border, #ddd)',
                background: 'var(--color-bg-subtle, #fafafa)',
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                Улучшить текст с помощью AI:
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleAiEnhanceText('simplify')}
                  disabled={aiLoading}
                >
                  Упростить язык
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleAiEnhanceText('academic')}
                  disabled={aiLoading}
                >
                  Сделать более академичным
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleAiEnhanceText('grammar')}
                  disabled={aiLoading}
                >
                  Исправить грамматику
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleAiEnhanceText('expand')}
                  disabled={aiLoading}
                >
                  Расширить мысль
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleAiEnhanceText('example')}
                  disabled={aiLoading}
                >
                  Придумать пример
                </button>
              </div>
              {aiLoading && <p>AI-ассистент обрабатывает запрос…</p>}
              {aiError && (
                <div className="alert alert--error" style={{ marginTop: '0.5rem' }}>
                  {aiError}
                </div>
              )}
              {aiResult && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label className="form-label" htmlFor="ai-result">
                    Результат AI
                  </label>
                  <textarea
                    id="ai-result"
                    className="form-input"
                    rows={6}
                    value={aiResult}
                    onChange={(e) => setAiResult(e.target.value)}
                  />
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => applyAiResult('replace')}
                    >
                      Заменить исходный текст
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => applyAiResult('append')}
                    >
                      Добавить как новый абзац
                    </button>
                    <button
                      type="button"
                      className="btn btn-text"
                      onClick={() => setAiResult(null)}
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {selectedPage.kind === 'quiz' && (
          <>
            <div className="form-field">
              <label className="form-label" htmlFor="quiz-question">
                Текст вопроса
              </label>
              <textarea
                id="quiz-question"
                className="form-input"
                rows={4}
                value={selectedPage.quiz.question}
                onChange={(e) => handleQuizFieldChange('question', e.target.value)}
              />
            </div>

            <div className="form-field">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.25rem',
                }}
              >
                <label className="form-label">Варианты ответа (1–10)</label>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleAddQuizOption}
                >
                  Добавить вариант
                </button>
              </div>
              {selectedPage.quiz.options.length === 0 && (
                <p style={{ fontSize: '0.9rem' }}>
                  Пока нет вариантов. Добавьте первый вариант ответа.
                </p>
              )}
              {selectedPage.quiz.options.map((opt) => (
                <div
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={opt.isCorrect}
                    onChange={(e) =>
                      handleQuizOptionChange(
                        opt.id,
                        'isCorrect',
                        e.target.checked,
                      )
                    }
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    value={opt.text}
                    onChange={(e) =>
                      handleQuizOptionChange(opt.id, 'text', e.target.value)
                    }
                    placeholder="Текст варианта ответа"
                  />
                  <button
                    type="button"
                    className="btn btn-text"
                    onClick={() => handleRemoveQuizOption(opt.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: 4,
                border: '1px solid var(--color-border, #ddd)',
                background: 'var(--color-bg-subtle, #fafafa)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ flex: '1 1 200px' }}>
                  <label className="form-label" htmlFor="ai-test-theme">
                    Тема теста (опционально)
                  </label>
                  <input
                    id="ai-test-theme"
                    className="form-input"
                    type="text"
                    value={aiTestParams.theme}
                    onChange={(e) =>
                      setAiTestParams((p) => ({ ...p, theme: e.target.value }))
                    }
                  />
                </div>
                <div style={{ flex: '0 0 180px' }}>
                  <label className="form-label" htmlFor="ai-test-type">
                    Тип вопросов
                  </label>
                  <select
                    id="ai-test-type"
                    className="form-input"
                    value={aiTestParams.type}
                    onChange={(e) =>
                      setAiTestParams((p) => ({
                        ...p,
                        type: e.target.value as 'single' | 'multiple' | 'boolean',
                      }))
                    }
                  >
                    <option value="single">Одиночный выбор</option>
                    <option value="multiple">Множественный выбор</option>
                    <option value="boolean">True/False</option>
                  </select>
                </div>
                <div style={{ flex: '0 0 140px' }}>
                  <label className="form-label" htmlFor="ai-test-count">
                    Кол-во вопросов
                  </label>
                  <input
                    id="ai-test-count"
                    className="form-input"
                    type="number"
                    min={1}
                    max={10}
                    value={aiTestParams.count}
                    onChange={(e) =>
                      setAiTestParams((p) => ({
                        ...p,
                        count: Math.min(
                          10,
                          Math.max(1, Number(e.target.value) || 1),
                        ),
                      }))
                    }
                  />
                </div>
                <div style={{ flex: '0 0 180px' }}>
                  <label className="form-label" htmlFor="ai-test-diff">
                    Сложность
                  </label>
                  <select
                    id="ai-test-diff"
                    className="form-input"
                    value={aiTestParams.difficulty}
                    onChange={(e) =>
                      setAiTestParams((p) => ({
                        ...p,
                        difficulty: e.target
                          .value as 'easy' | 'medium' | 'hard',
                      }))
                    }
                  >
                    <option value="easy">Начальный</option>
                    <option value="medium">Средний</option>
                    <option value="hard">Продвинутый</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                onClick={handleGenerateTestWithAi}
                disabled={aiLoading}
              >
                Сгенерировать тест с помощью AI
              </button>

              {aiLoading && <p style={{ marginTop: '0.5rem' }}>Генерация теста…</p>}
              {aiError && (
                <div className="alert alert--error" style={{ marginTop: '0.5rem' }}>
                  {aiError}
                </div>
              )}

              {aiGeneratedQuestions.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>
                    Сгенерированные вопросы ({aiGeneratedQuestions.length})
                  </h3>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    Отредактируйте вопросы при необходимости и добавьте их в текущий
                    урок.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {aiGeneratedQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        style={{
                          border: '1px solid var(--color-border, #ddd)',
                          borderRadius: 4,
                          padding: '0.75rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <strong>Вопрос {idx + 1}</strong>
                          <button
                            type="button"
                            className="btn btn-text"
                            onClick={() => handleRemoveGeneratedQuestion(q.id)}
                          >
                            Удалить
                          </button>
                        </div>
                        <textarea
                          className="form-input"
                          rows={3}
                          value={q.question}
                          onChange={(e) =>
                            handleAiGeneratedQuestionChange(q.id, e.target.value)
                          }
                        />
                        <div style={{ marginTop: '0.5rem' }}>
                          {q.options.map((opt, i) => (
                            <div
                              key={`${q.id}_opt_${i}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.35rem',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={opt.isCorrect}
                                onChange={(e) =>
                                  handleAiGeneratedOptionChange(
                                    q.id,
                                    i,
                                    'isCorrect',
                                    e.target.checked,
                                  )
                                }
                              />
                              <input
                                type="text"
                                className="form-input"
                                style={{ flex: 1 }}
                                value={opt.text}
                                onChange={(e) =>
                                  handleAiGeneratedOptionChange(
                                    q.id,
                                    i,
                                    'text',
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: '0.75rem' }}
                    onClick={handleAddGeneratedQuestionsToLesson}
                  >
                    Добавить {aiGeneratedQuestions.length} вопрос(а) в урок
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {selectedPage.kind === 'code' && (
          <>
            <div className="form-field">
              <label className="form-label" htmlFor="code-desc">
                Описание задания
              </label>
              <textarea
                id="code-desc"
                className="form-input"
                rows={5}
                value={selectedPage.code.description}
                onChange={(e) =>
                  handleCodeFieldChange('description', e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="code-lang">
                Язык программирования
              </label>
              <select
                id="code-lang"
                className="form-input"
                value={selectedPage.code.language || ''}
                onChange={(e) =>
                  handleCodeFieldChange(
                    'language',
                    e.target.value as SupportedLanguage,
                  )
                }
              >
                <option value="">Не выбран</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
              </select>
            </div>

            <div className="form-field">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.25rem',
                }}
              >
                <label className="form-label">Input/Output тесты</label>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleAddCodeTestCase}
                >
                  Добавить тест
                </button>
              </div>
              {selectedPage.code.testCases.length === 0 && (
                <p style={{ fontSize: '0.9rem' }}>
                  Тесты ещё не добавлены. Добавьте хотя бы один тест.
                </p>
              )}
              {selectedPage.code.testCases.map((tc) => (
                <div
                  key={tc.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    alignItems: 'stretch',
                  }}
                >
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="input"
                    value={tc.input}
                    onChange={(e) =>
                      handleCodeTestCaseChange(tc.id, 'input', e.target.value)
                    }
                  />
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="output"
                    value={tc.output}
                    onChange={(e) =>
                      handleCodeTestCaseChange(tc.id, 'output', e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-text"
                    onClick={() => handleRemoveCodeTestCase(tc.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: 4,
                border: '1px solid var(--color-border, #ddd)',
                background: 'var(--color-bg-subtle, #fafafa)',
              }}
            >
              <h3 style={{ marginBottom: '0.5rem' }}>
                Генерация кодового задания с помощью AI
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.5fr) repeat(3, minmax(0, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div>
                  <label className="form-label" htmlFor="ai-code-theme">
                    Тема задания
                  </label>
                  <input
                    id="ai-code-theme"
                    className="form-input"
                    type="text"
                    value={aiCodeParams.theme}
                    onChange={(e) =>
                      setAiCodeParams((p) => ({ ...p, theme: e.target.value }))
                    }
                    placeholder='Например: "реализовать сортировку массива"'
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="ai-code-lang">
                    Язык
                  </label>
                  <select
                    id="ai-code-lang"
                    className="form-input"
                    value={aiCodeParams.language}
                    onChange={(e) =>
                      setAiCodeParams((p) => ({
                        ...p,
                        language: e.target.value as SupportedLanguage,
                      }))
                    }
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="ai-code-diff">
                    Сложность
                  </label>
                  <select
                    id="ai-code-diff"
                    className="form-input"
                    value={aiCodeParams.difficulty}
                    onChange={(e) =>
                      setAiCodeParams((p) => ({
                        ...p,
                        difficulty: e.target
                          .value as 'easy' | 'medium' | 'hard',
                      }))
                    }
                  >
                    <option value="easy">Начальный</option>
                    <option value="medium">Средний</option>
                    <option value="hard">Продвинутый</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="ai-code-req">
                    Требования
                  </label>
                  <input
                    id="ai-code-req"
                    className="form-input"
                    type="text"
                    value={aiCodeParams.requirements}
                    onChange={(e) =>
                      setAiCodeParams((p) => ({
                        ...p,
                        requirements: e.target.value,
                      }))
                    }
                    placeholder='Например: "использовать рекурсию"'
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                onClick={handleGenerateCodeTaskWithAi}
                disabled={aiLoading}
              >
                Сгенерировать задание с помощью AI
              </button>

              {aiLoading && <p style={{ marginTop: '0.5rem' }}>Генерация задания…</p>}
              {aiError && (
                <div className="alert alert--error" style={{ marginTop: '0.5rem' }}>
                  {aiError}
                </div>
              )}

              {aiGeneratedCodeTask && (
                <div style={{ marginTop: '0.75rem' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Превью задания</h4>
                  <div className="form-field">
                    <label className="form-label" htmlFor="ai-code-desc">
                      Описание
                    </label>
                    <textarea
                      id="ai-code-desc"
                      className="form-input"
                      rows={4}
                      value={aiGeneratedCodeTask.description}
                      onChange={(e) =>
                        handleGeneratedCodeFieldChange(
                          'description',
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="ai-code-lang-prev">
                      Язык
                    </label>
                    <select
                      id="ai-code-lang-prev"
                      className="form-input"
                      value={aiGeneratedCodeTask.language}
                      onChange={(e) =>
                        handleGeneratedCodeFieldChange(
                          'language',
                          e.target.value,
                        )
                      }
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="csharp">C#</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <label className="form-label">
                        Тестовые случаи (input/output)
                      </label>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={handleAddGeneratedCodeTestCase}
                      >
                        Добавить тест
                      </button>
                    </div>
                    {aiGeneratedCodeTask.testCases.map((tc, idx) => (
                      <div
                        key={`ai-tc-${idx}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto',
                          gap: '0.5rem',
                          marginBottom: '0.5rem',
                          alignItems: 'stretch',
                        }}
                      >
                        <textarea
                          className="form-input"
                          rows={2}
                          placeholder="input"
                          value={tc.input}
                          onChange={(e) =>
                            handleGeneratedCodeTestCaseChange(
                              idx,
                              'input',
                              e.target.value,
                            )
                          }
                        />
                        <textarea
                          className="form-input"
                          rows={2}
                          placeholder="output"
                          value={tc.output}
                          onChange={(e) =>
                            handleGeneratedCodeTestCaseChange(
                              idx,
                              'output',
                              e.target.value,
                            )
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-text"
                          onClick={() => handleRemoveGeneratedCodeTestCase(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="ai-code-sample">
                      Пример решения (опционально, только для просмотра)
                    </label>
                    <textarea
                      id="ai-code-sample"
                      className="form-input"
                      rows={4}
                      value={aiGeneratedCodeTask.sampleSolution}
                      onChange={(e) =>
                        handleGeneratedCodeFieldChange(
                          'sampleSolution',
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleApplyGeneratedCodeTask}
                  >
                    Создать кодовую страницу в уроке
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {selectedPage.kind === 'detailed' && (
          <>
            <div className="form-field">
              <label className="form-label" htmlFor="detailed-desc">
                Описание задания
              </label>
              <textarea
                id="detailed-desc"
                className="form-input"
                rows={4}
                value={selectedPage.detailed.description}
                onChange={(e) =>
                  handleDetailedFieldChange('description', e.target.value)
                }
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="detailed-answer">
                Ответ
              </label>
              <textarea
                id="detailed-answer"
                className="form-input"
                rows={4}
                value={selectedPage.detailed.answer}
                onChange={(e) =>
                  handleDetailedFieldChange('answer', e.target.value)
                }
              />
            </div>
            <div className="form-field">
              <label className="form-label">Тип ответа</label>
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <label>
                  <input
                    type="radio"
                    name="detailed-mode"
                    checked={selectedPage.detailed.answerMode === 'exact'}
                    onChange={() =>
                      handleDetailedFieldChange('answerMode', 'exact')
                    }
                  />{' '}
                  Точная формулировка
                </label>
                <label>
                  <input
                    type="radio"
                    name="detailed-mode"
                    checked={selectedPage.detailed.answerMode === 'prompt'}
                    onChange={() =>
                      handleDetailedFieldChange('answerMode', 'prompt')
                    }
                  />{' '}
                  Промт
                </label>
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: '1rem' }}>
          {pageError && (
            <div className="alert alert--error" style={{ marginBottom: '0.5rem' }}>
              {pageError}
            </div>
          )}
          {pageInfo && (
            <div className="alert alert--success" style={{ marginBottom: '0.5rem' }}>
              {pageInfo}
            </div>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSavePageContent}
          >
            Сохранить страницу
          </button>
        </div>
      </div>
    );
  };

  // --- Рендер страницы целиком ---

  if (isLoading) {
    return (
      <div className="container">
        <p>Загрузка курса…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container">
        <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
          {loadError}
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate('/courses')}
        >
          Вернуться к списку курсов
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container">
        <p>Курс не найден.</p>
      </div>
    );
  }

  const isPublished = course.status === 'published';
  const isArchived = course.status === 'archived';

  return (
    <div className="container">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>{course.title}</h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.15rem 0.6rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                border: '1px solid var(--color-border, #ddd)',
                background: 'var(--color-bg-subtle, #fafafa)',
              }}
            >
              Статус: {formatStatus(course.status)}
            </span>
            {user?.id && (
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                Автор (ID): {user.id}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/courses" className="btn btn-outline">
            ← К списку курсов
          </Link>
          {!isArchived && !isPublished && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePublishCourse}
            >
              Опубликовать курс
            </button>
          )}
          {isPublished && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpdatePublished}
            >
              Обновить опубликованную версию
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--color-border, #ddd)',
        }}
      >
        <button
          type="button"
          className={`btn btn-text ${
            activeTab === 'structure' ? 'btn-text--active' : ''
          }`}
          onClick={() => setActiveTab('structure')}
        >
          Структура и контент
        </button>
        <button
          type="button"
          className={`btn btn-text ${
            activeTab === 'versions' ? 'btn-text--active' : ''
          }`}
          onClick={() => setActiveTab('versions')}
        >
          Версии
        </button>
        <button
          type="button"
          className={`btn btn-text ${
            activeTab === 'settings' ? 'btn-text--active' : ''
          }`}
          onClick={() => setActiveTab('settings')}
        >
          Настройки и роли
        </button>
        <button
          type="button"
          className={`btn btn-text ${
            activeTab === 'preview' ? 'btn-text--active' : ''
          }`}
          onClick={() => setActiveTab('preview')}
        >
          Предпросмотр
        </button>
      </div>

      {activeTab === 'structure' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 320px) minmax(0, 1fr)',
            gap: '1.5rem',
          }}
        >
          {/* Левая колонка: структура */}
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Структура курса</h2>

            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                borderRadius: 4,
                border: '1px solid var(--color-border, #ddd)',
              }}
            >
              <div className="form-field">
                <label className="form-label" htmlFor="new-chapter">
                  Новая глава
                </label>
                <input
                  id="new-chapter"
                  className="form-input"
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Название главы"
                />
              </div>
              {newChapterError && (
                <div
                  className="form-error"
                  style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}
                >
                  {newChapterError}
                </div>
              )}
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleAddChapter}
              >
                Добавить главу
              </button>
            </div>

            {/* Новый урок в выбранной главе */}
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                borderRadius: 4,
                border: '1px solid var(--color-border, #ddd)',
              }}
            >
              <div className="form-field">
                <label className="form-label" htmlFor="new-lesson">
                  Новый урок в выбранной главе
                </label>
                <input
                  id="new-lesson"
                  className="form-input"
                  type="text"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  placeholder="Название урока"
                  disabled={!selectedChapterId}
                />
              </div>
              {newLessonError && (
                <div
                  className="form-error"
                  style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}
                >
                  {newLessonError}
                </div>
              )}
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleAddLesson}
                disabled={!selectedChapterId}
              >
                Добавить урок
              </button>
              {!selectedChapterId && (
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Сначала выберите или создайте главу, чтобы добавить в неё урок.
                </p>
              )}
            </div>

            {/* Новая страница в выбранном уроке */}
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                borderRadius: 4,
                border: '1px solid var(--color-border, #ddd)',
              }}
            >
              <div className="form-field">
                <label className="form-label" htmlFor="new-page-title">
                  Новая страница в выбранном уроке
                </label>
                <input
                  id="new-page-title"
                  className="form-input"
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Название страницы"
                  disabled={!selectedLessonId}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="new-page-type">
                  Тип страницы
                </label>
                <select
                  id="new-page-type"
                  className="form-input"
                  value={newPageType}
                  onChange={(e) =>
                    setNewPageType(e.target.value as PageKind)
                  }
                  disabled={!selectedLessonId}
                >
                  <option value="theory">Теоретический материал</option>
                  <option value="quiz">Тест</option>
                  <option value="code">Кодовое задание</option>
                  <option value="detailed">Задание с развернутым ответом</option>
                </select>
              </div>
              {newPageError && (
                <div
                  className="form-error"
                  style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}
                >
                  {newPageError}
                </div>
              )}
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleAddPage}
                disabled={!selectedLessonId}
              >
                Добавить страницу
              </button>
              {!selectedLessonId && (
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Сначала выберите или создайте урок, чтобы добавить в него страницу.
                </p>
              )}
            </div>

            {/* Список глав */}
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Главы курса</h3>
              {course.chapters.length === 0 && (
                <p style={{ fontSize: '0.9rem' }}>
                  Глав ещё нет. Создайте первую главу, чтобы начать структурировать курс.
                </p>
              )}
              {course.chapters.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {course.chapters.map((ch, index) => {
                    const isSelected = ch.id === selectedChapterId;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => handleSelectChapter(ch.id)}
                        className="btn btn-text"
                        style={{
                          justifyContent: 'flex-start',
                          borderRadius: 4,
                          border: '1px solid var(--color-border, #ddd)',
                          padding: '0.35rem 0.5rem',
                          background: isSelected
                            ? 'var(--color-bg-subtle, #f0f4ff)'
                            : 'transparent',
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        <span style={{ marginRight: '0.5rem', opacity: 0.7 }}>
                          Глава {index + 1}:
                        </span>
                        <span>{ch.title || 'Без названия'}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Редактирование выбранной главы */}
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Выбранная глава</h3>
              {!selectedChapter && (
                <p style={{ fontSize: '0.9rem' }}>
                  Выберите главу в списке выше, чтобы отредактировать её.
                </p>
              )}
              {selectedChapter && (
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: 4,
                    border: '1px solid var(--color-border, #ddd)',
                    marginBottom: '1rem',
                  }}
                >
                  <div className="form-field">
                    <label className="form-label" htmlFor="chapter-title-edit">
                      Название главы
                    </label>
                    <input
                      id="chapter-title-edit"
                      className="form-input"
                      type="text"
                      value={selectedChapter.title}
                      onChange={(e) =>
                        handleChapterTitleChange(
                          selectedChapter.id,
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label
                      className="form-label"
                      htmlFor="chapter-description-edit"
                    >
                      Описание главы (опционально)
                    </label>
                    <textarea
                      id="chapter-description-edit"
                      className="form-input"
                      rows={3}
                      value={selectedChapter.description || ''}
                      onChange={(e) =>
                        handleChapterDescriptionChange(
                          selectedChapter.id,
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleSaveChapter(selectedChapter.id)}
                  >
                    Сохранить главу
                  </button>
                </div>
              )}
            </div>

            {/* Уроки выбранной главы */}
            <div style={{ marginTop: '0.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Уроки главы</h3>
              {!selectedChapter && (
                <p style={{ fontSize: '0.9rem' }}>
                  Выберите главу, чтобы увидеть список уроков.
                </p>
              )}
              {selectedChapter && selectedChapter.lessons.length === 0 && (
                <p style={{ fontSize: '0.9rem' }}>
                  В этой главе пока нет уроков. Добавьте первый урок выше.
                </p>
              )}
              {selectedChapter && selectedChapter.lessons.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {selectedChapter.lessons.map((lesson, index) => {
                    const isSelected = lesson.id === selectedLessonId;
                    return (
                      <div
                        key={lesson.id}
                        style={{
                          borderRadius: 4,
                          border: '1px solid var(--color-border, #ddd)',
                          padding: '0.5rem',
                          background: isSelected
                            ? 'var(--color-bg-subtle, #f0f4ff)'
                            : 'transparent',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-text"
                            style={{ padding: 0 }}
                            onClick={() => handleSelectLesson(lesson.id)}
                          >
                            <span
                              style={{ marginRight: '0.5rem', opacity: 0.7 }}
                            >
                              Урок {index + 1}:
                            </span>
                            <span>{lesson.title || 'Без названия'}</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-text"
                            onClick={() => handleDeleteLesson(lesson.id)}
                          >
                            Удалить
                          </button>
                        </div>
                        {isSelected && (
                          <div className="form-field">
                            <label
                              className="form-label"
                              htmlFor={`lesson-title-${lesson.id}`}
                            >
                              Название урока
                            </label>
                            <input
                              id={`lesson-title-${lesson.id}`}
                              className="form-input"
                              type="text"
                              value={lesson.title}
                              onChange={(e) =>
                                handleLessonTitleChange(
                                  lesson.id,
                                  e.target.value,
                                )
                              }
                            />
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ marginTop: '0.35rem' }}
                              onClick={() => handleSaveLesson(lesson.id)}
                            >
                              Сохранить урок
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Страницы выбранного урока */}
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Страницы урока</h3>
              {!selectedLesson && (
                <p style={{ fontSize: '0.9rem' }}>
                  Выберите урок, чтобы увидеть список страниц.
                </p>
              )}
              {selectedLesson && selectedLesson.pages.length === 0 && (
                <p style={{ fontSize: '0.9rem' }}>
                  В этом уроке пока нет страниц. Добавьте страницу выше.
                </p>
              )}
              {selectedLesson && selectedLesson.pages.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}
                >
                  {selectedLesson.pages.map((page, index) => {
                    const isSelected = page.id === selectedPageId;
                    let kindLabel = '';
switch (page.kind) {
  case 'theory':
    kindLabel = 'Теория';
    break;
  case 'quiz':
    kindLabel = 'Тест';
    break;
  case 'code':
    kindLabel = 'Код';
    break;
  case 'detailed':
    kindLabel = 'Развёрнутый ответ';
    break;
}


                    return (
                      <div
                        key={page.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          borderRadius: 4,
                          border: '1px solid var(--color-border, #ddd)',
                          padding: '0.35rem 0.5rem',
                          background: isSelected
                            ? 'var(--color-bg-subtle, #f0f4ff)'
                            : 'transparent',
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-text"
                          style={{
                            padding: 0,
                            flex: 1,
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                          }}
                          onClick={() => handleSelectPage(page.id)}
                        >
                          <span>
                            {index + 1}. {page.title || 'Без названия'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              opacity: 0.7,
                              marginTop: '0.1rem',
                            }}
                          >
                            {kindLabel}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-text"
                          onClick={() => handleDeletePage(page.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Сообщения по публикации/ошибкам для этого таба */}
            {(publishError || publishInfo) && (
              <div style={{ marginTop: '1rem' }}>
                {publishError && (
                  <div
                    className="alert alert--error"
                    style={{ marginBottom: '0.5rem' }}
                  >
                    {publishError}
                  </div>
                )}
                {publishInfo && (
                  <div
                    className="alert alert--success"
                    style={{ marginBottom: '0.5rem' }}
                  >
                    {publishInfo}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Правая колонка: редактор страницы */}
          <div>{renderPageEditor()}</div>
        </div>
      )}

      {activeTab === 'versions' && (
        <div>
          <h2 style={{ marginBottom: '0.75rem' }}>Версии курса</h2>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
            Сохраняйте снимки состояния курса и при необходимости откатывайтесь к
            любой предыдущей версии.
          </p>

          <div
            style={{
              marginBottom: '1.5rem',
              padding: '0.75rem',
              borderRadius: 4,
              border: '1px solid var(--color-border, #ddd)',
            }}
          >
            <div className="form-field">
              <label className="form-label" htmlFor="version-comment">
                Комментарий к версии (опционально)
              </label>
              <input
                id="version-comment"
                className="form-input"
                type="text"
                value={versionComment}
                onChange={(e) => setVersionComment(e.target.value)}
                placeholder='Например: "Перед публикацией"'
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveVersion}
            >
              Сохранить версию
            </button>
            {versionsError && (
              <div
                className="alert alert--error"
                style={{ marginTop: '0.5rem' }}
              >
                {versionsError}
              </div>
            )}
            {versionsInfo && (
              <div
                className="alert alert--success"
                style={{ marginTop: '0.5rem' }}
              >
                {versionsInfo}
              </div>
            )}
          </div>

          <h3 style={{ marginBottom: '0.5rem' }}>История версий</h3>
          {course.versions.length === 0 && (
            <p style={{ fontSize: '0.9rem' }}>
              Версии ещё не сохранены. Создайте первую версию, когда завершите блок
              работы над курсом.
            </p>
          )}
          {course.versions.length > 0 && (
            <table
              className="table"
              style={{ width: '100%', borderCollapse: 'collapse' }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>
                    Метка
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>
                    Время создания
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>
                    Комментарий
                  </th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...course.versions]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((v) => (
                    <tr key={v.id}>
                      <td style={{ padding: '0.5rem' }}>
                        {v.label || `Версия ${v.id}`}
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        {new Date(v.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.5rem' }}>{v.comment || '—'}</td>
                      <td
                        style={{
                          padding: '0.5rem',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-text"
                          onClick={() =>
                            window.alert(
                              `Превью версии:\n\nМетка: ${
                                v.label || `Версия ${v.id}`
                              }\nСоздана: ${new Date(
                                v.createdAt,
                              ).toLocaleString()}\nКомментарий: ${
                                v.comment || '—'
                              }`,
                            )
                          }
                        >
                          Просмотреть
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleRestoreVersion(v)}
                          style={{ marginLeft: '0.5rem' }}
                        >
                          Восстановить эту версию
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr)',
            gap: '1.5rem',
          }}
        >
          {/* Левая колонка — мета и теги */}
          <div>
            <h2 style={{ marginBottom: '0.75rem' }}>Настройки курса</h2>

            {/* Основные данные курса */}
            <section
              style={{
                marginBottom: '1.5rem',
                padding: '0.75rem',
                borderRadius: 4,
                border: '1px solid var(--color-border, #ddd)',
              }}
            >
              <h3 style={{ marginBottom: '0.5rem' }}>Основная информация</h3>
              <form onSubmit={handleUpdateCourseMeta} noValidate>
                <div className="form-field">
                  <label className="form-label" htmlFor="course-title-edit">
                    Название курса
                  </label>
                  <input
                    id="course-title-edit"
                    className={`form-input ${
                      titleError ? 'form-input--error' : ''
                    }`}
                    type="text"
                    value={course.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                  />
                  {titleError && (
                    <div className="form-error">{titleError}</div>
                  )}
                </div>

                <div className="form-field">
                  <label
                    className="form-label"
                    htmlFor="course-description-edit"
                  >
                    Описание курса
                  </label>
                  <textarea
                    id="course-description-edit"
                    className={`form-input ${
                      descriptionError ? 'form-input--error' : ''
                    }`}
                    rows={4}
                    value={course.description}
                    onChange={(e) =>
                      handleDescriptionChange(e.target.value)
                    }
                  />
                  {descriptionError && (
                    <div className="form-error">{descriptionError}</div>
                  )}
                </div>

                <div className="form-field">
                  <label
                    className="form-label"
                    htmlFor="course-duration-edit"
                  >
                    Длительность (например, &quot;6 недель&quot;)
                  </label>
                  <input
                    id="course-duration-edit"
                    className="form-input"
                    type="text"
                    value={course.duration || ''}
                    onChange={(e) => handleDurationChange(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Сохранить основную информацию
                </button>
              </form>
            </section>

            {/* Теги курса */}
            <section
              style={{
                marginBottom: '1.5rem',
                padding: '0.75rem',
                borderRadius: 4,
                border: '1px solid var(--color-border, #ddd)',
              }}
            >
              <h3 style={{ marginBottom: '0.5rem' }}>Теги курса</h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Теги помогают студентам найти ваш курс в каталоге.
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <input
                  type="text"
                  className={`form-input ${
                    tagState.error ? 'form-input--error' : ''
                  }`}
                  value={tagState.tagInput}
                  onChange={(e) =>
                    setTagState((s) => ({
                      ...s,
                      tagInput: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Новый тег"
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleAddTag}
                >
                  Добавить тег
                </button>
              </div>
              {tagState.error && (
                <div className="form-error" style={{ marginBottom: '0.5rem' }}>
                  {tagState.error}
                </div>
              )}
              {course.tags.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  {course.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 999,
                        border: '1px solid var(--color-border, #ddd)',
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        className="btn btn-text"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {course.tags.length === 0 && (
                <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Пока нет тегов. Рекомендуется добавить хотя бы один.
                </p>
              )}
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleSaveTags}
              >
                Сохранить теги
              </button>
            </section>

            {(publishError || publishInfo) && (
              <section style={{ marginBottom: '1.5rem' }}>
                {publishError && (
                  <div
                    className="alert alert--error"
                    style={{ marginBottom: '0.5rem' }}
                  >
                    {publishError}
                  </div>
                )}
                {publishInfo && (
                  <div
                    className="alert alert--success"
                    style={{ marginBottom: '0.5rem' }}
                  >
                    {publishInfo}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Правая колонка — роли и управление курсом */}
          <div>
            {/* Соавторы и роли */}
            <section
              style={{
                marginBottom: '1.5rem',
                padding: '0.75rem',
                borderRadius: 4,
                border: '1px solid var(--color-border, #ddd)',
              }}
            >
              <h3 style={{ marginBottom: '0.5rem' }}>Соавторы и роли</h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Добавьте соавторов или модераторов по email. Для демо доступны
                пользователи: <code>coauthor@example.com</code> и{' '}
                <code>moderator@example.com</code>.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div className="form-field">
                  <label className="form-label" htmlFor="collab-email">
                    Email пользователя
                  </label>
                  <input
                    id="collab-email"
                    className="form-input"
                    type="email"
                    value={collabEmail}
                    onChange={(e) => setCollabEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="collab-role">
                    Роль
                  </label>
                  <select
                    id="collab-role"
                    className="form-input"
                    value={collabRole}
                    onChange={(e) =>
                      setCollabRole(e.target.value as 'author' | 'moderator')
                    }
                  >
                    <option value="author">Автор</option>
                    <option value="moderator">Модератор</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleAddCollaborator}
                >
                  Добавить соавтора
                </button>
                {collabError && (
                  <div
                    className="alert alert--error"
                    style={{ marginTop: '0.25rem' }}
                  >
                    {collabError}
                  </div>
                )}
                {collabInfo && (
                  <div
                    className="alert alert--success"
                    style={{ marginTop: '0.25rem' }}
                  >
                    {collabInfo}
                  </div>
                )}
              </div>

              <h4 style={{ marginBottom: '0.5rem' }}>Текущие соавторы</h4>
              {course.collaborators.length === 0 && (
                <p style={{ fontSize: '0.9rem' }}>
                  Соавторы пока не добавлены.
                </p>
              )}
              {course.collaborators.length > 0 && (
                <table
                  className="table"
                  style={{ width: '100%', borderCollapse: 'collapse' }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '0.35rem',
                          fontSize: '0.85rem',
                        }}
                      >
                        Имя / email
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '0.35rem',
                          fontSize: '0.85rem',
                        }}
                      >
                        Роль
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '0.35rem',
                          fontSize: '0.85rem',
                        }}
                      >
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.collaborators.map((c) => (
                      <tr key={c.id}>
                        <td
                          style={{
                            padding: '0.35rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div>{c.name || 'Без имени'}</div>
                          <div style={{ opacity: 0.8 }}>{c.email}</div>
                        </td>
                        <td
                          style={{
                            padding: '0.35rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          {c.role === 'author' ? 'Автор' : 'Модератор'}
                        </td>
                        <td
                          style={{
                            padding: '0.35rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          {c.isPending
                            ? 'Ожидает подтверждения'
                            : 'Активен'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Управление публикацией, архивацией и удалением */}
            <section
              style={{
                padding: '0.75rem',
                borderRadius: 4,
                border: '1px solid var(--color-border, #ddd)',
              }}
            >
              <h3 style={{ marginBottom: '0.5rem' }}>
                Публикация и статус курса
              </h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                Текущий статус: <strong>{formatStatus(course.status)}</strong>
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {!isPublished && !isArchived && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handlePublishCourse}
                  >
                    Опубликовать курс
                  </button>
                )}
                {isPublished && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleUpdatePublished}
                  >
                    Обновить опубликованную версию
                  </button>
                )}
                {!isArchived && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleArchiveCourse}
                  >
                    Архивировать курс
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleDeleteCourse}
                  style={{ borderColor: '#d33', color: '#d33' }}
                >
                  Удалить курс
                </button>
              </div>

              {(publishError || publishInfo) && (
                <div style={{ marginTop: '0.75rem' }}>
                  {publishError && (
                    <div
                      className="alert alert--error"
                      style={{ marginBottom: '0.5rem' }}
                    >
                      {publishError}
                    </div>
                  )}
                  {publishInfo && (
                    <div className="alert alert--success">
                      {publishInfo}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div>
          <h2 style={{ marginBottom: '0.75rem' }}>Предпросмотр курса</h2>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
            Здесь показано, как курс будет выглядеть для студента в текущем
            состоянии (черновик). Используйте навигацию слева, чтобы
            переключаться между уроками и страницами.
          </p>

          {course.chapters.length === 0 ? (
            <p>Структура курса ещё не создана — нет глав и уроков.</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(240px, 280px) minmax(0, 1fr)',
                gap: '1.5rem',
              }}
            >
              {/* Навигация по структуре */}
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 4,
                  border: '1px solid var(--color-border, #ddd)',
                }}
              >
                <h3 style={{ marginBottom: '0.5rem' }}>Навигация</h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    maxHeight: '24rem',
                    overflow: 'auto',
                  }}
                >
                  {course.chapters.map((ch, chIndex) => (
                    <div key={ch.id}>
                      <button
                        type="button"
                        className="btn btn-text"
                        style={{
                          padding: '0.15rem 0',
                          fontWeight:
                            ch.id === selectedChapterId ? 600 : 500,
                        }}
                        onClick={() => handleSelectChapter(ch.id)}
                      >
                        Глава {chIndex + 1}.{' '}
                        {ch.title || 'Без названия'}
                      </button>
                      {ch.id === selectedChapterId &&
                        ch.lessons.map((l, lIndex) => (
                          <div
                            key={l.id}
                            style={{
                              marginLeft: '0.75rem',
                              marginTop: '0.15rem',
                            }}
                          >
                            <button
                              type="button"
                              className="btn btn-text"
                              style={{
                                padding: '0.1rem 0',
                                fontWeight:
                                  l.id === selectedLessonId ? 600 : 400,
                              }}
                              onClick={() => handleSelectLesson(l.id)}
                            >
                              Урок {lIndex + 1}.{' '}
                              {l.title || 'Без названия'}
                            </button>
                            {l.id === selectedLessonId &&
                              l.pages.map((p, pIndex) => (
                                <div
                                  key={p.id}
                                  style={{
                                    marginLeft: '0.75rem',
                                    marginTop: '0.1rem',
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="btn btn-text"
                                    style={{
                                      padding: '0.05rem 0',
                                      fontSize: '0.85rem',
                                      fontWeight:
                                        p.id === selectedPageId
                                          ? 600
                                          : 400,
                                    }}
                                    onClick={() => handleSelectPage(p.id)}
                                  >
                                    {pIndex + 1}.{' '}
                                    {p.title || 'Без названия'}
                                  </button>
                                </div>
                              ))}
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Область предпросмотра */}
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 4,
                  border: '1px solid var(--color-border, #ddd)',
                }}
              >
                {!selectedChapter && (
                  <p>Выберите главу, урок и страницу для просмотра.</p>
                )}
                {selectedChapter && !selectedLesson && (
                  <p>Выберите урок в выбранной главе для просмотра.</p>
                )}
                {selectedChapter && selectedLesson && !selectedPage && (
                  <p>Выберите страницу в выбранном уроке для просмотра.</p>
                )}

                {selectedPage && (
                  <div>
                    <h3 style={{ marginBottom: '0.3rem' }}>
                      {selectedPage.title || 'Без названия'}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        opacity: 0.8,
                        marginBottom: '0.75rem',
                      }}
                    >
                      Глава:{' '}
                      <strong>
                        {selectedChapter?.title || 'Без названия'}
                      </strong>{' '}
                      · Урок:{' '}
                      <strong>
                        {selectedLesson?.title || 'Без названия'}
                      </strong>
                    </p>

                    {selectedPage.kind === 'theory' && (
                      <div>
                        {selectedPage.theory.mode === 'text' && (
                          <div>
                            <p
                              style={{
                                fontSize: '0.85rem',
                                opacity: 0.8,
                                marginBottom: '0.35rem',
                              }}
                            >
                              Теоретический материал (текст)
                            </p>
                            <div
                              style={{
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.5,
                              }}
                            >
                              {selectedPage.theory.text ||
                                'Текст не заполнен.'}
                            </div>
                          </div>
                        )}
                        {selectedPage.theory.mode === 'markdown' && (
                          <div>
                            <p
                              style={{
                                fontSize: '0.85rem',
                                opacity: 0.8,
                                marginBottom: '0.35rem',
                              }}
                            >
                              Теоретический материал (Markdown, без
                              рендеринга)
                            </p>
                            <pre
                              style={{
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                padding: '0.75rem',
                                borderRadius: 4,
                                border:
                                  '1px solid var(--color-border, #ddd)',
                                background:
                                  'var(--color-bg-subtle, #fafafa)',
                              }}
                            >
                              {selectedPage.theory.markdown ||
                                'Markdown содержимое не заполнено.'}
                            </pre>
                          </div>
                        )}
                        {selectedPage.theory.mode === 'video' && (
                          <div>
                            <p
                              style={{
                                fontSize: '0.85rem',
                                opacity: 0.8,
                                marginBottom: '0.35rem',
                              }}
                            >
                              Видео-материал
                            </p>
                            {selectedPage.theory.videoUrl ? (
                              <a
                                href={selectedPage.theory.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="app-nav__link"
                              >
                                Открыть видео
                              </a>
                            ) : (
                              <p>Ссылка на видео не указана.</p>
                            )}
                          </div>
                        )}
                        {selectedPage.theory.attachmentName && (
                          <p
                            style={{
                              fontSize: '0.85rem',
                              marginTop: '0.75rem',
                            }}
                          >
                            Прикреплённый материал:{' '}
                            <strong>
                              {selectedPage.theory.attachmentName}
                            </strong>{' '}
                            (
                            {Math.round(
                              (selectedPage.theory.attachmentSize ?? 0) /
                                1024,
                            )}{' '}
                            КБ)
                          </p>
                        )}
                      </div>
                    )}

                    {selectedPage.kind === 'quiz' && (
                      <div>
                        <p
                          style={{
                            fontSize: '0.85rem',
                            opacity: 0.8,
                            marginBottom: '0.35rem',
                          }}
                        >
                          Тестовое задание
                        </p>
                        <p style={{ marginBottom: '0.75rem' }}>
                          {selectedPage.quiz.question ||
                            'Текст вопроса не заполнен.'}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                          }}
                        >
                          {selectedPage.quiz.options.map((opt) => (
                            <label
                              key={opt.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                opacity: 0.9,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={opt.isCorrect}
                                disabled
                              />
                              <span>{opt.text || 'Пустой вариант'}</span>
                            </label>
                          ))}
                          {selectedPage.quiz.options.length === 0 && (
                            <p style={{ fontSize: '0.9rem' }}>
                              Варианты ответов не добавлены.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedPage.kind === 'code' && (
                      <div>
                        <p
                          style={{
                            fontSize: '0.85rem',
                            opacity: 0.8,
                            marginBottom: '0.35rem',
                          }}
                        >
                          Кодовое задание
                        </p>
                        <p style={{ marginBottom: '0.5rem' }}>
                          {selectedPage.code.description ||
                            'Описание задания не заполнено.'}
                        </p>
                        <p
                          style={{
                            fontSize: '0.85rem',
                            marginBottom: '0.75rem',
                          }}
                        >
                          Язык:{' '}
                          <strong>
                            {selectedPage.code.language || 'не выбран'}
                          </strong>
                        </p>
                        <h4 style={{ marginBottom: '0.5rem' }}>
                          Тестовые случаи
                        </h4>
                        {selectedPage.code.testCases.length === 0 && (
                          <p style={{ fontSize: '0.9rem' }}>
                            Тесты не добавлены.
                          </p>
                        )}
                        {selectedPage.code.testCases.length > 0 && (
                          <table
                            className="table"
                            style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                            }}
                          >
                            <thead>
                              <tr>
                                <th
                                  style={{
                                    textAlign: 'left',
                                    padding: '0.35rem',
                                  }}
                                >
                                  input
                                </th>
                                <th
                                  style={{
                                    textAlign: 'left',
                                    padding: '0.35rem',
                                  }}
                                >
                                  output
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedPage.code.testCases.map((tc) => (
                                <tr key={tc.id}>
                                  <td style={{ padding: '0.35rem' }}>
                                    <pre
                                      style={{
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                      }}
                                    >
                                      {tc.input}
                                    </pre>
                                  </td>
                                  <td style={{ padding: '0.35rem' }}>
                                    <pre
                                      style={{
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                      }}
                                    >
                                      {tc.output}
                                    </pre>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                    {selectedPage.kind === 'detailed' && (
                      <div>
                        <p
                          style={{
                            fontSize: '0.85rem',
                            opacity: 0.8,
                            marginBottom: '0.35rem',
                          }}
                        >
                          Задание с развёрнутым ответом
                        </p>
                        <p style={{ marginBottom: '0.75rem' }}>
                          {selectedPage.detailed.description ||
                            'Описание задания не заполнено.'}
                        </p>
                        <h4 style={{ marginBottom: '0.35rem' }}>Ожидаемый ответ</h4>
                        <div
                          style={{
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.5,
                            borderRadius: 4,
                            border: '1px solid var(--color-border, #ddd)',
                            padding: '0.75rem',
                            background: 'var(--color-bg-subtle, #fafafa)',
                          }}
                        >
                          {selectedPage.detailed.answer ||
                            'Ответ не заполнен.'}
                        </div>
                        <p
                          style={{
                            fontSize: '0.85rem',
                            marginTop: '0.75rem',
                          }}
                        >
                          Тип ответа:{' '}
                          <strong>
                            {selectedPage.detailed.answerMode === 'exact'
                              ? 'Точная формулировка'
                              : selectedPage.detailed.answerMode ===
                                'prompt'
                              ? 'Промт для проверки AI'
                              : 'не определён'}
                          </strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {(publishError || publishInfo) && (
            <div style={{ marginTop: '1rem' }}>
              {publishError && (
                <div
                  className="alert alert--error"
                  style={{ marginBottom: '0.5rem' }}
                >
                  {publishError}
                </div>
              )}
              {publishInfo && (
                <div className="alert alert--success">{publishInfo}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

