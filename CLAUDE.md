# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beauty Salon CRM System — a multi-service application with:
- **`crm-frontend-react/`** — Main CRM (React 19 + TypeScript + Vite + Tailwind CSS)
- **`api-server/`** — REST API (Express.js + PostgreSQL, raw SQL, no ORM)
- **`mini-app/`** — Telegram Mini App (Vue 3 + Vite)
- **`telegram-bot/`** — Telegram Bot (Grammy framework)
- **`server/`** — Legacy vanilla JS frontend + SQLite backend (unused)

## Development Commands

### CRM Frontend (primary frontend)
```bash
cd crm-frontend-react
npm run dev      # Start dev server on port 5174
npm run build    # TypeScript check + Vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### API Server
```bash
cd api-server
npm run dev      # node --watch src/server.js (port 3000)
npm start        # Production start
npm run migrate  # Run SQL migrations
npm run seed     # Seed admin user
npm run seed:demo # Seed 50 clients, 10 employees, 30+ services, 52 inventory items
```

### Telegram Bot
```bash
cd telegram-bot
npm run dev   # node --watch bot.js
npm start
```

### Infrastructure (Docker)
```bash
docker-compose up -d  # Start PostgreSQL (5432), Redis (6379), RabbitMQ (5672/15672)
```

## Architecture

### Frontend → Backend Communication
- Vite proxy: `/api` → `http://localhost:3000` (configured in `vite.config.ts`)
- Axios client with automatic JWT Bearer injection and 401 token refresh (`src/api/client.ts`)
- Token refresh queues failed requests and retries after new token is obtained

### Authentication & Authorization
- JWT access tokens (15min) + refresh tokens (7 days), stored in localStorage
- Roles: `owner` > `admin` > `master`
- Frontend route guards in `App.tsx` via `pageAccess` map
- Backend: `authenticate` middleware + `requireRole()` per route
- All mutations logged via `auditLog(entity)` middleware to `audit_log` table

### Database
- PostgreSQL with raw SQL (`pg` library), connection pool (max 20)
- Migrations auto-run on server startup from `api-server/migrations/*.sql`
- Utility functions in `api-server/src/config/database.js`: `queryAll()`, `queryOne()`, `execute()`
- Main tables: `services`, `employees`, `clients`, `appointments`, `payments`, `inventory`, `users`, `audit_log`, `telegram_users`

### Frontend State
- **Zustand** stores in `src/stores/`: `authStore.ts` (auth state), `uiStore.ts` (theme/UI)
- API endpoints organized in `src/api/endpoints/` with barrel export via `src/api/index.ts`

### Frontend Routing
- HashRouter (`#/`) with these pages: `login`, `dashboard`, `appointments`, `clients`, `employees`, `services`, `reports`, `inventory`
- `employees`, `reports`, `inventory` require `admin` or `owner` role

### Backend Route Structure
- Public: `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`, `POST /api/booking/*`
- Protected (JWT required): services, clients, appointments, schedule, employees (read)
- Admin-only: payments, reports, inventory, suppliers, purchase-orders, price-history
- Reusable CRUD pattern via `api-server/src/routes/crud-factory.js`

## Key Libraries
- **Charts**: Chart.js 4.5 (dashboard, reports)
- **Calendar**: FullCalendar 6.1 (appointments page)
- **Barcodes**: JsBarcode 3.12 (inventory)
- **PDF export**: jsPDF 4.2 (reports)
- **Telegram Mini App**: `@telegram-apps/sdk` + Vue 3
- **Telegram Bot**: Grammy

## Environment
All secrets in root `.env`: PostgreSQL credentials, Redis URL, RabbitMQ URL, JWT secrets, Telegram bot token.
