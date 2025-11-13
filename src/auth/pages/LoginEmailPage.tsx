import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';
import { AuthLayout } from '@/auth/components/AuthLayout';
import { PasswordField } from '@/auth/components/PasswordField';
import { logAuthEvent } from '@/auth/logger';
import { validateEmail } from '@/auth/validation';

export default function LoginEmailPage() {
  const navigate = useNavigate();
  const { loginWithEmail, error, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const [password, setPassword] = useState('');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailValid = emailTouched && !emailError && email.trim().length > 0;

  const canSubmit = !isLoading && !emailError && email.trim() && password.length > 0;

  const handleEmailBlur = () => {
    setEmailTouched(true);
    setEmailError(validateEmail(email));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailTouched) {
      setEmailError(validateEmail(value));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    logAuthEvent('Autorisation initiated');
    setSuccessMessage(null);

    const eError = validateEmail(email);
    setEmailError(eError);
    if (eError) return;

    try {
      await loginWithEmail({ email, password });
      setSuccessMessage('Вход выполнен успешно.');
      navigate('/protected', { replace: true });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'SERVER_ERROR') {
        logAuthEvent('Login failed – server error');
      } else if (msg === 'NO_USER') {
        logAuthEvent('Login failed – no user');
      } else if (msg === 'PASSWORD_MISMATCH') {
        logAuthEvent('Login failed – password mismatch');
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
      title="Вход по email"
      subtitle="Введите email и пароль"
      alert={alertNode}
      centered
      footer={
        <>
          <button
            type="button"
            className="btn btn-text auth-footer__link"
            onClick={() => navigate('/password/recovery')}
          >
            Забыли пароль?
          </button>
          <button
            type="button"
            className="btn btn-text auth-footer__link"
            onClick={() => navigate('/register')}
          >
            Зарегистрироваться
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="login-email" className="form-label">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className={`form-input ${emailError ? 'form-input--error' : ''} ${
              emailValid ? 'form-input--success' : ''
            }`}
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={handleEmailBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailBlur()}
          />
          {emailError && <div className="form-error">{emailError}</div>}
        </div>

        <div className="form-field">
          <label htmlFor="login-password" className="form-label">
            Пароль
          </label>
          <PasswordField
            id="login-password"
            value={password}
            onChange={setPassword}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          Войти
        </button>
      </form>
    </AuthLayout>
  );
}
