import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';
import { AuthLayout } from '@/auth/components/AuthLayout';
import { logAuthEvent } from '@/auth/logger';
import { getPasswordRequirementsState, validatePassword } from '@/auth/validation';
import eyeOpen from '@/assets/icons/eye-open.svg';
import eyeClosed from '@/assets/icons/eye-closed.svg';

export default function PasswordResetPage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { resetPassword, error, isLoading } = useAuth();

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const requirements = getPasswordRequirementsState(password);
  const isPasswordStrong =
    requirements.length &&
    requirements.upper &&
    requirements.lower &&
    requirements.digit &&
    requirements.special;

  const passwordValid = passwordTouched && !passwordError && password.length > 0;
  const confirmValid = confirmTouched && !confirmError && confirmPassword.length > 0;

  const canSubmit =
    !isLoading &&
    !passwordError &&
    !confirmError &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    isPasswordStrong;

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    const err = validatePassword(password);
    if (err) {
      logAuthEvent('Password reset failed – weak password');
    }
    setPasswordError(err);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordTouched) {
      const err = validatePassword(value);
      setPasswordError(err);
    }
    if (confirmTouched) {
      setConfirmError(value === confirmPassword ? null : 'Пароли не совпадают');
    }
  };

  const handleConfirmBlur = () => {
    setConfirmTouched(true);
    setConfirmError(password === confirmPassword ? null : 'Пароли не совпадают');
  };

  const handleConfirmChange = (value: string) => {
    setConfirmPassword(value);
    if (confirmTouched) {
      setConfirmError(password === value ? null : 'Пароли не совпадают');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    const pErr = validatePassword(password);
    setPasswordError(pErr);
    if (pErr) {
      logAuthEvent('Password reset failed – weak password');
      return;
    }
    if (confirmPassword !== password) {
      setConfirmError('Пароли не совпадают');
      return;
    }

    try {
      await resetPassword({ token, password });
      setSuccessMessage('Пароль успешно обновлён.');
      logAuthEvent('Password reset success');
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'INVALID_TOKEN') {
        logAuthEvent('Password reset failed – invalid token');
      } else if (msg === 'DB_ERROR') {
        logAuthEvent('Password reset failed – db error');
      }
    }
  };

  const alertNode =
    successMessage || error ? (
      <div className={`alert ${successMessage ? 'alert--success' : 'alert--error'}`}>
        {successMessage || error}
      </div>
    ) : null;

  return (
    <AuthLayout
      title="Сброс пароля"
      subtitle="Придумайте новый пароль"
      alert={alertNode}
      centered
      footer={
        <button
          type="button"
          className="btn btn-text auth-footer__link"
          onClick={() => navigate('/login')}
        >
          Войти
        </button>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="reset-password" className="form-label">
            Новый пароль
          </label>
          <div className="form-input-wrapper">
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              className={`form-input form-input--with-toggle ${
                passwordError ? 'form-input--error' : ''
              } ${passwordValid ? 'form-input--success' : ''}`}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={handlePasswordBlur}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordBlur()}
            />
            <button
              type="button"
              className="form-input__toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              <img
                src={showPassword ? eyeOpen : eyeClosed}
                alt={showPassword ? 'Пароль виден' : 'Пароль скрыт'}
                className="form-input__toggle-icon"
              />
            </button>
          </div>
          {/* Текст passwordError намеренно не выводим — только индикаторы ниже */}

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
        </div>

        <div className="form-field">
          <label htmlFor="reset-password-confirm" className="form-label">
            Подтверждение пароля
          </label>
          <div className="form-input-wrapper">
            <input
              id="reset-password-confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              className={`form-input form-input--with-toggle ${
                confirmError ? 'form-input--error' : ''
              } ${confirmValid ? 'form-input--success' : ''}`}
              value={confirmPassword}
              onChange={(e) => handleConfirmChange(e.target.value)}
              onBlur={handleConfirmBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmBlur()}
            />
            <button
              type="button"
              className="form-input__toggle"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              <img
                src={showConfirmPassword ? eyeOpen : eyeClosed}
                alt={showConfirmPassword ? 'Пароль виден' : 'Пароль скрыт'}
                className="form-input__toggle-icon"
              />
            </button>
          </div>
          {confirmError && <div className="form-error">{confirmError}</div>}
        </div>

        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          Сохранить
        </button>
      </form>
    </AuthLayout>
  );
}
