import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';
import { AuthLayout } from '@/auth/components/AuthLayout';
import { PasswordField } from '@/auth/components/PasswordField';
import { logAuthEvent } from '@/auth/logger';
import { getPasswordRequirementsState, validatePassword } from '@/auth/validation';

export default function PasswordResetPage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { resetPassword, error, isLoading } = useAuth();

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmTouched, setConfirmTouched] = useState(false);

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
          <PasswordField
            id="reset-password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            error={passwordError}
            isValid={passwordValid}
            showRequirements
            requirements={requirements}
          />
        </div>

        <div className="form-field">
          <label htmlFor="reset-password-confirm" className="form-label">
            Подтверждение пароля
          </label>
          <PasswordField
            id="reset-password-confirm"
            value={confirmPassword}
            onChange={handleConfirmChange}
            onBlur={handleConfirmBlur}
            error={confirmError}
            isValid={confirmValid}
          />
          {confirmError && <div className="form-error">{confirmError}</div>}
        </div>

        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          Сохранить
        </button>
      </form>
    </AuthLayout>
  );
}
