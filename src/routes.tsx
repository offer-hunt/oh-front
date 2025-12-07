import { createBrowserRouter } from 'react-router-dom';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import Forbidden from '@/pages/Forbidden';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Protected from '@/pages/Protected';
import Callback from '@/pages/Callback';
import AuthErrorPage from '@/pages/AuthErrorPage';

import AuthPage from '@/auth/pages/AuthPage';
import RegisterPage from '@/auth/pages/RegisterPage';
import LoginEmailPage from '@/auth/pages/LoginEmailPage';
import PasswordRecoveryPage from '@/auth/pages/PasswordRecoveryPage';
import PasswordResetPage from '@/auth/pages/PasswordResetPage';

import CoursesPage from '@/pages/CoursesPage';
import CourseCreatePage from '@/pages/CourseCreatePage';
import CourseEditorPage from '@/pages/CourseEditorPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import AuthorProfilePage from '@/pages/AuthorProfilePage';
import ProfilePage from '@/pages/ProfilePage';

import App from './App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },

      // Auth Routes
      { path: 'login', element: <Login /> },
      { path: 'login/chooser', element: <AuthPage /> },
      { path: 'login/email', element: <LoginEmailPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'password/recovery', element: <PasswordRecoveryPage /> },
      
      // ИСПРАВЛЕНО: Убрали /:token, теперь маршрут ловит и ?token=...
      { path: 'password/reset', element: <PasswordResetPage /> },
      // На случай если токен все-таки придет через слэш (опционально)
      { path: 'password/reset/:token', element: <PasswordResetPage /> },
      
      // SSO Callback & Errors
      { path: 'auth/callback', element: <Callback /> },
      { path: 'auth/error', element: <AuthErrorPage /> },

      // Public Catalog Routes
      { path: 'catalog/:courseId', element: <CourseDetailPage /> },
      { path: 'authors/:authorId', element: <AuthorProfilePage /> },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },

      // Protected Courses (для авторов)
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