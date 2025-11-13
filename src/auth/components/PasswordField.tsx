import type { ChangeEvent, KeyboardEvent } from 'react';
import { useState } from 'react';

import type { PasswordRequirementsState } from '@/auth/validation';
import eyeOpen from '@/assets/icons/eye-open.svg';
import eyeClosed from '@/assets/icons/eye-closed.svg';

import { PasswordRequirementsInline } from './PasswordRequirementsInline';

interface PasswordFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;

  /** Текст ошибки для подсветки поля (сам текст тут не показываем) */
  error?: string | null;
  /** Флаг валидности для зелёной подсветки */
  isValid?: boolean;

  /** Показать индикатор требований к паролю */
  showRequirements?: boolean;
  /** Состояние требований (length/upper/lower/digit/special) */
  requirements?: PasswordRequirementsState;
}

/**
 * Общий контрол для ввода пароля с переключателем
 * «показать/скрыть» и (опционально) индикатором требований.
 */
export function PasswordField({
  id,
  value,
  onChange,
  onBlur,
  error,
  isValid,
  showRequirements,
  requirements,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onBlur) {
      onBlur();
    }
  };

  const inputClassName = [
    'form-input',
    'form-input--with-toggle',
    error ? 'form-input--error' : '',
    isValid ? 'form-input--success' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const ariaLabel = show ? 'Скрыть пароль' : 'Показать пароль';
  const alt = show ? 'Пароль виден' : 'Пароль скрыт';

  return (
    <>
      <div className="form-input-wrapper">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={inputClassName}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="form-input__toggle"
          onClick={() => setShow((prev) => !prev)}
          aria-label={ariaLabel}
        >
          <img src={show ? eyeOpen : eyeClosed} alt={alt} className="form-input__toggle-icon" />
        </button>
      </div>

      {showRequirements && requirements && (
        <PasswordRequirementsInline requirements={requirements} />
      )}
    </>
  );
}
