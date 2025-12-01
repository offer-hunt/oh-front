import type { AuthApi, AuthSession, AuthUser, TokenResponse } from './types';
import { mockAuthApi } from '@/mocks/auth/mockAuthApi';

const USE_MOCKS = (import.meta.env.VITE_AUTH_USE_MOCKS as string | undefined) === 'true';
const API_BASE = (import.meta.env.VITE_BACKEND_API as string) ?? '/api';

// Вспомогательная функция для обработки ошибок от бэкенда
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      // Игнорируем ошибку парсинга
    }

    const errorMessage = errorData?.code || errorData?.message || `Error ${res.status}`;
    throw new Error(errorMessage);
  }
  
  // Обработка пустого ответа (например 200 OK без тела)
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const realAuthApi: AuthApi = {
  async register(input) {
    await handleResponse(
      await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          fullName: input.name,
        }),
      })
    );
  },

  async loginWithEmail(input): Promise<AuthSession> {
    const tokens = await handleResponse<TokenResponse>(
      await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
    );

    const user = await this.getMe(tokens.access_token);

    return {
      user: { ...user, provider: 'password' },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    };
  },

  async oauthLogin(provider) {
    if (provider === 'password') return;
    // Редирект на эндпоинт OAuth2
    window.location.href = `${window.location.origin}/oauth2/authorization/${provider}`;
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    return handleResponse<TokenResponse>(
      await fetch(
        `${API_BASE}/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`,
        {
          method: 'POST',
        }
      )
    );
  },

  async getMe(accessToken: string): Promise<AuthUser> {
    const data = await handleResponse<{ userId: string; role: string; email?: string; fullName?: string }>(
      await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    );

    return {
      id: data.userId,
      role: data.role,
      email: data.email || '',
      name: data.fullName || '',
    };
  },

  async requestPasswordRecovery(email) {
    // ИСПРАВЛЕНО: URL изменен с /recovery на /forgot согласно AuthApiController
    await handleResponse(
      await fetch(`${API_BASE}/auth/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    );
  },

  async resetPassword(input) {
    // ИСПРАВЛЕНО: Добавлено поле passwordConfirmation, которое требует контроллер
    await handleResponse(
      await fetch(`${API_BASE}/auth/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: input.token, 
          password: input.password,
          passwordConfirmation: input.password // Дублируем пароль, так как валидация на фронте уже прошла
        }),
      })
    );
  },
};

export const authApi: AuthApi = USE_MOCKS ? mockAuthApi : realAuthApi;