import { http, HttpResponse } from 'msw';

// По умолчанию '/api' — чтобы тесты работали без явного .env
const apiBase = (import.meta.env.VITE_BACKEND_API as string) ?? '/api';

// Упрощённая логика: если есть Authorization — 200, иначе 401.
export const handlers = [
  http.get(`${apiBase}/protected`, ({ request }) => {
    const auth = request.headers.get('authorization');
    if (!auth) return new HttpResponse('Unauthorized', { status: 401 });
    // Флаг для теста 403
    const force403 = request.headers.get('x-force-403');
    if (force403) return new HttpResponse('Forbidden', { status: 403 });
    return HttpResponse.json({ message: 'ok: protected' });
  }),
];
