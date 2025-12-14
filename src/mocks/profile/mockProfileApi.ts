import type {
  AuthoredCourse,
  LearningCourse,
  PasswordChangeInput,
  ProfileApi,
  ProfileUpdateInput,
  UserProfile,
} from '@/profile/api';

const delay = <T>(value: T, ms = 300) => new Promise<T>(resolve => setTimeout(() => resolve(value), ms));

let profile: UserProfile = {
  name: 'Екатерина Иванова',
  email: 'katya@example.com',
  bio: 'Автор курсов по Data Science. Люблю ML, визуализации и помогать студентам находить инсайты в данных.',
  avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
};

let learningCourses: LearningCourse[] = [
  {
    id: 'ds-101',
    title: 'Основы Data Science',
    author: 'AI-Hunt Team',
    progress: 78,
    status: 'in_progress',
    lastActivity: '2024-10-03',
    lastLesson: 'Градиентный бустинг',
    tasksCompleted: 14,
    tasksTotal: 18,
    chapters: [
      { title: 'Введение', progress: 100 },
      { title: 'Предобработка данных', progress: 85 },
      { title: 'Модели', progress: 70 },
    ],
    averageScore: 88,
    codingTasksSolved: 9,
  },
  {
    id: 'ml-advanced',
    title: 'Продвинутый ML',
    author: 'Мария Соколова',
    progress: 100,
    status: 'completed',
    lastActivity: '2024-09-21',
    lastLesson: 'Финальный проект',
    tasksCompleted: 22,
    tasksTotal: 22,
    chapters: [
      { title: 'Нейронные сети', progress: 100 },
      { title: 'Генеративные модели', progress: 100 },
    ],
    averageScore: 94,
    codingTasksSolved: 14,
  },
  {
    id: 'prompt-101',
    title: 'Инженерия промптов',
    author: 'AI-Hunt Studio',
    progress: 0,
    status: 'not_started',
    lastActivity: '2024-08-12',
    tasksCompleted: 0,
    tasksTotal: 8,
    chapters: [
      { title: 'Основы', progress: 0 },
      { title: 'Практика', progress: 0 },
    ],
    averageScore: 0,
    codingTasksSolved: 0,
  },
];

let authoredCourses: AuthoredCourse[] = [
  {
    id: 'viz-pro',
    title: 'Визуализация данных в Python',
    status: 'published',
    students: 248,
    averageProgress: 62,
    createdAt: '2024-03-02',
    updatedAt: '2024-10-01',
    rating: 4.8,
    lessons: 34,
    publishedAt: '2024-04-15',
    totalChapters: 8,
    popularLessons: [
      { title: 'Matplotlib Basics', views: 1240 },
      { title: 'Plotly Express', views: 980 },
    ],
    hardestLessons: [
      { title: 'Анимации', completion: 54 },
      { title: '3D графика', completion: 48 },
    ],
    averageTestScore: 89,
    codingSuccess: 76,
    activeStudents: 120,
    completionRate: 58,
  },
  {
    id: 'ml-prod',
    title: 'ML в продакшене',
    status: 'draft',
    students: 0,
    averageProgress: 0,
    createdAt: '2024-08-20',
    updatedAt: '2024-09-05',
    lessons: 18,
    totalChapters: 5,
  },
];

const mockProfileApi: ProfileApi = {
  async getProfile() {
    return delay(profile);
  },
  async updateProfile(payload: ProfileUpdateInput) {
    profile = { ...profile, ...payload };
    return delay(profile);
  },
  async uploadAvatar(file: File) {
    // Для фронтового мока просто генерируем data URL
    const url = URL.createObjectURL(file);
    profile = { ...profile, avatarUrl: url };
    return delay(url);
  },
  async deleteAvatar() {
    profile = { ...profile, avatarUrl: undefined };
    return delay(undefined);
  },
  async changePassword(payload: PasswordChangeInput) {
    if (payload.current !== 'correct-password') {
      throw new Error('Текущий пароль неверный');
    }
    return delay(undefined);
  },
  async getLearningCourses() {
    return delay(learningCourses);
  },
  async getLearningDetails(courseId: string) {
    return delay(learningCourses.find(course => course.id === courseId) ?? null);
  },
  async getAuthoredCourses() {
    return delay(authoredCourses);
  },
  async getAuthoredCourseDetails(courseId: string) {
    return delay(authoredCourses.find(course => course.id === courseId) ?? null);
  },
};

export { mockProfileApi };
