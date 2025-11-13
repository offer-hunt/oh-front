import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { authApi } from './api';
import type {
  AuthProviderType,
  AuthSession,
  AuthUser,
  LoginInput,
  PasswordResetInput,
  RegisterInput,
} from './types';

const STORAGE_KEY = 'oh-front-auth-session';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  register(input: RegisterInput): Promise<void>;
  loginWithEmail(input: LoginInput): Promise<void>;
  loginWithProvider(provider: Exclude<AuthProviderType, 'password'>): Promise<void>;
  logout(): void;
  requestPasswordRecovery(email: string): Promise<void>;
  resetPassword(input: PasswordResetInput): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function saveSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function loadSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = loadSession();
    if (existing) {
      setUser(existing.user);
    }
    setIsLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      error,
      async register(input: RegisterInput) {
        setError(null);
        setIsLoading(true);
        try {
          const session = await authApi.register(input);
          setUser(session.user);
          saveSession(session);
        } catch (e) {
          const err = e as Error;
          if (err.message === 'EMAIL_EXISTS') {
            setError('Аккаунт с этим email уже зарегистрирован.');
          } else if (err.message === 'SERVER_ERROR') {
            setError('Ошибка сервера. Попробуйте позже.');
          } else {
            setError('Не удалось завершить регистрацию.');
          }
          throw e;
        } finally {
          setIsLoading(false);
        }
      },
      async loginWithEmail(input: LoginInput) {
        setError(null);
        setIsLoading(true);
        try {
          const session = await authApi.loginWithEmail(input);
          setUser(session.user);
          saveSession(session);
        } catch (e) {
          const err = e as Error;
          if (err.message === 'SERVER_ERROR') {
            setError('Ошибка сервера. Попробуйте позже.');
          } else if (err.message === 'NO_USER' || err.message === 'PASSWORD_MISMATCH') {
            setError('Неверный email или пароль.');
          } else {
            setError('Не удалось выполнить вход.');
          }
          throw e;
        } finally {
          setIsLoading(false);
        }
      },
      async loginWithProvider(provider) {
        setError(null);
        setIsLoading(true);
        try {
          const session = await authApi.oauthLogin(provider);
          setUser(session.user);
          saveSession(session);
        } catch (e) {
          const err = e as Error;
          if (err.message === 'ACCESS_DENIED') {
            setError(
              provider === 'google'
                ? 'Ошибка входа через Google.'
                : 'Ошибка входа через GitHub.',
            );
          } else if (err.message === 'DB_ERROR' || err.message === 'INSERT_ERROR') {
            setError('Ошибка сервера. Попробуйте позже.');
          } else {
            setError('Не удалось выполнить вход через OAuth.');
          }
          throw e;
        } finally {
          setIsLoading(false);
        }
      },
      logout() {
        setUser(null);
        saveSession(null);
      },
      async requestPasswordRecovery(email: string) {
        setError(null);
        setIsLoading(true);
        try {
          await authApi.requestPasswordRecovery(email);
        } catch (e) {
          const err = e as Error;
          if (err.message === 'DB_ERROR') {
            setError('Ошибка сервера. Попробуйте позже.');
          } else {
            setError('Не удалось отправить письмо для восстановления.');
          }
          throw e;
        } finally {
          setIsLoading(false);
        }
      },
      async resetPassword(input: PasswordResetInput) {
        setError(null);
        setIsLoading(true);
        try {
          await authApi.resetPassword(input);
        } catch (e) {
          const err = e as Error;
          if (err.message === 'INVALID_TOKEN') {
            setError('Ссылка недействительна или устарела.');
          } else if (err.message === 'DB_ERROR') {
            setError('Ошибка сервера. Попробуйте позже.');
          } else {
            setError('Не удалось обновить пароль.');
          }
          throw e;
        } finally {
          setIsLoading(false);
        }
      },
    }),
    [user, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
