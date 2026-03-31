# BudgetSphere

> A collaborative web-based financial tracking application for individuals and teams.

---

## 1. Vision

BudgetSphere is a modern Progressive Web App (PWA) that helps individuals and teams track spending, manage income, and monitor investments — all in one place. It provides rich visualizations, category-based budgeting, configurable spending limits, and full team collaboration with per-member filtering.

---

## 2. Core Features

### 2.1 Spending Tracker

- Record expenses with amount, date, description, and category.
- **Prepopulated categories**: Groceries, Rent/Mortgage, Utilities, Transportation, Dining Out, Entertainment, Healthcare, Education, Clothing, Subscriptions, Insurance, Gifts, Travel, Personal Care, Miscellaneous.
- Users can create, rename, and delete custom categories.
- Recurring expense support (monthly bills, subscriptions).
- Attach notes or tags to individual transactions.

### 2.2 Income Management

- Record income entries with source, amount, date, and recurrence.
- Support multiple income streams (salary, freelance, dividends, etc.).
- Monthly/annual income summaries.

### 2.3 Investment Tracking

- Record investments by category (Stocks, Bonds, Crypto, Real Estate, Mutual Funds, ETFs, Custom).
- Track per-investment: amount invested, current value, expected return.
- Define what percentage/amount of income is allocated to each investment.
- Portfolio overview with allocation breakdown.

### 2.4 Visualizations & Analytics

- **Spending**: pie charts (by category), bar charts (monthly trend), line charts (over time).
- **Income**: bar charts (by source), line charts (income over time).
- **Investments**: portfolio allocation donut chart, growth line chart, income-vs-investment bar chart.
- **Balance**: net cash flow (income minus spending) over time.
- Date-range filtering on all charts (week / month / quarter / year / custom).

### 2.5 Budgets & Limits

- Personal spending limits — per category or per time period (weekly / monthly / custom).
- Notifications/warnings when approaching or exceeding a limit.
- Progress bars showing current spend vs. limit.

### 2.6 Team Collaboration

- Create a team and invite members via email/link.
- All team members' spending, income, and investments aggregated in a shared dashboard.
- **Filtering**: view all team data, only your own, or a specific member's.
- **Team limits**: set shared spending caps (e.g., "Team grocery budget: $2000/month").
- **Personal limits within a team**: each member can still set their own limits.
- Role-based access: Owner (full control), Admin (manage members/limits), Member (read/write own data).

---

## 3. Technical Architecture

### 3.1 Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Frontend       | React 18+ (TypeScript, Vite)        |
| UI Framework   | Tailwind CSS + shadcn/ui            |
| Charts         | Recharts                            |
| State Mgmt     | React Query (TanStack Query) + Zustand |
| Backend        | Python 3.12+, FastAPI               |
| ORM            | SQLAlchemy 2.0 (async)              |
| Database       | PostgreSQL 16                       |
| Caching/Queue  | Redis 7                             |
| Auth           | JWT (stateless, signature-verified) |
| Observability  | Prometheus + Grafana                |
| Migrations     | Alembic                             |
| Containerization | Docker + Docker Compose           |
| Testing        | pytest (backend), Vitest + React Testing Library (frontend) |
| CI/CD          | GitHub Actions                      |

### 3.2 PWA (Progressive Web App)

- Service worker for offline caching of static assets and recent data.
- `manifest.json` with app name, icons, theme color, `display: "standalone"`.
- "Add to Home Screen" prompt on mobile browsers.
- Responsive design — fully usable on screens from 320px to 4K.
- Native-app look: no browser chrome, splash screen, status bar theming.

### 3.3 Backend Architecture (Modular)

