import { createBrowserRouter } from 'react-router-dom';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import Forbidden from '@/pages/Forbidden';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Protected from '@/pages/Protected';

import AuthPage from '@/auth/pages/AuthPage';
import RegisterPage from '@/auth/pages/RegisterPage';
import LoginEmailPage from '@/auth/pages/LoginEmailPage';
import PasswordRecoveryPage from '@/auth/pages/PasswordRecoveryPage';
import PasswordResetPage from '@/auth/pages/PasswordResetPage';

import CoursesPage from '@/pages/CoursesPage';
import CourseCreatePage from '@/pages/CourseCreatePage';
import CourseEditorPage from '@/pages/CourseEditorPage';

import App from './App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },

      // Страница выбора способа входа
      { path: 'login', element: <Login /> }, // Login = AuthPage
      { path: 'login/chooser', element: <AuthPage /> },

      // Отдельные сценарии авторизации
      { path: 'login/email', element: <LoginEmailPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'password/recovery', element: <PasswordRecoveryPage /> },
      { path: 'password/reset/:token', element: <PasswordResetPage /> },

      // --- Курсы ---
      {
        path: 'courses',
        element: (
          <ProtectedRoute>
            <CoursesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'courses/new',
        element: (
          <ProtectedRoute>
            <CourseCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'courses/:courseId',
        element: (
          <ProtectedRoute>
            <CourseEditorPage />
          </ProtectedRoute>
        ),
      },

      // Прогресс (старый защищённый маршрут)
      {
        path: 'protected',
        element: (
          <ProtectedRoute>
            <Protected />
          </ProtectedRoute>
        ),
      },

      { path: 'forbidden', element: <Forbidden /> },
    ],
  },
]);
