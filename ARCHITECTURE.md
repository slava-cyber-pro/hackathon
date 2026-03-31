# BudgetSphere — Architecture

## Stack

| Layer         | Choice                                |
| ------------- | ------------------------------------- |
| Frontend      | React 18+, TypeScript, Vite           |
| UI            | Tailwind CSS, shadcn/ui, Recharts     |
| State         | TanStack Query + Zustand              |
| Backend       | Python 3.12+, FastAPI, async          |
| ORM           | SQLAlchemy 2.0 (async) + Alembic      |
| Database      | PostgreSQL 16                         |
| Cache / Queue | Redis 7                               |
| Auth          | Stateless JWT (signature-verified)    |
| Observability | Prometheus + Grafana                  |
| UI Design     | Stitch (MCP)                          |
| Infra         | Docker Compose                        |

---

## Service Map

```
┌──────────┐     ┌──────────┐     ┌────────────┐     ┌────────────┐
│ Frontend │────▶│ Backend  │────▶│ PostgreSQL │     │   Redis    │
│ :5173    │     │ :8000    │────▶│ :5432      │     │ :6379      │
└──────────┘     └────┬─────┘     └────────────┘     └────────────┘
                      │
              ┌───────┴────────┐
              │  /metrics      │
              └───────┬────────┘
                      ▼
              ┌──────────────┐     ┌──────────┐
              │  Prometheus  │────▶│ Grafana  │
              │  :9090       │     │ :3000    │
              └──────────────┘     └──────────┘
```

**Docker Compose services**: `frontend`, `backend`, `db`, `redis`, `migrate` (run-once), `prometheus`, `grafana`

---

## Backend Structure

```
backend/
├── app/
│   ├── main.py              # App factory, middleware, lifespan
│   ├── core/
│   │   ├── config.py        # pydantic-settings
│   │   ├── security.py      # JWT sign/verify, bcrypt
│   │   ├── database.py      # Async engine + session factory
│   │   └── redis.py         # Redis client
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic request/response DTOs
│   ├── api/
│   │   ├── deps.py          # get_db, get_current_user
│   │   └── v1/              # Versioned route modules
│   ├── services/            # Business logic (no HTTP concerns)
│   └── utils/               # Pagination, exceptions
├── migrations/              # Alembic
├── tests/
├── pyproject.toml
└── Dockerfile
```

**Request flow**: `Route → deps (auth/db) → Service → Model/DB → Pydantic schema → Response`

---

## Frontend Structure

```
frontend/
├── public/                  # manifest.json, service-worker, icons
├── src/
│   ├── api/                 # API client + per-domain modules
│   ├── components/
│   │   ├── ui/              # shadcn primitives
│   │   ├── layout/          # Sidebar, Header, MobileNav
│   │   ├── charts/          # Recharts wrappers
│   │   └── forms/           # Transaction, Investment forms
│   ├── pages/               # Route-level components
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # Zustand stores
│   ├── types/               # Shared TypeScript interfaces
│   └── utils/
├── tests/
├── vite.config.ts
└── Dockerfile
```

---

## Database Schema

```sql
users (id UUID PK, email UNIQUE, hashed_password, display_name, token_issued_after TIMESTAMP, created_at)

teams (id UUID PK, name, created_by FK→users, created_at)

team_members (team_id FK→teams, user_id FK→users, role ENUM(owner|admin|member), joined_at)
  PK(team_id, user_id)

categories (id UUID PK, name, icon, is_default BOOL, user_id FK→users NULL)

transactions (id UUID PK, user_id FK→users, team_id FK→teams NULL, category_id FK→categories,
  type ENUM(income|expense), amount DECIMAL, description, date, is_recurring BOOL,
  recurrence_rule TEXT NULL, created_at)

investments (id UUID PK, user_id FK→users, team_id FK→teams NULL,
  category ENUM(stocks|bonds|crypto|real_estate|mutual_funds|etfs|custom),
  name, amount_invested DECIMAL, current_value DECIMAL,
  expected_return_pct DECIMAL, income_allocation_pct DECIMAL, created_at, updated_at)

budgets (id UUID PK, user_id FK→users NULL, team_id FK→teams NULL,
  category_id FK→categories NULL, amount_limit DECIMAL,
  period ENUM(weekly|monthly|quarterly|yearly|custom),
  period_start DATE, period_end DATE NULL, created_at)
```

**Indexes**: `transactions(user_id, date)`, `transactions(team_id, date)`, `investments(user_id)`, `budgets(user_id, period)`, `budgets(team_id, period)`

---

## Auth

- **Stateless JWT** — no tokens stored server-side.
- Access token: 15 min TTL, signed with HS256.
- Refresh token: 7 days TTL, rotated on use.
- Validation: signature check + expiry check. No DB/Redis lookup.
- Forced invalidation: `users.token_issued_after` rejects tokens issued before that timestamp (used on password change).
- Passwords: bcrypt hashed.

---

## Redis

- Rate limiting (per-user, per-IP)
- WebSocket pub/sub (budget limit warnings)
- Background task queues (invite emails, recurring transaction generation)
- **Not used for**: token storage, analytics caching

---

## Observability

- `prometheus-fastapi-instrumentator` exposes `/metrics`.
- Prometheus scrapes backend, plus `postgres_exporter` and `redis_exporter`.
- Grafana dashboards (provisioned as code): API performance, business metrics, infrastructure.
- Alerts: error rate spikes, p95 latency > threshold, DB connection pool exhaustion.

---

## API

REST, versioned under `/api/v1/`. All responses JSON.

| Endpoint Group  | Methods                         |
| --------------- | ------------------------------- |
| `/auth/*`       | register, login, refresh        |
| `/users/me`     | GET, PATCH                      |
| `/categories`   | GET, POST, DELETE               |
| `/transactions` | GET, POST, PUT, DELETE          |
| `/investments`  | GET, POST, PUT, DELETE          |
| `/budgets`      | GET, POST, PUT                  |
| `/teams`        | POST, GET, invite, members      |
| `/analytics/*`  | spending, income, investments, balance |
| `/metrics`      | Prometheus scrape               |

---

## PWA

- `manifest.json`: `display: "standalone"`, theme color, 192/512 icons.
- Service worker: static asset caching.
- Mobile-first responsive: breakpoints 640 / 768 / 1024 / 1280px.

---

## Testing

| Scope       | Tool                          | Target            |
| ----------- | ----------------------------- | ----------------- |
| Unit        | pytest                        | Services, utils   |
| Integration | pytest + httpx AsyncClient    | API + DB          |
| Coverage    | pytest-cov                    | ≥ 80%             |
| Components  | Vitest + React Testing Library | React components |
| E2E         | Playwright                    | Critical flows    |
