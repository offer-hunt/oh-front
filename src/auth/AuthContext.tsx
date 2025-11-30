import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

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
  // Внутренний метод для API клиента
  getAccessToken(): Promise<string | null>;
  // Метод для установки сессии из Callback (SSO)
  setSessionFromToken(accessToken: string, refreshToken: string): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function saveSessionToStorage(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function loadSessionFromStorage(): AuthSession | null {
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
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = loadSessionFromStorage();
    if (existing) {
      setSession(existing);
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    saveSessionToStorage(null);
  }, []);

  // Метод для получения актуального токена (с авто-рефрешем)
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!session) return null;

    // Здесь можно добавить проверку exp токена, если мы декодируем JWT.
    // Пока полагаемся на то, что клиент получит 401 и вызовет рефреш,
    // либо реализуем простую проверку, если есть expiresIn.
    
    // Для простоты возвращаем текущий, а рефреш делаем при 401 в useApi
    return session.accessToken;
  }, [session]);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (!session?.refreshToken) {
      logout();
      return null;
    }

    try {
      const tokens = await authApi.refreshToken(session.refreshToken);
      // После рефреша нужно обновить инфо о пользователе? Обычно нет, но можно.
      
      const newSession: AuthSession = {
        ...session,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
      };
      
      setSession(newSession);
      saveSessionToStorage(newSession);
      return tokens.access_token;
    } catch (e) {
      console.error('Failed to refresh token', e);
      logout();
      return null;
    }
  }, [session, logout]);

  // Экспортируем функцию рефреша через статический метод или через контекст
  // Но так как useApi вне компонента не работает, мы передадим функцию рефреша 
  // через контекст, а useApi будет её использовать.
  // Нюанс: useApi создается в компонентах.

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isLoading,
      error,
      async register(input: RegisterInput) {
        setError(null);
        setIsLoading(true);
        try {
          // 1. Регистрация
          await authApi.register(input);
          // 2. Автоматический вход
          const newSession = await authApi.loginWithEmail({
            email: input.email,
            password: input.password,
          });
          setSession(newSession);
          saveSessionToStorage(newSession);
        } catch (e) {
          const err = e as Error;
          if (err.message === 'EMAIL_EXISTS') {
            setError('Аккаунт с этим email уже зарегистрирован.');
          } else if (err.message === 'DB_UNAVAILABLE') {
            setError('Ошибка сервера. Попробуйте позже.');
          } else {
            setError('Не удалось завершить регистрацию. Проверьте данные.');
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
          const newSession = await authApi.loginWithEmail(input);
          setSession(newSession);
          saveSessionToStorage(newSession);
        } catch (e) {
          const err = e as Error;
          if (err.message.includes('bad credentials') || err.message.includes('user not found')) {
            setError('Неверный email или пароль.');
          } else {
            setError('Ошибка входа. Попробуйте позже.');
          }
          throw e;
        } finally {
          setIsLoading(false);
        }
      },
      async loginWithProvider(provider) {
        // Это инициирует редирект, поэтому setIsLoading(false) не ставим сразу
        setError(null);
        setIsLoading(true); 
        await authApi.oauthLogin(provider);
      },
      logout,
      async requestPasswordRecovery(email: string) {
        // ... (implementation same as previous, dependent on authApi support)
        setError(null);
        try {
          await authApi.requestPasswordRecovery(email);
        } catch (e) {
          setError('Ошибка отправки.');
          throw e;
        }
      },
      async resetPassword(input: PasswordResetInput) {
        // ...
        setError(null);
        try {
          await authApi.resetPassword(input);
        } catch (e) {
          setError('Ошибка сброса пароля.');
          throw e;
        }
      },
      // Методы для useApi
      getAccessToken,
      async setSessionFromToken(accessToken, refreshToken) {
        setIsLoading(true);
        try {
          const user = await authApi.getMe(accessToken);
          const newSession: AuthSession = {
            user: { ...user, provider: 'google' }, // Provider условно, т.к. из /me он не приходит явно пока
            accessToken,
            refreshToken,
          };
          setSession(newSession);
          saveSessionToStorage(newSession);
        } catch (e) {
          setError('Ошибка получения данных профиля.');
          logout();
        } finally {
          setIsLoading(false);
        }
      }
    }),
    [session, isLoading, error, logout, getAccessToken]
  );

  // Хак для проброса функции refresh в api client, если он вне React дерева
  // Но лучше делать useApi внутри компонентов.
  // Для обработки 401 нам нужно иметь доступ к refreshSession.
  // Мы можем расширить контекст, добавив метод refreshSession,
  // который useApi сможет вызывать.
  
  // Добавляем refreshSession в value (через cast, т.к. его нет в публичном интерфейсе для компонентов, но нужен для useApi)
  return (
    <AuthContext.Provider value={{ ...value, refreshSession } as any}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}