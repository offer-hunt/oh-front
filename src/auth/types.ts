export type AuthProviderType = 'password' | 'google' | 'github';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  provider: AuthProviderType;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface PasswordResetInput {
  token: string;
  password: string;
}

export interface AuthApi {
  register(input: RegisterInput): Promise<AuthSession>;
  loginWithEmail(input: LoginInput): Promise<AuthSession>;
  oauthLogin(provider: AuthProviderType): Promise<AuthSession>;
  requestPasswordRecovery(email: string): Promise<void>;
  resetPassword(input: PasswordResetInput): Promise<void>;
}
