# Web Design Senior Project

A local full-stack environment:

- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS v4 (in `frontend/`)
- **Backend:** Laravel 13 + Sanctum API tokens (in `backend/`)
- **Database:** Laragon MariaDB/MySQL (`web_design_senior_project`)

## Prerequisites

- Node.js 22+ and npm
- PHP 8.3+ with `pdo_mysql` enabled and Composer
- Laragon running with its MySQL/MariaDB service started

## One-time setup

1. Create the database (adjust the client path if your Laragon version differs):

   ```powershell
   & 'C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe' -u root -e "CREATE DATABASE IF NOT EXISTS web_design_senior_project CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

2. Configure and migrate the backend:

   ```powershell
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate
   ```

   The committed `.env.example` already targets `127.0.0.1:3306`, database
   `web_design_senior_project`, user `root`, and an empty password. Change
   `DB_PASSWORD` in `.env` if you set a root password in Laragon.

3. Install the frontend:

   ```powershell
   cd frontend
   npm install
   cp .env.example .env
   ```

## Running locally

Use two terminals from the repository root:

```powershell
# Terminal 1 - Laravel API (http://127.0.0.1:8000)
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

```powershell
# Terminal 2 - Vite dev server (http://127.0.0.1:5173)
cd frontend
npm run dev
```

Vite proxies `/api` requests to Laravel, so the browser only talks to
`127.0.0.1:5173`. `VITE_API_BASE_URL` defaults to `/api`; set it to an absolute
URL only when the API lives on another origin. Laravel's CORS allow-list is
driven by `CORS_ALLOWED_ORIGINS` in `backend/.env`.

## Demo endpoints

| Method | Endpoint        | Auth required | Purpose                       |
| ------ | --------------- | ------------- | ----------------------------- |
| GET    | `/api/health`   | No            | Checks Laravel + DB           |
| POST   | `/api/register` | No            | Creates a user, returns token |
| POST   | `/api/login`    | No            | Returns a Sanctum token       |
| GET    | `/api/user`     | Yes           | Returns the current user      |
| POST   | `/api/logout`   | Yes           | Revokes the current token     |

The frontend's starter screen exercises all of these: it shows database health,
offers login/register, and displays a protected panel.

## Checks

```powershell
# Backend (tests run against in-memory SQLite)
cd backend
php artisan test
vendor/bin/pint --dirty --format agent

# Frontend
cd frontend
npm run lint
npm run format:check
npm run build
```

## Notes

- Auth uses Sanctum bearer tokens stored in `localStorage` under `spa_api_token`
  and removed on logout or a `401` response. Switch to Sanctum's cookie-based
  SPA mode later if you need session cookies instead.
- Login and registration are rate-limited to 10 requests per minute per IP.
- Laravel Boost is installed as a dev dependency and its agent guidelines live
  in `backend/AGENTS.md`.
