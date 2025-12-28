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
    {
      id: generateId('course'),
      ownerId: 'author_1',
      author: {
        id: 'author_1',
        name: 'Александр Петров',
        email: 'alex@example.com',
      },
      title: 'TypeScript: Полное руководство',
      description: 'Углубленное изучение TypeScript. Типы, интерфейсы, дженерики, декораторы и продвинутые паттерны. Практические задания и проекты.',
      duration: '25 часов',
      tags: ['TypeScript', 'JavaScript', 'Middle', 'Senior', 'Web'],
      status: 'published',
      accessType: 'public',
      enrollmentsCount: 0,
      createdAt: now,
      updatedAt: now,
      chapters: [
        {
          id: generateId('chapter'),
          title: 'Основы TypeScript',
          description: 'Введение в типизацию и базовые концепции',
          lessons: [
            {
              id: generateId('lesson'),
              title: 'Что такое TypeScript',
              isDemoAvailable: true,
              pages: [
                {
                  id: generateId('page'),
                  title: 'Введение в TypeScript',
                  kind: 'theory',
                  theory: {
                    mode: 'markdown',
                    markdown: `# Что такое TypeScript?

TypeScript — это **надмножество JavaScript**, которое добавляет статическую типизацию и другие возможности для создания масштабируемых приложений.

## Почему TypeScript?

TypeScript решает несколько ключевых проблем JavaScript:

1. **Статическая типизация** — ошибки выявляются на этапе разработки
2. **Автодополнение в IDE** — повышенная продуктивность разработчика
3. **Рефакторинг** — безопасное изменение кода
4. **Документация** — типы служат документацией к коду

> TypeScript компилируется в чистый JavaScript, что позволяет использовать его везде, где работает JS.

## Пример кода

\`\`\`typescript
// JavaScript
function greet(name) {
  return "Hello, " + name;
}

// TypeScript
function greet(name: string): string {
  return \`Hello, \${name}\`;
}

greet("World"); // ✅ OK
greet(123);     // ❌ Error: Argument of type 'number' is not assignable to parameter of type 'string'
\`\`\`

### Основные возможности

- **Примитивные типы**: \`string\`, \`number\`, \`boolean\`, \`null\`, \`undefined\`
- **Сложные типы**: \`array\`, \`tuple\`, \`enum\`, \`object\`
- **Специальные типы**: \`any\`, \`unknown\`, \`never\`, \`void\`
- **Union и Intersection типы**
- **Type Guards и Type Assertions**

## Установка

\`\`\`bash
npm install -g typescript
tsc --version
\`\`\`

---

**Готовы начать?** Перейдём к практике! 🚀`,
                    videoUrl: 'https://example.com/typescript-intro.mp4',
                    attachments: [
                      {
                        id: generateId('file'),
                        name: 'TypeScript-Cheatsheet.pdf',
                        size: 245678,
                        type: 'application/pdf',
                      },
                      {
                        id: generateId('file'),
                        name: 'tsconfig-examples.zip',
                        size: 12345,
                        type: 'application/zip',
                      },
                    ],
                  },
                },
                {
                  id: generateId('page'),
                  title: 'Проверка знаний: Основы',
                  kind: 'quiz',
                  quiz: {
                    question: 'Какие преимущества даёт TypeScript по сравнению с JavaScript?',
                    options: [
                      {
                        id: generateId('option'),
                        text: 'Статическая типизация помогает находить ошибки на этапе разработки',
                        isCorrect: true,
                      },
                      {
                        id: generateId('option'),
                        text: 'TypeScript работает быстрее, чем JavaScript',
                        isCorrect: false,
                      },
                      {
                        id: generateId('option'),
                        text: 'Улучшенное автодополнение и подсказки в IDE',
                        isCorrect: true,
                      },
                      {
                        id: generateId('option'),
                        text: 'TypeScript не компилируется в JavaScript',
                        isCorrect: false,
                      },
                    ],
                  },
                },
              ],
            },
            {
              id: generateId('lesson'),
              title: 'Базовые типы',
              isDemoAvailable: false,
              pages: [
                {
                  id: generateId('page'),
                  title: 'Примитивные типы данных',
                  kind: 'theory',
                  theory: {
                    mode: 'markdown',
                    markdown: `# Примитивные типы данных

TypeScript поддерживает все примитивные типы JavaScript плюс дополнительные типы для типизации.

## Основные примитивы

### String (строки)

\`\`\`typescript
let name: string = "Alice";
let greeting: string = \`Hello, \${name}!\`;
\`\`\`

### Number (числа)

\`\`\`typescript
let age: number = 25;
let price: number = 99.99;
let hex: number = 0xf00d;
let binary: number = 0b1010;
\`\`\`

### Boolean (логический тип)

\`\`\`typescript
let isActive: boolean = true;
let hasPermission: boolean = false;
\`\`\`

### Array (массивы)

\`\`\`typescript
let numbers: number[] = [1, 2, 3, 4, 5];
let names: Array<string> = ["Alice", "Bob", "Charlie"];
\`\`\`

## Специальные типы

### Any

Тип \`any\` отключает проверку типов. **Используйте осторожно!**

\`\`\`typescript
let data: any = "hello";
data = 42;        // OK
data = true;      // OK
\`\`\`

### Unknown

Безопасная альтернатива \`any\`. Требует проверки типа перед использованием.

\`\`\`typescript
let value: unknown = "test";

if (typeof value === "string") {
  console.log(value.toUpperCase()); // OK
}
\`\`\`

### Void

Используется для функций, которые ничего не возвращают.

\`\`\`typescript
function log(message: string): void {
  console.log(message);
}
\`\`\`

> **Совет**: Избегайте использования \`any\` в production коде. Это убивает все преимущества TypeScript!`,
                  },
                },
                {
                  id: generateId('page'),
                  title: 'Задача: Типизация функции',
                  kind: 'code',
                  code: {
                    description: 'Напишите функцию `calculateTotal`, которая принимает массив чисел и возвращает их сумму. Добавьте правильную типизацию для параметров и возвращаемого значения.',
                    language: 'typescript',
                    testCases: [
                      {
                        id: generateId('testcase'),
                        input: '[1, 2, 3, 4, 5]',
                        output: '15',
                      },
                      {
                        id: generateId('testcase'),
                        input: '[10, 20, 30]',
                        output: '60',
                      },
                      {
                        id: generateId('testcase'),
                        input: '[]',
                        output: '0',
                      },
                      {
                        id: generateId('testcase'),
                        input: '[100]',
                        output: '100',
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
        {
          id: generateId('chapter'),
          title: 'Интерфейсы и типы',
          description: 'Работа с пользовательскими типами',
          lessons: [
            {
              id: generateId('lesson'),
              title: 'Интерфейсы',
              isDemoAvailable: false,
              pages: [
                {
                  id: generateId('page'),
                  title: 'Определение интерфейсов',
                  kind: 'theory',
                  theory: {
                    mode: 'markdown',
                    markdown: `# Интерфейсы в TypeScript

Интерфейсы позволяют описывать структуру объектов и контракты для классов.

## Базовый синтаксис

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;        // опциональное свойство
  readonly role: string; // только для чтения
}

const user: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  role: "admin"
};
\`\`\`

## Расширение интерфейсов

\`\`\`typescript
interface Person {
  name: string;
  age: number;
}

interface Employee extends Person {
  employeeId: number;
  department: string;
}

const employee: Employee = {
  name: "Bob",
  age: 30,
  employeeId: 12345,
  department: "Engineering"
};
\`\`\`

## Индексные сигнатуры

\`\`\`typescript
interface Dictionary {
  [key: string]: string;
}

const translations: Dictionary = {
  hello: "привет",
  world: "мир"
};
\`\`\`

## Интерфейсы функций

\`\`\`typescript
interface MathOperation {
  (a: number, b: number): number;
}

const add: MathOperation = (a, b) => a + b;
const multiply: MathOperation = (a, b) => a * b;
\`\`\``,
                  },
                },
                {
                  id: generateId('page'),
                  title: 'Тест: Интерфейсы',
                  kind: 'quiz',
                  quiz: {
                    question: 'Что из перечисленного верно относительно интерфейсов в TypeScript?',
                    options: [
                      {
                        id: generateId('option'),
                        text: 'Интерфейсы могут расширять другие интерфейсы',
                        isCorrect: true,
                      },
                      {
                        id: generateId('option'),
                        text: 'Интерфейсы существуют в runtime коде',
                        isCorrect: false,
                      },
                      {
                        id: generateId('option'),
                        text: 'Свойства с модификатором readonly нельзя изменить после инициализации',
                        isCorrect: true,
                      },
                      {
                        id: generateId('option'),
                        text: 'Интерфейсы не могут описывать функции',
                        isCorrect: false,
                      },
                    ],
                  },
                },
                {
                  id: generateId('page'),
                  title: 'Объясните разницу',
                  kind: 'detailed',
                  detailed: {
                    description: 'Объясните своими словами, в чём основное различие между интерфейсами (interface) и типами (type) в TypeScript. Когда следует использовать interface, а когда type? Приведите примеры.',
                    answer: '',
                    answerMode: 'prompt',
                  },
                },
              ],
            },
            {
              id: generateId('lesson'),
              title: 'Type Aliases',
              isDemoAvailable: false,
              pages: [
                {
                  id: generateId('page'),
                  title: 'Псевдонимы типов',
                  kind: 'theory',
                  theory: {
                    mode: 'markdown',
                    markdown: `# Type Aliases (Псевдонимы типов)

Type aliases позволяют создавать новые имена для типов.

## Базовое использование

\`\`\`typescript
type ID = string | number;
type Point = { x: number; y: number };
type Callback = (result: string) => void;

let userId: ID = "user_123";
let coords: Point = { x: 10, y: 20 };
\`\`\`

## Union Types

\`\`\`typescript
type Status = "pending" | "approved" | "rejected";
type Response = string | number | boolean | null;

let orderStatus: Status = "pending";
\`\`\`

## Intersection Types

\`\`\`typescript
type Person = { name: string; age: number };
type Employee = { employeeId: number; department: string };
type Staff = Person & Employee;

const staff: Staff = {
  name: "Alice",
  age: 30,
  employeeId: 12345,
  department: "IT"
};
\`\`\`

## Mapped Types

\`\`\`typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Partial<T> = {
  [P in keyof T]?: T[P];
};
\`\`\``,
                  },
                },
              ],
            },
          ],
        },
        {
          id: generateId('chapter'),
          title: 'Дженерики',
          description: 'Универсальные типы и обобщенное программирование',
          lessons: [
            {
              id: generateId('lesson'),
              title: 'Введение в дженерики',
              isDemoAvailable: false,
              pages: [
                {
                  id: generateId('page'),
                  title: 'Что такое дженерики',
                  kind: 'theory',
                  theory: {
                    mode: 'markdown',
                    markdown: `# Дженерики (Generics)

Дженерики позволяют создавать переиспользуемые компоненты, которые работают с различными типами.

## Функции с дженериками

\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}

let output1 = identity<string>("hello");
let output2 = identity<number>(42);
let output3 = identity("inferred"); // тип выводится автоматически
\`\`\`

## Обобщенные интерфейсы

\`\`\`typescript
interface Box<T> {
  value: T;
}

let stringBox: Box<string> = { value: "hello" };
let numberBox: Box<number> = { value: 42 };
\`\`\`

## Ограничения дженериков

\`\`\`typescript
interface Lengthwise {
  length: number;
}

function logLength<T extends Lengthwise>(arg: T): void {
  console.log(arg.length);
}

logLength("hello");        // OK
logLength([1, 2, 3]);      // OK
logLength({ length: 10 }); // OK
logLength(42);             // Error: number не имеет свойства length
\`\`\`

## Обобщенные классы

\`\`\`typescript
class DataStore<T> {
  private data: T[] = [];

  add(item: T): void {
    this.data.push(item);
  }

  get(index: number): T {
    return this.data[index];
  }
}

const numberStore = new DataStore<number>();
numberStore.add(1);
numberStore.add(2);

const stringStore = new DataStore<string>();
stringStore.add("hello");
\`\`\``,
                  },
                },
                {
                  id: generateId('page'),
                  title: 'Задача: Обобщенная функция',
                  kind: 'code',
                  code: {
                    description: 'Создайте обобщенную функцию `getFirstElement<T>`, которая принимает массив типа T[] и возвращает первый элемент или undefined, если массив пустой.',
                    language: 'typescript',
                    testCases: [
                      {
                        id: generateId('testcase'),
                        input: '[1, 2, 3]',
                        output: '1',
                      },
                      {
                        id: generateId('testcase'),
                        input: '["a", "b", "c"]',
                        output: '"a"',
                      },
                      {
                        id: generateId('testcase'),
                        input: '[]',
                        output: 'undefined',
                      },
                    ],
                  },
                },
                {
                  id: generateId('page'),
                  title: 'Тест: Дженерики',
                  kind: 'quiz',
                  quiz: {
                    question: 'Что делают дженерики в TypeScript?',
                    options: [
                      {
                        id: generateId('option'),
                        text: 'Позволяют создавать переиспользуемые компоненты с различными типами',
                        isCorrect: true,
                      },
                      {
                        id: generateId('option'),
                        text: 'Ускоряют выполнение кода',
                        isCorrect: false,
                      },
                      {
                        id: generateId('option'),
                        text: 'Обеспечивают безопасность типов при работе с универсальными структурами',
                        isCorrect: true,
                      },
                      {
                        id: generateId('option'),
                        text: 'Существуют только на уровне компилятора',
                        isCorrect: true,
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
        {
          id: generateId('chapter'),
          title: 'Продвинутые концепции',
          description: 'Декораторы, утилиты типов и паттерны',
          lessons: [
            {
              id: generateId('lesson'),
              title: 'Utility Types',
              isDemoAvailable: false,
              pages: [
                {
                  id: generateId('page'),
                  title: 'Встроенные утилиты',
                  kind: 'theory',
                  theory: {
                    mode: 'markdown',
                    markdown: `# Utility Types

TypeScript предоставляет набор встроенных утилит для трансформации типов.

## Partial<T>

Делает все свойства опциональными:

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; }

function updateUser(id: number, updates: Partial<User>) {
  // можем обновить только нужные поля
}
\`\`\`

## Required<T>

Делает все свойства обязательными:

\`\`\`typescript
interface Config {
  host?: string;
  port?: number;
}

type RequiredConfig = Required<Config>;
// { host: string; port: number; }
\`\`\`

## Pick<T, K>

Выбирает указанные свойства:

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

type PublicUser = Pick<User, "id" | "name" | "email">;
// { id: number; name: string; email: string; }
\`\`\`

## Omit<T, K>

Исключает указанные свойства:

\`\`\`typescript
type UserWithoutPassword = Omit<User, "password">;
// { id: number; name: string; email: string; }
\`\`\`

## Record<K, T>

Создаёт объект с ключами K и значениями T:

\`\`\`typescript
type PageInfo = Record<string, { title: string; url: string }>;

const pages: PageInfo = {
  home: { title: "Home", url: "/" },
  about: { title: "About", url: "/about" }
};
\`\`\``,
                  },
                },
                {
                  id: generateId('page'),
                  title: 'Практика: Utility Types',
                  kind: 'detailed',
                  detailed: {
                    description: 'Опишите реальный сценарий использования хотя бы трёх Utility Types (Partial, Pick, Omit, Record и т.д.). Объясните, как они помогают решить конкретную задачу в вашем коде.',
                    answer: '',
                    answerMode: 'prompt',
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
