import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import type { AuthoredCourse, LearningCourse, UserProfile } from '@/profile/api';
import { profileApi } from '@/profile/api';

const passwordStrength = (value: string) => {
  const rules = [
    /.{8,}/,
    /[A-Z]/,
    /[a-z]/,
    /\d/,
    /[^A-Za-z0-9]/,
  ];

  return rules.every((rule) => rule.test(value));
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [formState, setFormState] = useState({
    name: '',
    bio: '',
  });
  const [isDirty, setIsDirty] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<'profile' | 'learning' | 'authored'>('profile');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedAuthoredId, setSelectedAuthoredId] = useState<string | null>(null);

  const [learningSearch, setLearningSearch] = useState('');
  const [learningFilter, setLearningFilter] = useState<'all' | 'in_progress' | 'completed' | 'not_started'>('all');
  const [learningSort, setLearningSort] = useState<'date_desc' | 'date_asc' | 'progress_desc' | 'progress_asc'>('date_desc');

  const [authoredSearch, setAuthoredSearch] = useState('');
  const [authoredFilter, setAuthoredFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [authoredSort, setAuthoredSort] = useState<'students_desc' | 'students_asc' | 'date_desc' | 'date_asc'>('date_desc');
  const [learningCourses, setLearningCourses] = useState<LearningCourse[]>([]);
  const [learningLoading, setLearningLoading] = useState(true);
  const [learningError, setLearningError] = useState<string | null>(null);

  const [authoredCourses, setAuthoredCourses] = useState<AuthoredCourse[]>([]);
  const [authoredLoading, setAuthoredLoading] = useState(true);
  const [authoredError, setAuthoredError] = useState<string | null>(null);

  const hasAuthoredCourses = authoredCourses.length > 0;

  useEffect(() => {
    let cancelled = false;
    setProfileLoading(true);
    profileApi
      .getProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setFormState({ name: data.name, bio: data.bio || '' });
        setAvatarPreview(data.avatarUrl);
        setProfileError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setProfileError(err.message || 'Не удалось загрузить профиль. Попробуйте позже');
      })
      .finally(() => {
        if (cancelled) return;
        setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLearningLoading(true);
    profileApi
      .getLearningCourses()
      .then((data) => {
        if (cancelled) return;
        setLearningCourses(data);
        setLearningError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setLearningError(err.message || 'Не удалось загрузить данные о прогрессе. Попробуйте позже');
      })
      .finally(() => {
        if (cancelled) return;
        setLearningLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAuthoredLoading(true);
    profileApi
      .getAuthoredCourses()
      .then((data) => {
        if (cancelled) return;
        setAuthoredCourses(data);
        setAuthoredError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setAuthoredError(err.message || 'Не удалось загрузить данные о курсах. Попробуйте позже');
      })
      .finally(() => {
        if (cancelled) return;
        setAuthoredLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredLearning = useMemo(() => {
    const search = learningSearch.trim().toLowerCase();
    const filtered = learningCourses.filter((course) => {
      const matchSearch = !search || course.title.toLowerCase().includes(search);
      const matchStatus = learningFilter === 'all' ? true : course.status === learningFilter;
      return matchSearch && matchStatus;
    });

    return filtered.sort((a, b) => {
      if (learningSort === 'date_desc') {
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      }
      if (learningSort === 'date_asc') {
        return new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime();
      }
      if (learningSort === 'progress_desc') {
        return b.progress - a.progress;
      }
      return a.progress - b.progress;
    });
  }, [learningCourses, learningFilter, learningSearch, learningSort]);

  const filteredAuthored = useMemo(() => {
    const search = authoredSearch.trim().toLowerCase();
    const filtered = authoredCourses.filter((course) => {
      const matchSearch = !search || course.title.toLowerCase().includes(search);
      const matchStatus = authoredFilter === 'all' ? true : course.status === authoredFilter;
      return matchSearch && matchStatus;
    });

    return filtered.sort((a, b) => {
      if (authoredSort === 'students_desc') return b.students - a.students;
      if (authoredSort === 'students_asc') return a.students - b.students;
      if (authoredSort === 'date_asc')
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [authoredCourses, authoredFilter, authoredSearch, authoredSort]);

  const learningStats = useMemo(() => {
    const total = learningCourses.length;
    const completed = learningCourses.filter((c) => c.status === 'completed').length;
    const inProgress = learningCourses.filter((c) => c.status === 'in_progress').length;
    const tasksDone = learningCourses.reduce((sum, c) => sum + (c.tasksCompleted || 0), 0);
    return { total, completed, inProgress, tasksDone };
  }, [learningCourses]);

  const authoredStats = useMemo(() => {
    const total = authoredCourses.length;
    const published = authoredCourses.filter((c) => c.status === 'published').length;
    const students = authoredCourses.reduce((sum, c) => sum + c.students, 0);
    const avgRating =
      authoredCourses.reduce((sum, c) => sum + (c.rating || 0), 0) /
      (authoredCourses.filter((c) => c.rating).length || 1);

    return { total, published, students, avgRating: Number.isFinite(avgRating) ? avgRating : 0 };
  }, [authoredCourses]);

  const selectedCourse = filteredLearning.find((c) => c.id === selectedCourseId);
  const selectedAuthored = filteredAuthored.find((c) => c.id === selectedAuthoredId);

  const nameTooLong = formState.name.length > 50;
  const bioTooLong = formState.bio.length > 500;

  const handleProfileChange = (field: 'name' | 'bio', value: string) => {
    setProfileMessage(null);
    setProfileError(null);
    setFormState((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSaveProfile = async () => {
    setProfileMessage(null);
    setProfileError(null);

    if (!formState.name.trim()) {
      setProfileError('Имя не может быть пустым');
      console.log('Profile update failed - empty name');
      return;
    }

    if (nameTooLong || bioTooLong) return;

    if (!profile) return;

    setProfileSaving(true);
    try {
      const updated = await profileApi.updateProfile({
        name: formState.name.trim(),
        bio: formState.bio.trim(),
      });
      setProfile(updated);
      setAvatarPreview(updated.avatarUrl);
      setIsDirty(false);
      setProfileMessage('Изменения сохранены');
      console.log('Profile updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось сохранить изменения. Попробуйте позже';
      setProfileError(message);
      console.log('Profile update failed - server error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setAvatarError('Неверный формат файла. Поддерживаются JPG, PNG, WEBP');
      console.log('Avatar upload failed - invalid format');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setAvatarError('Размер файла не должен превышать 5 МБ');
      console.log('Avatar upload failed - file too large');
      return;
    }

    setAvatarLoading(true);

    try {
      const url = await profileApi.uploadAvatar(file);
      setAvatarPreview(url);
      setProfile((prev) => (prev ? { ...prev, avatarUrl: url } : prev));
      setAvatarError(null);
      setProfileMessage('Аватар обновлен');
      console.log('Avatar updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить аватар. Попробуйте позже';
      setAvatarError(message);
      console.log('Avatar upload failed - server error');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAvatarDelete = async () => {
    const confirmed = window.confirm('Вы уверены, что хотите удалить аватар?');
    if (!confirmed) return;
    setAvatarLoading(true);
    try {
      await profileApi.deleteAvatar();
      setAvatarPreview(undefined);
      setProfile((prev) => (prev ? { ...prev, avatarUrl: undefined } : prev));
      setProfileMessage('Аватар удален');
      console.log('Avatar deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось удалить аватар. Попробуйте позже';
      setAvatarError(message);
      console.log('Avatar deletion failed - server error');
    } finally {
      setAvatarLoading(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordForm({ current: '', next: '', confirm: '' });
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const handlePasswordSave = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.current.trim()) {
      setPasswordError('Текущий пароль неверный');
      console.log('Password change failed - incorrect current password');
      return;
    }

    if (!passwordStrength(passwordForm.next)) {
      setPasswordError('Пароль слишком простой. Добавьте цифры, символы или заглавные буквы');
      return;
    }

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    setPasswordSaving(true);
    try {
      await profileApi.changePassword({
        current: passwordForm.current.trim(),
        next: passwordForm.next.trim(),
      });
      setPasswordSuccess('Пароль успешно изменен');
      console.log('Password changed');
      setTimeout(() => {
        setPasswordModalOpen(false);
        resetPasswordForm();
      }, 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось изменить пароль. Попробуйте позже';
      setPasswordError(message);
      console.log('Password change failed - server error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const isPasswordValid =
    passwordForm.current.trim().length > 0 &&
    passwordStrength(passwordForm.next) &&
    passwordForm.confirm === passwordForm.next;

  const learningStatusLabel: Record<LearningCourse['status'], string> = {
    in_progress: 'В процессе',
    completed: 'Завершен',
    not_started: 'Не начат',
  };

  const authoredStatusLabel: Record<AuthoredCourse['status'], string> = {
    published: 'Опубликован',
    draft: 'Черновик',
    archived: 'Архивирован',
  };

  if (profileLoading && !profile) {
    return (
      <div className="page-section">
        <div className="container">Загрузка профиля...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-section">
        <div className="container">
          <p className="text-danger">{profileError || 'Не удалось загрузить профиль. Попробуйте позже'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-section">
        <div className="container">
          <div className="profile-header">
            <div className="profile-header__left">
              <div className="profile-avatar">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={profile.name} />
                ) : (
                  <div className="profile-avatar__placeholder">{profile.name[0]}</div>
                )}
              </div>
              <div>
                <p className="eyebrow">Личный кабинет</p>
                <h1>{profile.name}</h1>
                <p className="text-secondary">{profile.email}</p>
              </div>
            </div>
            <div className="profile-header__actions">
              <button className="btn btn-ghost" onClick={() => setPasswordModalOpen(true)}>
                Изменить пароль
              </button>
              <Link to="/courses/new" className="btn btn-primary">
                Создать курс
              </Link>
            </div>
          </div>

          <div className="profile-tabs">
            <button
              className={`profile-tab ${activeTab === 'profile' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Профиль
            </button>
            <button
              className={`profile-tab ${activeTab === 'learning' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveTab('learning');
                console.log('Learning progress page opened');
              }}
            >
              Мое обучение
            </button>
            {hasAuthoredCourses && (
              <button
                className={`profile-tab ${activeTab === 'authored' ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTab('authored');
                  console.log('My courses page opened');
                }}
              >
                Мои курсы
              </button>
            )}
          </div>

          {activeTab === 'profile' && (
            <div className="profile-grid">
              <div className="page-content">
                <div className="section-header">
                  <div>
                    <p className="eyebrow">Персональные данные</p>
                    <h2>Профиль</h2>
                  </div>
                  <div className="profile-actions">
                    <label className="btn btn-ghost">
                      {avatarLoading ? 'Загрузка...' : 'Изменить аватар'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleAvatarUpload}
                        disabled={avatarLoading}
                      />
                    </label>
                    <button className="btn btn-ghost" onClick={handleAvatarDelete} disabled={avatarLoading}>
                      Удалить аватар
                    </button>
                  </div>
                </div>

                {avatarError && <div className="alert alert-danger">{avatarError}</div>}
                {profileMessage && <div className="alert alert-success">{profileMessage}</div>}
                {profileError && <div className="alert alert-danger">{profileError}</div>}

                <div className="form-grid">
                  <div className="form-control">
                    <label>Имя</label>
                    <input
                      value={formState.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                      placeholder="Ваше имя"
                      className={nameTooLong ? 'has-error' : ''}
                    />
                    <div className="field-meta">
                      <span className="text-secondary">Можно менять в любой момент</span>
                      <span className="text-secondary">{formState.name.length}/50</span>
                    </div>
                    {nameTooLong && <p className="error-text">Имя не может быть длиннее 50 символов</p>}
                  </div>

                  <div className="form-control">
                    <label>Email</label>
                    <input value={profile.email} disabled />
                    <div className="field-meta">
                      <span className="text-secondary">Поле нельзя изменить</span>
                    </div>
                  </div>

                  <div className="form-control form-control--wide">
                    <label>О себе</label>
                    <textarea
                      rows={4}
                      value={formState.bio}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      className={bioTooLong ? 'has-error' : ''}
                      placeholder="Расскажите о своем опыте, интересах и целях в обучении"
                    />
                    <div className="field-meta">
                      <span className="text-secondary">Опциональное поле</span>
                      <span className="text-secondary">{formState.bio.length}/500</span>
                    </div>
                    {bioTooLong && <p className="error-text">Описание не может быть длиннее 500 символов</p>}
                  </div>
                </div>

                <div className="profile-footer">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveProfile}
                    disabled={!isDirty || nameTooLong || bioTooLong || profileSaving}
                  >
                    {profileSaving ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </div>
              </div>

              <div className="page-content">
                <div className="section-header">
                  <div>
                    <p className="eyebrow">Безопасность</p>
                    <h2>Смена пароля</h2>
                  </div>
                  <button className="btn btn-outline" onClick={() => setPasswordModalOpen(true)}>
                    Изменить пароль
                  </button>
                </div>

                <p className="text-secondary" style={{ marginBottom: '1rem' }}>
                  Добавьте буквы разного регистра, цифры и спецсимволы, чтобы повысить сложность пароля.
                </p>
                <div className="password-rules">
                  <span>Минимум 8 символов</span>
                  <span>Заглавные и строчные буквы</span>
                  <span>Цифры и спецсимволы</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'learning' && (
            <div className="page-content">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Статистика</p>
                  <h2>Мое обучение</h2>
                  <p className="text-secondary">Всего курсов: {learningStats.total}. Завершено: {learningStats.completed}.</p>
                </div>
                <div className="chip-row">
                  <span className="ai-badge">Записан: {learningStats.total}</span>
                  <span className="ai-badge">В процессе: {learningStats.inProgress}</span>
                  <span className="ai-badge">Завершено: {learningStats.completed}</span>
                  <span className="ai-badge">Заданий выполнено: {learningStats.tasksDone}</span>
                </div>
              </div>

              {learningError && <div className="alert alert-danger">{learningError}</div>}

              {learningLoading ? (
                <p>Загрузка данных о прогрессе...</p>
              ) : (
                <>
                  <div className="filters-row">
                    <input
                      placeholder="Поиск по названию"
                      value={learningSearch}
                      onChange={(e) => setLearningSearch(e.target.value)}
                    />
                    <select value={learningFilter} onChange={(e) => setLearningFilter(e.target.value as typeof learningFilter)}>
                      <option value="all">Все</option>
                      <option value="in_progress">В процессе</option>
                      <option value="completed">Завершенные</option>
                      <option value="not_started">Не начатые</option>
                    </select>
                    <select value={learningSort} onChange={(e) => setLearningSort(e.target.value as typeof learningSort)}>
                      <option value="date_desc">По дате активности (новые)</option>
                      <option value="date_asc">По дате активности (старые)</option>
                      <option value="progress_desc">По прогрессу (убыв.)</option>
                      <option value="progress_asc">По прогрессу (возр.)</option>
                    </select>
                  </div>

                  {filteredLearning.length === 0 ? (
                    <div className="empty-state">
                      <p>У вас пока нет активных курсов</p>
                      <Link to="/" className="btn btn-primary">Перейти к каталогу курсов</Link>
                      {learningCourses.length === 0 && (
                        <p className="text-secondary">Learning progress page opened - no courses</p>
                      )}
                    </div>
                  ) : (
                    <div className="cards-grid">
                      {filteredLearning.map((course) => (
                        <article key={course.id} className="course-card" onClick={() => setSelectedCourseId(course.id)}>
                          <div className="course-card__header">
                            <div>
                              <p className="eyebrow">{course.author}</p>
                              <h3>{course.title}</h3>
                            </div>
                            <span className={`status-chip status-${course.status}`}>
                              {learningStatusLabel[course.status]}
                            </span>
                          </div>
                          <div className="progress-row">
                            <div className="progress-bar">
                              <span style={{ width: `${course.progress}%` }} />
                            </div>
                            <span className="text-secondary">{course.progress}%</span>
                          </div>
                          <div className="course-card__meta">
                            <span>Последняя активность: {course.lastActivity}</span>
                            {course.lastLesson && <span>Последний урок: {course.lastLesson}</span>}
                            <span>
                              {course.tasksCompleted}/{course.tasksTotal} заданий
                            </span>
                          </div>
                          <div className="course-card__actions">
                            <button className="btn btn-outline">{course.progress > 0 ? 'Продолжить обучение' : 'Начать курс'}</button>
                            <span className="link-muted">Детали прогресса →</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}

              {selectedCourse && (
                <div className="page-content" style={{ marginTop: '1.5rem' }}>
                  <div className="section-header">
                    <div>
                      <p className="eyebrow">Детальный прогресс</p>
                      <h3>{selectedCourse.title}</h3>
                    </div>
                    <button className="btn btn-ghost" onClick={() => setSelectedCourseId(null)}>
                      Закрыть
                    </button>
                  </div>
                  <div className="stat-grid">
                    <div className="stat-card">
                      <p className="eyebrow">Общий прогресс</p>
                      <h3>{selectedCourse.progress}%</h3>
                    </div>
                    <div className="stat-card">
                      <p className="eyebrow">Уроки</p>
                      <p>
                        {selectedCourse.tasksCompleted}/{selectedCourse.tasksTotal} выполнено
                      </p>
                    </div>
                    <div className="stat-card">
                      <p className="eyebrow">Средний балл</p>
                      <p>{selectedCourse.averageScore}%</p>
                    </div>
                    <div className="stat-card">
                      <p className="eyebrow">Кодовые задачи</p>
                      <p>{selectedCourse.codingTasksSolved} решено</p>
                    </div>
                  </div>

                  <div className="chapters">
                    {(selectedCourse.chapters || []).map((chapter) => (
                      <div key={chapter.title} className="chapter-row">
                        <div>
                          <p className="eyebrow">Глава</p>
                          <p>{chapter.title}</p>
                        </div>
                        <div className="progress-bar">
                          <span style={{ width: `${chapter.progress}%` }} />
                        </div>
                        <span className="text-secondary">{chapter.progress}%</span>
                      </div>
                    ))}
                  </div>

                  <div className="course-card__actions" style={{ marginTop: '1rem' }}>
                    <button className="btn btn-primary">Продолжить обучение</button>
                    <button className="btn btn-ghost">Отписаться от курса</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'authored' && (
            <div className="page-content">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Аналитика</p>
                  <h2>Мои курсы</h2>
                  <p className="text-secondary">
                    Всего: {authoredStats.total} · Опубликовано: {authoredStats.published} · Студентов: {authoredStats.students}
                  </p>
                </div>
                <div className="chip-row">
                  <span className="ai-badge">Средний рейтинг: {authoredStats.avgRating.toFixed(1) || '—'}</span>
                  <span className="ai-badge">Активные за неделю: {authoredCourses.reduce((sum, c) => sum + (c.activeStudents || 0), 0)}</span>
                </div>
              </div>

              {authoredError && <div className="alert alert-danger">{authoredError}</div>}

              {authoredLoading ? (
                <p>Загрузка данных о ваших курсах...</p>
              ) : (
                <>

              <div className="filters-row">
                <input
                  placeholder="Поиск по названию"
                  value={authoredSearch}
                  onChange={(e) => setAuthoredSearch(e.target.value)}
                />
                <select value={authoredFilter} onChange={(e) => setAuthoredFilter(e.target.value as typeof authoredFilter)}>
                  <option value="all">Все</option>
                  <option value="published">Опубликованные</option>
                  <option value="draft">Черновики</option>
                  <option value="archived">Архивированные</option>
                </select>
                <select value={authoredSort} onChange={(e) => setAuthoredSort(e.target.value as typeof authoredSort)}>
                  <option value="date_desc">По обновлению (новые)</option>
                  <option value="date_asc">По обновлению (старые)</option>
                  <option value="students_desc">По студентам (убыв.)</option>
                  <option value="students_asc">По студентам (возр.)</option>
                </select>
              </div>

              {filteredAuthored.length === 0 ? (
                <div className="empty-state">
                  <p>Вы еще не создали ни одного курса</p>
                  <Link to="/courses/new" className="btn btn-primary">Создать первый курс</Link>
                  <p className="text-secondary">My courses page opened - no courses</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {filteredAuthored.map((course) => (
                    <article key={course.id} className="course-card" onClick={() => setSelectedAuthoredId(course.id)}>
                      <div className="course-card__header">
                        <div>
                          <p className="eyebrow">{course.status === 'published' ? 'Опубликован' : 'Черновик / Архив'}</p>
                          <h3>{course.title}</h3>
                        </div>
                        <span className={`status-chip status-${course.status}`}>
                          {authoredStatusLabel[course.status]}
                        </span>
                      </div>
                      <div className="course-card__meta">
                        <span>Студентов: {course.students}</span>
                        <span>Средний прогресс: {course.averageProgress}%</span>
                        <span>Обновлено: {course.updatedAt}</span>
                      </div>
                      <div className="course-card__actions">
                        <button className="btn btn-outline">Редактировать</button>
                        <button className="btn btn-ghost">Просмотр статистики</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {selectedAuthored && (
                <div className="page-content" style={{ marginTop: '1.5rem' }}>
                  <div className="section-header">
                    <div>
                      <p className="eyebrow">Детальная статистика</p>
                      <h3>{selectedAuthored.title}</h3>
                    </div>
                    <button className="btn btn-ghost" onClick={() => setSelectedAuthoredId(null)}>
                      Закрыть
                    </button>
                  </div>

                  <div className="stat-grid">
                    <div className="stat-card">
                      <p className="eyebrow">Студенты</p>
                      <h3>{selectedAuthored.students}</h3>
                      <p className="text-secondary">Активные: {selectedAuthored.activeStudents ?? '—'}</p>
                    </div>
                    <div className="stat-card">
                      <p className="eyebrow">Средний прогресс</p>
                      <h3>{selectedAuthored.averageProgress}%</h3>
                      <p className="text-secondary">Завершили: {selectedAuthored.completionRate ?? '—'}%</p>
                    </div>
                    <div className="stat-card">
                      <p className="eyebrow">Уроки и главы</p>
                      <p>
                        {selectedAuthored.totalChapters || '—'} глав · {selectedAuthored.lessons || '—'} уроков
                      </p>
                    </div>
                    <div className="stat-card">
                      <p className="eyebrow">Средний тестовый балл</p>
                      <p>{selectedAuthored.averageTestScore ?? '—'}%</p>
                      <p className="text-secondary">Кодовые задачи: {selectedAuthored.codingSuccess ?? '—'}%</p>
                    </div>
                  </div>

                  <div className="chapters">
                    <div>
                      <p className="eyebrow">Самые популярные уроки</p>
                      {(selectedAuthored.popularLessons || []).map((lesson) => (
                        <div key={lesson.title} className="chapter-row">
                          <p>{lesson.title}</p>
                          <span className="text-secondary">{lesson.views} просмотров</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="eyebrow">Сложные уроки</p>
                      {(selectedAuthored.hardestLessons || []).map((lesson) => (
                        <div key={lesson.title} className="chapter-row">
                          <p>{lesson.title}</p>
                          <span className="text-secondary">Завершение: {lesson.completion}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              </>
            )}
          </div>
        )}
        </div>
      </div>

      {passwordModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal__header">
              <div>
                <p className="eyebrow">Безопасность</p>
                <h3>Изменить пароль</h3>
              </div>
              <button onClick={() => { setPasswordModalOpen(false); resetPasswordForm(); }}>×</button>
            </div>

            {passwordError && <div className="alert alert-danger">{passwordError}</div>}
            {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}

            <div className="form-control">
              <label>Текущий пароль</label>
              <input
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, current: e.target.value }))}
                placeholder="Введите текущий пароль"
              />
            </div>

            <div className="form-control">
              <label>Новый пароль</label>
              <input
                type="password"
                value={passwordForm.next}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, next: e.target.value }))}
                placeholder="Новый пароль"
                className={passwordForm.next ? (passwordStrength(passwordForm.next) ? '' : 'has-error') : ''}
              />
              {passwordForm.next && !passwordStrength(passwordForm.next) && (
                <p className="error-text">Пароль слишком простой. Добавьте цифры, символы или заглавные буквы</p>
              )}
            </div>

            <div className="form-control">
              <label>Подтверждение нового пароля</label>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))}
                placeholder="Повторите пароль"
                className={passwordForm.confirm ? (passwordForm.confirm === passwordForm.next ? '' : 'has-error') : ''}
              />
              {passwordForm.confirm && passwordForm.confirm !== passwordForm.next && (
                <p className="error-text">Пароли не совпадают</p>
              )}
            </div>

            <div className="modal__footer">
              <button className="btn btn-ghost" onClick={() => { setPasswordModalOpen(false); resetPasswordForm(); }}>
                Отмена
              </button>
              <button className="btn btn-primary" disabled={!isPasswordValid || passwordSaving} onClick={handlePasswordSave}>
                {passwordSaving ? 'Сохранение...' : 'Сохранить новый пароль'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
