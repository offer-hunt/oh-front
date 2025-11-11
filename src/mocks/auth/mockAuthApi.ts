import type {
  AuthApi,
  AuthProviderType,
  AuthSession,
  LoginInput,
  PasswordResetInput,
  RegisterInput,
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
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      provider: user.provider,
    },
    accessToken,
  };
}

const mockAuthApi: AuthApi = {
  async register(input: RegisterInput): Promise<AuthSession> {
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

    return delay(createSession(user));
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

  async oauthLogin(provider: AuthProviderType): Promise<AuthSession> {
    const eventPrefix = provider === 'google' ? 'Google' : 'GitHub';

    // Отмена входа/ошибка доступа для спец-провайдера имитируется,
    // если в localStorage лежит флаг.
    const denyKey = `mock-oauth-deny-${provider}`;
    if (localStorage.getItem(denyKey) === '1') {
      localStorage.removeItem(denyKey);
      logAuthEvent(
        (provider === 'google'
          ? 'Google OAuth failed – access denied'
          : 'GitHub OAuth failed – access denied') as never,
      );
      throw new Error('ACCESS_DENIED');
    }

    // Условный "профиль" от внешнего провайдера
    const profileEmail = `${provider}-user@example.com`;
    const profileName = provider === 'google' ? 'Google User' : 'GitHub User';

    logAuthEvent(
      (provider === 'google'
        ? 'Google OAuth success – data received'
        : 'GitHub OAuth success – data received') as never,
      { email: profileEmail },
    );

    // Ошибка БД
    if (profileEmail === 'oauth-db-error@example.com') {
      logAuthEvent(
        (provider === 'google'
          ? 'Google OAuth failed – db error'
          : 'GitHub OAuth failed – db error') as never,
      );
      throw new Error('DB_ERROR');
    }

    let user = users.get(profileEmail);
    if (user) {
      logAuthEvent(
        (provider === 'google'
          ? 'Google OAuth success – existing user'
          : 'GitHub OAuth success – existing user') as never,
        { email: profileEmail },
      );
      return delay(createSession(user));
    }

    // создаём нового пользователя
    try {
      user = {
        id: String(idCounter++),
        name: profileName,
        email: profileEmail,
        provider,
      };
      users.set(profileEmail, user);
      logAuthEvent(
        (provider === 'google'
          ? 'Google OAuth success – new user'
          : 'GitHub OAuth success – new user') as never,
        { email: profileEmail },
      );
      return delay(createSession(user));
    } catch (e) {
      logAuthEvent(
        (provider === 'google'
          ? 'Google OAuth failed – insert error'
          : 'GitHub OAuth failed – insert error') as never,
        e,
      );
      throw new Error('INSERT_ERROR');
    }
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
