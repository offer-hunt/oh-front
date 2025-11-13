export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Email некорректен';
  if (!EMAIL_REGEX.test(value.trim())) return 'Email некорректен';
  return null;
}

export interface PasswordRequirementsState {
  length: boolean;
  upper: boolean;
  lower: boolean;
  digit: boolean;
  special: boolean;
}

export function getPasswordRequirementsState(password: string): PasswordRequirementsState {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function validatePassword(value: string): string | null {
  const state = getPasswordRequirementsState(value);
  const allOk = state.length && state.upper && state.lower && state.digit && state.special;
  if (!allOk) {
    return 'Пароль слишком простой. Добавьте цифры, символы или заглавные буквы';
  }
  return null;
}
