import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { router as appRouter } from '@/routes';

const useAuthMock = vi.fn();
vi.mock('react-oidc-context', () => ({
  __esModule: true,
  useAuth: () => useAuthMock(),
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function renderWithProviders(path: string) {
  const router = createMemoryRouter(
    appRouter.routes as unknown as Parameters<typeof createMemoryRouter>[0],
    { initialEntries: [path] },
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthMock.mockReset();
});

describe('Protected route', () => {
  it('opens with valid token (200)', async () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { access_token: 'TOK', profile: {} },
      signinRedirect: vi.fn(),
      signoutRedirect: vi.fn(),
      signinRedirectCallback: vi.fn(),
    });

    renderWithProviders('/protected');

    await waitFor(() => expect(screen.getByText(/Защищённая страница/)).toBeInTheDocument());
    expect(screen.getByText(/ok: protected/)).toBeInTheDocument();
  });

  it('redirects to /login without token (401)', async () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: undefined,
      signinRedirect: vi.fn(),
      signoutRedirect: vi.fn(),
      signinRedirectCallback: vi.fn(),
    });

    renderWithProviders('/protected');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument(),
    );
  });

  it('shows Forbidden on 403', async () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { access_token: 'TOK', profile: {} },
      signinRedirect: vi.fn(),
      signoutRedirect: vi.fn(),
      signinRedirectCallback: vi.fn(),
    });

    renderWithProviders('/protected?force403=1');

    await waitFor(() => expect(screen.getByText('Forbidden')).toBeInTheDocument());
  });
});
