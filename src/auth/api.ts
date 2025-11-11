import type { AuthApi } from './types';
import { mockAuthApi } from '@/mocks/auth/mockAuthApi';

// Переключатель моков. По умолчанию моки ВКЛючены.
const USE_MOCKS = (import.meta.env.VITE_AUTH_USE_MOCKS as string | undefined) !== 'false';

const realAuthApi: AuthApi = {
  async register() {
    throw new Error('Real auth API is not implemented yet');
  },
  async loginWithEmail() {
    throw new Error('Real auth API is not implemented yet');
  },
  async oauthLogin() {
    throw new Error('Real auth API is not implemented yet');
  },
  async requestPasswordRecovery() {
    throw new Error('Real auth API is not implemented yet');
  },
  async resetPassword() {
    throw new Error('Real auth API is not implemented yet');
  },
};

export const authApi: AuthApi = USE_MOCKS ? mockAuthApi : realAuthApi;
