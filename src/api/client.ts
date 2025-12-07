import { useAuth } from '@/auth/AuthContext';

export class ForbiddenError extends Error {}

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  _retry?: boolean;
  headers?: HeadersInit;
}

export const useApi = () => {
  // Получаем доступ к внутренним методам контекста (refreshSession)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auth = useAuth() as any; 
  const base = (import.meta.env.VITE_BACKEND_API as string) ?? '/api';

  const apiFetch = async <T = unknown>(path: string, init?: FetchOptions): Promise<T> => {
    const { _retry, ...fetchInit } = init || {};
    const headers = new Headers(fetchInit?.headers);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

    let token = auth.user ? (await auth.getAccessToken()) : null;
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let res = await fetch(`${base}${path}`, { ...fetchInit, headers });

    // Обработка истечения токена (401)
    if (res.status === 401 && !_retry && auth.user) {
      try {
        const newToken = await auth.refreshSession();
        if (newToken) {
          // Повторяем запрос с новым токеном
          headers.set('Authorization', `Bearer ${newToken}`);
          res = await fetch(`${base}${path}`, {
            ...fetchInit,
            headers,
          });
        }
      } catch (e) {
        // Refresh failed, user is logged out by context
        throw new Error('Session expired');
      }
    }

    if (res.status === 403) throw new ForbiddenError('Forbidden');
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) {
       let msg = `API error ${res.status}`;
       try {
         const json = await res.json();
         if(json.message) msg = json.message;
       } catch {}
       throw new Error(msg);
    }

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return (await res.json()) as T;
    return (await res.text()) as unknown as T;
  };

  return { apiFetch };
};