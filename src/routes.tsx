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

import App from './App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },

      // Страница выбора способа входа (сценарий #1)
      { path: 'login', element: <Login /> }, // Login просто ре-экспорт AuthPage
      { path: 'login/chooser', element: <AuthPage /> },

      // Отдельные сценарии
      { path: 'login/email', element: <LoginEmailPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'password/recovery', element: <PasswordRecoveryPage /> },
      { path: 'password/reset/:token', element: <PasswordResetPage /> },

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
