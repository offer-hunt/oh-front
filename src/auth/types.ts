export type AuthProviderType = 'password' | 'google' | 'github';

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  provider?: AuthProviderType;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn?: number; // В секундах
}

export interface RegisterInput {
  name: string; // В API это fullName
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

export interface TokenResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthApi {
  register(input: RegisterInput): Promise<void>;
  loginWithEmail(input: LoginInput): Promise<AuthSession>;
  oauthLogin(provider: AuthProviderType): Promise<void>; // Redirects, doesn't return
  refreshToken(refreshToken: string): Promise<TokenResponse>;
  getMe(accessToken: string): Promise<AuthUser>;
  requestPasswordRecovery(email: string): Promise<void>;
  resetPassword(input: PasswordResetInput): Promise<void>;
}