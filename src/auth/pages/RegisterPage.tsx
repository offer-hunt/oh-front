import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';
import { AuthLayout } from '@/auth/components/AuthLayout';
import { PasswordField } from '@/auth/components/PasswordField';
import { logAuthEvent } from '@/auth/logger';
import {
  getPasswordRequirementsState,
  validateEmail,
  validatePassword,
} from '@/auth/validation';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, error, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const nameTooLong = name.length > 50;
  const requirements = getPasswordRequirementsState(password);

  const isPasswordStrong =
    requirements.length &&
    requirements.upper &&
    requirements.lower &&
    requirements.digit &&
    requirements.special;

  const nameValid = !nameError && name.trim().length > 0;
  const emailValid = emailTouched && !emailError && email.trim().length > 0;
  const passwordValid = passwordTouched && !passwordError && password.length > 0;
  const confirmValid = confirmTouched && !confirmError && confirmPassword.length > 0;

  const canSubmit =
    !isLoading &&
    !nameTooLong &&
    name.trim().length > 0 &&
    !emailError &&
    !passwordError &&
    !confirmError &&
    email.trim() &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    isPasswordStrong;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    logAuthEvent('Registration initiated');
    setSuccessMessage(null);

    if (nameTooLong) {
      setNameError('Имя не может быть длиннее 50 символов');
      return;
    }

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const confirmErr = password !== confirmPassword ? 'Пароли не совпадают' : null;

    setEmailError(emailErr);
    setPasswordError(passErr);
    setConfirmError(confirmErr);

    if (emailErr || passErr || confirmErr) return;

    try {
      await register({ name, email, password });
      setSuccessMessage('Регистрация успешна!');
      navigate('/protected', { replace: true });
    } catch (err) {
      const errMessage = (err as Error).message;
      if (errMessage === 'SERVER_ERROR') {
        logAuthEvent('Registration failed – server error');
      }
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (value.length > 50) {
      setNameError('Имя не может быть длиннее 50 символов');
    } else {
      setNameError(null);
    }
  };

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

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    setPasswordError(validatePassword(password));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordTouched) {
      setPasswordError(validatePassword(value));
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

  const alertNode =
    successMessage || error ? (
      <div className={`alert ${successMessage ? 'alert--success' : 'alert--error'}`}>
        {successMessage || error}
      </div>
    ) : null;

  return (
    <AuthLayout
      title="Регистрация"
      subtitle="Создайте новый аккаунт"
      alert={alertNode}
      centered
      footer={
        <button
          type="button"
          className="btn btn-text auth-footer__link"
          onClick={() => navigate('/login')}
        >
          Уже есть аккаунт?
        </button>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label className="form-label" htmlFor="reg-name">
            Имя
          </label>
          <input
            id="reg-name"
            className={`form-input ${nameError ? 'form-input--error' : ''} ${
              nameValid ? 'form-input--success' : ''
            }`}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => {
              if (nameTooLong) {
                setNameError('Имя не может быть длиннее 50 символов');
              }
            }}
          />
          <div className={`name-counter ${nameTooLong ? 'name-counter--warning' : ''}`}>
            {name.length}/50
          </div>
          {nameError && <div className="form-error">{nameError}</div>}
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="reg-email">
            Email
          </label>
          <input
            id="reg-email"
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
          <label className="form-label" htmlFor="reg-password">
            Пароль
          </label>
          <PasswordField
            id="reg-password"
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
          <label className="form-label" htmlFor="reg-password-confirm">
            Подтверждение пароля
          </label>
          <PasswordField
            id="reg-password-confirm"
            value={confirmPassword}
            onChange={handleConfirmChange}
            onBlur={handleConfirmBlur}
            error={confirmError}
            isValid={confirmValid}
          />
          {confirmError && <div className="form-error">{confirmError}</div>}
        </div>

        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          Зарегестрироваться
        </button>
      </form>
    </AuthLayout>
  );
}
