import type {
  AuthApi,
  AuthProviderType,
  AuthSession,
  AuthUser,
  LoginInput,
  PasswordResetInput,
  RegisterInput,
  TokenResponse,
} from '@/auth/types';
import { logAuthEvent } from '@/auth/logger';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash?: string; // только для password-провайдера
  provider: AuthProviderType;
}

const users = new Map<string, UserRecord>();
const resetTokens = new Map<string, string>(); // token -> userId

let idCounter = 1;

function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function createSession(user: UserRecord): AuthSession {
  // В реальном мире accessToken был бы JWT. Здесь — просто строка.
  const accessToken = `mock-token-${user.id}-${Date.now()}`;
  const refreshToken = `mock-refresh-${user.id}-${Date.now()}`;
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      provider: user.provider,
    },
    accessToken,
    refreshToken,
    expiresIn: 3600,
  };
}

const mockAuthApi: AuthApi = {
  async register(input: RegisterInput): Promise<void> {
    const email = input.email.toLowerCase();
    // Имитируем ошибку сервера для особого email.
    if (email === 'server-error@example.com') {
      logAuthEvent('Registration failed – server error');
      throw new Error('SERVER_ERROR');
    }

    if (users.has(email)) {
      // аккаунт уже существует
      throw new Error('EMAIL_EXISTS');
    }

    const user: UserRecord = {
      id: String(idCounter++),
      name: input.name.trim(),
      email,
      passwordHash: input.password,
      provider: 'password',
    };
    users.set(email, user);
    logAuthEvent('Registration success', { email });

    return delay(undefined);
  },

  async loginWithEmail(input: LoginInput): Promise<AuthSession> {
    const email = input.email.toLowerCase();
    if (email === 'server-error@example.com') {
      logAuthEvent('Login failed – server error');
      throw new Error('SERVER_ERROR');
    }

    const user = users.get(email);
    if (!user) {
      logAuthEvent('Login failed – no user', { email });
      throw new Error('NO_USER');
    }
    if (user.passwordHash !== input.password) {
      logAuthEvent('Login failed – password mismatch', { email });
      throw new Error('PASSWORD_MISMATCH');
    }
    logAuthEvent('Login success', { email });
    return delay(createSession(user));
  },

  async oauthLogin(provider: AuthProviderType): Promise<void> {
    // В моковой реализации просто имитируем редирект
    // В реальном API это вызовет window.location.href = ...
    logAuthEvent(
      (provider === 'google'
        ? 'Google OAuth initiated'
        : 'GitHub OAuth initiated') as never
    );
    await delay(undefined);
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    // В моке просто генерируем новые токены
    await delay(undefined, 200);
    return {
      token_type: 'Bearer',
      access_token: `mock-refreshed-${Date.now()}`,
      refresh_token: `mock-refresh-${Date.now()}`,
      expires_in: 3600,
    };
  },

  async getMe(accessToken: string): Promise<AuthUser> {
    // Извлекаем userId из токена (в моке это просто строка)
    // В реальном API это был бы декодированный JWT
    const match = accessToken.match(/mock-token-(\d+)-/);
    if (!match) {
      throw new Error('INVALID_TOKEN');
    }

    const userId = match[1];
    const user = Array.from(users.values()).find(u => u.id === userId);

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return delay({
      id: user.id,
      name: user.name,
      email: user.email,
      provider: user.provider,
    });
  },

  async requestPasswordRecovery(emailRaw: string): Promise<void> {
    const email = emailRaw.toLowerCase();
    if (email === 'server-error@example.com') {
      logAuthEvent('Password recovery failed – db error');
      throw new Error('DB_ERROR');
    }

    const user = users.get(email);
    if (!user) {
      logAuthEvent('Password recovery – safe no user', { email });
      // Сообщение пользователю всегда одинаковое
      return delay(undefined);
    }

    const token = `reset-${user.id}-${Date.now()}`;
    resetTokens.set(token, user.id);
    logAuthEvent('Password recovery – email sent', { email, token });

    // для удобства разработки выводим токен в консоль
    // eslint-disable-next-line no-console
    console.log('[password-reset-link]', `/password/reset/${token}`);

    return delay(undefined);
  },

  async resetPassword(input: PasswordResetInput): Promise<void> {
    const userId = resetTokens.get(input.token);
    if (!userId) {
      logAuthEvent('Password reset failed – invalid token');
      throw new Error('INVALID_TOKEN');
    }

    const user = Array.from(users.values()).find((u) => u.id === userId);
    if (!user) {
      logAuthEvent('Password reset failed – db error');
      throw new Error('DB_ERROR');
    }

    user.passwordHash = input.password;
    resetTokens.delete(input.token);
    logAuthEvent('Password reset success', { userId: user.id });
    return delay(undefined);
  },
};

export { mockAuthApi };
