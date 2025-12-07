import { saveCourses } from './storage';
import type { Course } from './types';
import { generateId } from './storage';

// Создает тестовые курсы для демонстрации каталога
export function seedCourses() {
  const now = new Date().toISOString();

  const courses: Course[] = [
    {
      id: generateId('course'),
      ownerId: 'author_1',
      author: {
        id: 'author_1',
        name: 'Александр Петров',
        email: 'alex@example.com',
      },
      title: 'Основы JavaScript для начинающих',
      description: 'Изучите основы JavaScript с нуля. Переменные, функции, циклы, объекты и многое другое.',
      duration: '10 часов',
      tags: ['JavaScript', 'Junior', 'Web'],
      status: 'published',
      accessType: 'public',
      enrollmentsCount: 0,
      createdAt: now,
      updatedAt: now,
      chapters: [
        {
          id: generateId('chapter'),
          title: 'Введение в JavaScript',
          description: 'Основные концепции языка',
          lessons: [
            {
              id: generateId('lesson'),
              title: 'Что такое JavaScript',
              isDemoAvailable: true,
              pages: [
                {
                  id: generateId('page'),
                  title: 'История JavaScript',
                  kind: 'theory',
                  theory: {
                    mode: 'text',
                    text: 'JavaScript был создан в 1995 году...',
                  },
                },
              ],
            },
            {
              id: generateId('lesson'),
              title: 'Переменные и типы данных',
              isDemoAvailable: false,
              pages: [
                {
                  id: generateId('page'),
                  title: 'let, const, var',
                  kind: 'theory',
                  theory: {
                    mode: 'text',
                    text: 'В JavaScript есть три способа объявления переменных...',
                  },
                },
              ],
            },
          ],
        },
      ],
      collaborators: [],
      versions: [],
      cover: null,
    },
    {
      id: generateId('course'),
      ownerId: 'author_1',
      author: {
        id: 'author_1',
        name: 'Александр Петров',
        email: 'alex@example.com',
      },
      title: 'React: От новичка до профессионала',
      description: 'Полный курс по React.js. Компоненты, хуки, состояние, роутинг и лучшие практики.',
      duration: '20 часов',
      tags: ['React', 'TypeScript', 'Middle', 'Web'],
      status: 'published',
      accessType: 'public',
      enrollmentsCount: 0,
      createdAt: now,
      updatedAt: now,
      chapters: [
        {
          id: generateId('chapter'),
          title: 'Основы React',
          lessons: [
            {
              id: generateId('lesson'),
              title: 'Введение в React',
              isDemoAvailable: true,
              pages: [
                {
                  id: generateId('page'),
                  title: 'Что такое React',
                  kind: 'theory',
                  theory: {
                    mode: 'text',
                    text: 'React - это библиотека для создания пользовательских интерфейсов...',
                  },
                },
              ],
            },
          ],
        },
      ],
      collaborators: [],
      versions: [],
      cover: null,
    },
    {
      id: generateId('course'),
      ownerId: 'author_2',
      author: {
        id: 'author_2',
        name: 'Мария Иванова',
        email: 'maria@example.com',
      },
      title: 'Python для анализа данных',
      description: 'Научитесь использовать Python для работы с данными. Pandas, NumPy, Matplotlib и машинное обучение.',
      duration: '15 часов',
      tags: ['Python', 'Data Science', 'Middle'],
      status: 'published',
      accessType: 'public',
      enrollmentsCount: 0,
      createdAt: now,
      updatedAt: now,
      chapters: [
        {
          id: generateId('chapter'),
          title: 'Введение в Python',
          lessons: [
            {
              id: generateId('lesson'),
              title: 'Основы Python',
              isDemoAvailable: true,
              pages: [
                {
                  id: generateId('page'),
                  title: 'Синтаксис Python',
                  kind: 'theory',
                  theory: {
                    mode: 'text',
                    text: 'Python - это высокоуровневый язык программирования...',
                  },
                },
              ],
            },
          ],
        },
      ],
      collaborators: [],
      versions: [],
      cover: null,
    },
    {
      id: generateId('course'),
      ownerId: 'author_2',
      author: {
        id: 'author_2',
        name: 'Мария Иванова',
        email: 'maria@example.com',
      },
      title: 'Docker и Kubernetes: Контейнеризация приложений',
      description: 'Изучите Docker и Kubernetes с нуля. Создание контейнеров, оркестрация и деплой приложений.',
      duration: '12 часов',
      tags: ['Docker', 'Kubernetes', 'DevOps', 'Middle'],
      status: 'published',
      accessType: 'public',
      enrollmentsCount: 0,
      createdAt: now,
      updatedAt: now,
      chapters: [
        {
          id: generateId('chapter'),
          title: 'Основы Docker',
          lessons: [
            {
              id: generateId('lesson'),
              title: 'Введение в Docker',
              isDemoAvailable: true,
              pages: [
                {
                  id: generateId('page'),
                  title: 'Что такое контейнеры',
                  kind: 'theory',
                  theory: {
                    mode: 'text',
                    text: 'Контейнеры - это легковесная альтернатива виртуальным машинам...',
                  },
                },
              ],
            },
          ],
        },
      ],
      collaborators: [],
      versions: [],
      cover: null,
    },
    {
      id: generateId('course'),
      ownerId: 'author_3',
      author: {
        id: 'author_3',
        name: 'Дмитрий Сидоров',
        email: 'dmitry@example.com',
      },
      title: 'Node.js и Express: Создание RESTful API',
      description: 'Создайте полноценный backend на Node.js. Express, базы данных, авторизация и деплой.',
      duration: '18 часов',
      tags: ['Node.js', 'JavaScript', 'Backend', 'Middle'],
      status: 'published',
      accessType: 'public',
      enrollmentsCount: 0,
      createdAt: now,
      updatedAt: now,
      chapters: [
        {
          id: generateId('chapter'),
          title: 'Введение в Node.js',
          lessons: [
            {
              id: generateId('lesson'),
              title: 'Что такое Node.js',
              isDemoAvailable: true,
              pages: [
                {
                  id: generateId('page'),
                  title: 'Основы Node.js',
                  kind: 'theory',
                  theory: {
                    mode: 'text',
                    text: 'Node.js позволяет запускать JavaScript на сервере...',
                  },
                },
              ],
            },
          ],
        },
      ],
      collaborators: [],
      versions: [],
      cover: null,
    },
    {
      id: generateId('course'),
      ownerId: 'author_3',
      author: {
        id: 'author_3',
        name: 'Дмитрий Сидоров',
        email: 'dmitry@example.com',
      },
      title: 'PostgreSQL: От основ к оптимизации',
      description: 'Полное руководство по PostgreSQL. SQL запросы, индексы, транзакции и производительность.',
      duration: '14 часов',
      tags: ['PostgreSQL', 'SQL', 'Database', 'Middle'],
      status: 'published',
      accessType: 'public',
      enrollmentsCount: 0,
      createdAt: now,
      updatedAt: now,
      chapters: [
        {
          id: generateId('chapter'),
          title: 'Основы SQL',
          lessons: [
            {
              id: generateId('lesson'),
              title: 'SELECT запросы',
              isDemoAvailable: true,
              pages: [
                {
                  id: generateId('page'),
                  title: 'Базовые SELECT запросы',
                  kind: 'theory',
                  theory: {
                    mode: 'text',
                    text: 'SELECT используется для выборки данных из таблиц...',
                  },
                },
              ],
            },
          ],
        },
      ],
      collaborators: [],
      versions: [],
      cover: null,
    },
  ];

  saveCourses(courses);
  console.log(`Добавлено ${courses.length} тестовых курсов`);
}

// Удобная функция для вызова из консоли браузера
if (typeof window !== 'undefined') {
  (window as any).seedCourses = seedCourses;
}