```
backend/
├── app/
│   ├── main.py                  # FastAPI app factory
│   ├── core/
│   │   ├── config.py            # Settings via pydantic-settings
│   │   ├── security.py          # JWT, password hashing
│   │   ├── database.py          # Async SQLAlchemy engine/session
│   │   └── redis.py             # Redis client
│   ├── models/                  # SQLAlchemy models (one file per domain)
│   │   ├── user.py
│   │   ├── team.py
│   │   ├── category.py
│   │   ├── transaction.py       # Spending & income
│   │   └── investment.py
│   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── user.py
│   │   ├── team.py
│   │   ├── transaction.py
│   │   └── investment.py
│   ├── api/                     # Route modules
│   │   ├── v1/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── categories.py
│   │   │   ├── transactions.py
│   │   │   ├── investments.py
│   │   │   ├── budgets.py
│   │   │   ├── teams.py
│   │   │   └── analytics.py
│   │   └── deps.py              # Shared dependencies (get_db, get_current_user)
│   ├── services/                # Business logic layer
│   │   ├── auth_service.py
│   │   ├── transaction_service.py
│   │   ├── investment_service.py
│   │   ├── budget_service.py
│   │   ├── team_service.py
│   │   └── analytics_service.py
│   └── utils/
│       ├── pagination.py
│       └── exceptions.py
├── migrations/                  # Alembic
├── tests/
│   ├── conftest.py              # Fixtures (test DB, client, auth)
│   ├── test_auth.py
│   ├── test_transactions.py
│   ├── test_investments.py
│   ├── test_budgets.py
│   ├── test_teams.py
│   └── test_analytics.py
├── pyproject.toml
└── Dockerfile
```

### 3.4 Frontend Architecture (Modular)

```
frontend/
├── public/
│   ├── manifest.json
│   ├── service-worker.js
│   └── icons/                   # PWA icons (192x192, 512x512)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/                     # API client (axios/fetch wrappers)
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── transactions.ts
│   │   ├── investments.ts
│   │   └── teams.ts
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # shadcn primitives
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── charts/
│   │   │   ├── SpendingPieChart.tsx
│   │   │   ├── IncomeTrendChart.tsx
│   │   │   └── InvestmentAllocationChart.tsx
│   │   └── forms/
│   │       ├── TransactionForm.tsx
│   │       └── InvestmentForm.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Investments.tsx
│   │   ├── Budgets.tsx
│   │   ├── Team.tsx
│   │   ├── Settings.tsx
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── hooks/                   # Custom React hooks
│   ├── stores/                  # Zustand stores
│   ├── types/                   # TypeScript interfaces
│   └── utils/
├── tests/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── Dockerfile
```

### 3.5 Database Schema (Key Entities)

```
users
  id (UUID, PK)
  email (unique)
  hashed_password
  display_name
  created_at

teams
  id (UUID, PK)
  name
  created_by (FK → users)
  created_at

team_members
  team_id (FK → teams)
  user_id (FK → users)
  role (owner | admin | member)
  joined_at

categories
  id (UUID, PK)
  name
  icon
  is_default (bool)
  user_id (FK → users, nullable — null for defaults)

transactions
  id (UUID, PK)
  user_id (FK → users)
  team_id (FK → teams, nullable)
  category_id (FK → categories)
  type (income | expense)
  amount (decimal)
  description
  date
  is_recurring (bool)
  recurrence_rule (nullable)
  created_at

investments
  id (UUID, PK)
  user_id (FK → users)
  team_id (FK → teams, nullable)
  category (stocks | bonds | crypto | real_estate | mutual_funds | etfs | custom)
  name
  amount_invested (decimal)
  current_value (decimal)
  expected_return_pct (decimal)
  income_allocation_pct (decimal)
  created_at
  updated_at

budgets
  id (UUID, PK)
  user_id (FK → users, nullable — null for team budgets)
  team_id (FK → teams, nullable)
  category_id (FK → categories, nullable — null for overall budgets)
  amount_limit (decimal)
  period (weekly | monthly | quarterly | yearly | custom)
  period_start (date)
  period_end (date, nullable)
  created_at
```

### 3.6 Auth Strategy (Stateless JWT)

- **Access tokens**: short-lived (15 min), signed with a secret key, verified by signature only — never stored server-side.
- **Refresh tokens**: longer-lived (7 days), also stateless and signature-verified. Rotated on each use (old token becomes invalid after new one is issued).
- **No server-side token storage**: tokens are self-contained (user ID, roles, expiry in payload). Validation = signature check + expiry check. No Redis/DB lookup needed.
- **Logout**: client discards tokens. For forced invalidation (e.g., password change), a `token_issued_after` timestamp on the user record rejects tokens issued before that time.

### 3.7 Redis Usage

- **Rate limiting**: per-user and per-IP API rate limits.
- **Real-time notifications**: pub/sub for budget limit warnings pushed via WebSocket.
- **Background task queues**: async jobs (e.g., sending team invite emails, recurring transaction generation).

### 3.8 Observability (Grafana + Prometheus)

