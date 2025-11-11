import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';
import { AuthLayout } from '@/auth/components/AuthLayout';
import { logAuthEvent } from '@/auth/logger';
import { validateEmail } from '@/auth/validation';

export default function PasswordRecoveryPage() {
  const navigate = useNavigate();
  const { requestPasswordRecovery, error, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const emailValid = emailTouched && !emailError && email.trim().length > 0;

  const canSubmit = !isLoading && !emailError && email.trim();

  const handleEmailBlur = () => {
    setEmailTouched(true);
    const eError = validateEmail(email);
    setEmailError(eError);
    if (eError) {
      logAuthEvent('Password recovery failed – invalid email');
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailTouched) {
      const eError = validateEmail(value);
      setEmailError(eError);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setInfoMessage(null);

    const eError = validateEmail(email);
    setEmailError(eError);
    if (eError) {
      logAuthEvent('Password recovery failed – invalid email');
      return;
    }

    try {
      await requestPasswordRecovery(email);
      setInfoMessage('Письмо отправлено.');
    } catch (err) {
      if ((err as Error).message === 'DB_ERROR') {
        logAuthEvent('Password recovery failed – db error');
      }
    }
  };

  const alertNode =
    infoMessage || error ? (
      <div className={`alert ${error ? 'alert--error' : 'alert--info'}`}>
        {infoMessage || error}
      </div>
    ) : null;

  return (
    <AuthLayout
      title="Восстановление пароля"
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
          <label htmlFor="recovery-email" className="form-label">
            Email
          </label>
          <input
            id="recovery-email"
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

        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          Отправить письмо
        </button>
      </form>
    </AuthLayout>
  );
}
