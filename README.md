# OH-Front SPA (Vite + React + TS)

## Скрипты

- `npm run dev` — локальный запуск
- `npm run test` / `npm run test:ci` — тесты (Vitest + Testing Library + MSW)
- `npm run lint` — ESLint
- `npm run format` / `npm run format:check` — Prettier
- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — прод сборка

## Переменные окружения

Все необходимые переменные окружения описаны в файле `.env.sample`. Перед первым запуском скопируйте его в `.env` и заполните своими значениями.

Важно: для Vite все переменные должны иметь префикс `VITE_`.

- `VITE_OIDC_AUTHORITY` — URL провайдера OIDC
- `VITE_OIDC_CLIENT_ID` — `client_id`
- `VITE_OIDC_REDIRECT_URI` — `https://host/auth/callback`
- `VITE_OIDC_SCOPE` — например, `openid profile email offline_access`
- `VITE_BACKEND_API` — базовый URL API, который будет использовать фронтенд (например, `/api`).
- `VITE_PROFILE_USE_MOCKS` — `true/false`, включает фронтовые моки личного кабинета (по умолчанию `true`).

## OAuth2/OIDC (Authorization Code + PKCE)

- Кнопка **Login** делает `signinRedirect()` → редирект на провайдера
- `/auth/callback` обрабатывает `code+state+nonce` через `signinRedirectCallback()`
- Токены хранятся в `sessionStorage` (см. `userStore`)
- `ProtectedRoute` без токена ведёт на `/login`
- API-вызовы добавляют `Authorization: Bearer <access_token>` (см. `useApi`)
- **Logout** — `signoutRedirect()`

## Docker

- `Dockerfile` собирает образ, содержащий только статические файлы приложения (`dist`).
- `docker-compose.yml` организует локальный запуск, имитируя production-окружение с отдельным Nginx.

### Локально (docker-compose)

1.  Скопируйте `.env.sample` в новый файл `.env`:
    ```bash
    cp .env.sample .env
    ```
2.  Откройте `.env` и заполните его своими значениями.
    - Для `VITE_BACKEND_API` используйте `/api`, чтобы запросы проксировались через Nginx.
    - Для `VITE_OIDC_REDIRECT_URI` локально удобно использовать `http://localhost:5173/auth/callback`.

3.  Запустите сборку и контейнеры:

    ```bash
    docker-compose up --build -d
    ```

    Эта команда:
    - Соберёт образ `oh-front-assets:local` со статикой вашего приложения.
    - Запустит временный контейнер `init-spa`, чтобы скопировать эту статику в Docker-том.
    - Запустит контейнер `webserver` (Nginx), который будет раздавать статику из тома и проксировать запросы к API.

4.  Приложение будет доступно по адресу `http://localhost:5173`.
