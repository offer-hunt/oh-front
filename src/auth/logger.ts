export type AuthEventName =
  | 'Registration initiated'
  | 'Registration failed – server error'
  | 'Registration success'
  | 'Autorisation initiated'
  | 'Login failed – server error'
  | 'Login failed – no user'
  | 'Login failed – password mismatch'
  | 'Login success'
  | 'Google OAuth failed – access denied'
  | 'Google OAuth success – data received'
  | 'Google OAuth failed – db error'
  | 'Google OAuth success – existing user'
  | 'Google OAuth success – new user'
  | 'Google OAuth failed – insert error'
  | 'GitHub OAuth failed – access denied'
  | 'GitHub OAuth success – data received'
  | 'GitHub OAuth failed – db error'
  | 'GitHub OAuth success – existing user'
  | 'GitHub OAuth success – new user'
  | 'GitHub OAuth failed – insert error'
  | 'Password recovery failed – invalid email'
  | 'Password recovery failed – db error'
  | 'Password recovery – safe no user'
  | 'Password recovery – email sent'
  | 'Password reset failed – weak password'
  | 'Password reset failed – invalid token'
  | 'Password reset failed – db error'
  | 'Password reset success';

export function logAuthEvent(event: AuthEventName, payload?: unknown) {
  // Пока просто логируем в консоль. При необходимости
  // можно заменить на отправку в аналитику.
  // eslint-disable-next-line no-console
  console.log(`[auth-event] ${event}`, payload ?? '');
}