- **Prometheus**: scrapes metrics from FastAPI via `prometheus-fastapi-instrumentator`.
  - Request rate, latency histograms (p50/p95/p99), error rates by endpoint.
  - Custom business metrics: transactions created/sec, active users, team sizes.
  - Redis and PostgreSQL exporters for infrastructure metrics.
- **Grafana**: pre-configured dashboards provisioned via config-as-code.
  - **API Performance**: request rate, latency percentiles, error rates, slow endpoints.
  - **Business Metrics**: daily transactions, spending by category, active users, team growth.
  - **Infrastructure**: DB connection pool, query duration, Redis memory/hit rate, container resource usage.
- **Alerting**: Grafana alerts for error rate spikes, high latency, DB connection exhaustion.

### 3.9 API Design (REST, versioned)

All endpoints under `/api/v1/`.

| Resource        | Key Endpoints                                              |
| --------------- | ---------------------------------------------------------- |
| Auth            | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` |
| Users           | `GET /users/me`, `PATCH /users/me`                        |
| Categories      | `GET /categories`, `POST /categories`, `DELETE /categories/:id` |
| Transactions    | `GET /transactions`, `POST /transactions`, `PUT /transactions/:id`, `DELETE /transactions/:id` |
| Investments     | `GET /investments`, `POST /investments`, `PUT /investments/:id`, `DELETE /investments/:id` |
| Budgets         | `GET /budgets`, `POST /budgets`, `PUT /budgets/:id`       |
| Teams           | `POST /teams`, `GET /teams/:id`, `POST /teams/:id/invite`, `GET /teams/:id/members` |
| Analytics       | `GET /analytics/spending`, `GET /analytics/income`, `GET /analytics/investments`, `GET /analytics/balance` |
| Metrics         | `GET /metrics` (Prometheus scrape endpoint)                |

### 3.10 Docker Compose Services

```yaml
services:
  frontend:     # Vite dev / Nginx prod
  backend:      # FastAPI (uvicorn)
  db:           # PostgreSQL 16
  redis:        # Redis 7
  migrate:      # Alembic migrations (run-once)
  prometheus:   # Prometheus (metrics collection)
  grafana:      # Grafana (dashboards & alerting)
```

### 3.11 Testing Strategy

| Layer      | Tool                              | Scope                                   |
| ---------- | --------------------------------- | --------------------------------------- |
| Backend    | pytest + httpx (AsyncClient)      | Unit (services), Integration (API + DB) |
| Backend    | pytest-cov                        | Coverage gate (≥ 80%)                   |
| Frontend   | Vitest + React Testing Library     | Component unit tests, hook tests        |
| Frontend   | Playwright                        | E2E tests (critical flows)              |
| All        | Docker Compose test profile       | Full-stack integration                  |

---

## 4. Non-Functional Requirements

- **Performance**: API responses < 200ms (p95). Analytics queries always hit the DB for fresh data.
- **Security**: bcrypt password hashing, stateless JWT (signature-verified, no server-side storage) with short-lived access tokens (15 min) + refresh tokens (7 days), CORS whitelist, input validation via Pydantic.
- **Observability**: Prometheus metrics + Grafana dashboards for API performance, business metrics, and infrastructure health. Alerting on error spikes and latency degradation.
- **Accessibility**: WCAG 2.1 AA — keyboard navigation, screen reader labels, sufficient contrast.
- **Responsive**: mobile-first CSS; breakpoints at 640, 768, 1024, 1280px.
- **PWA score**: Lighthouse PWA score ≥ 90.

---

## 5. Milestones

| #  | Milestone                        | Scope                                                        |
| -- | -------------------------------- | ------------------------------------------------------------ |
| 1  | Project scaffold & Docker setup  | Dockerized FastAPI + React + Postgres + Redis + Prometheus + Grafana, CI pipeline |
| 2  | Auth & user management           | Register, login, JWT, profile                                |
| 3  | Categories & transactions        | CRUD for spending/income, prepopulated categories            |
| 4  | Visualizations                   | Spending/income charts with date-range filters               |
| 5  | Investments                      | Investment CRUD, portfolio charts, income allocation          |
| 6  | Budgets & limits                 | Personal budgets, limit warnings, progress tracking          |
| 7  | Team collaboration               | Team CRUD, invitations, shared dashboard, member filtering   |
| 8  | Team limits & roles              | Team budgets, role-based access control                      |
| 9  | PWA & mobile polish              | Service worker, manifest, responsive fine-tuning, offline    |
| 10 | Testing & launch prep            | Full test coverage, performance tuning, deployment config    |
