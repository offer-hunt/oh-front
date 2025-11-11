import type { PasswordRequirementsState } from '@/auth/validation';

interface PasswordRequirementsInlineProps {
  requirements: PasswordRequirementsState;
}

/**
 * Отрисовка индикатора сложности пароля в одну строку.
 * Чисто презентационный компонент — логики здесь нет.
 */
export function PasswordRequirementsInline({ requirements }: PasswordRequirementsInlineProps) {
  return (
    <div className="password-requirements-inline">
      <span
        className={`password-requirements-inline__item ${
          requirements.upper
            ? 'password-requirements-inline__item--ok'
            : 'password-requirements-inline__item--bad'
        }`}
      >
        [A-Z]
      </span>
      <span className="password-requirements-inline__sep">|</span>
      <span
        className={`password-requirements-inline__item ${
          requirements.lower
            ? 'password-requirements-inline__item--ok'
            : 'password-requirements-inline__item--bad'
        }`}
      >
        [a-z]
      </span>
      <span className="password-requirements-inline__sep">|</span>
      <span
        className={`password-requirements-inline__item ${
          requirements.digit
            ? 'password-requirements-inline__item--ok'
            : 'password-requirements-inline__item--bad'
        }`}
      >
        [0-9]
      </span>
      <span className="password-requirements-inline__sep">|</span>
      <span
        className={`password-requirements-inline__item ${
          requirements.special
            ? 'password-requirements-inline__item--ok'
            : 'password-requirements-inline__item--bad'
        }`}
      >
        [*-!]
      </span>
      <span className="password-requirements-inline__sep">|</span>
      <span
        className={`password-requirements-inline__item ${
          requirements.length
            ? 'password-requirements-inline__item--ok'
            : 'password-requirements-inline__item--bad'
        }`}
      >
        8&nbsp;символов
      </span>
    </div>
  );
}
