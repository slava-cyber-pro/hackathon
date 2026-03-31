# BudgetSphere — Hackathon Presentation

## The Problem (30 sec)

**People have no single place to track their money.**

- Expenses are scattered across bank apps, spreadsheets, and memory
- Couples and roommates can't see shared spending in one view
- Investment tracking is separate from daily budgeting
- No quick way to log a purchase — you need to open an app, navigate menus, fill forms

**BudgetSphere** = one place for spending, income, investments, budgets, and team collaboration. Web app + Telegram bot. Works on any device.

---

## The First Prompt (30 sec)

Started with 3 documents that guided the entire build:

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Implementation rules — code style, architecture patterns, testing strategy, security requirements |
| `PROJECT_OVERVIEW.md` | Feature spec — 6 core modules, 10 milestones, detailed DB schema |
| `ARCHITECTURE.md` | Technical design — service map, API contracts, stack decisions |

**Key CLAUDE.md rules that shaped the codebase:**
- "Every function does one thing, max ~20 lines"
- "No business logic in routes — routes validate, call service, return response"
- "Stateless JWT only — never store tokens in Redis or DB"
- "Minimum 80% test coverage enforced"

---

## The Build Montage (60 sec)

### Architecture at a Glance

```
Frontend (React+TS)  →  Backend (FastAPI)  →  PostgreSQL
     ↕                      ↕                     ↕
  TanStack Query        Prometheus           Alembic Migrations
  Zustand stores        Grafana+Loki
  Recharts              Redis (rate limit, queues)
  Tailwind+dark mode    Telegram Bot
```

### By the Numbers

| Metric | Count |
|--------|-------|
| Lines of Code | **11,400+** |
| API Endpoints | **39** |
| React Components | **35** |
| Docker Services | **10** |
| Database Models | **9** |
| Tests (unit + integration + E2E) | **228** |
| Frontend Pages | **10** |

### Build Timeline (Key Moments)

1. **Scaffold** — Docker Compose with 7 services, full project structure, Alembic initial migration
2. **UI Design** — 30 screens generated in Stitch (light + dark, desktop + mobile)
3. **Backend** — All models, schemas, services, routes built in parallel with 4 agents
4. **Frontend** — 9 pages, 35 components, all connected to real API
5. **Security Audit** — JWT hardening, rate limiting, CORS lockdown, input validation, ownership checks
6. **Team Features** — Shared data, role-based access, budget limits per team
7. **Market Data** — Live stock/crypto/commodity prices from yfinance + CoinGecko
8. **Telegram Bot** — Quick-add expenses, budget tracking, account linking via Redis tokens
9. **Observability** — Prometheus metrics, Grafana dashboards, Loki logs, 8 alert rules
10. **Testing** — 108 backend + 101 frontend + 19 E2E = 228 tests, all green

---

## The Live Demo (90 sec)

### Demo Script

**1. Register & Dashboard (15 sec)**
- Register at `/register` → auto-login → dashboard with greeting, 4 summary cards, charts

**2. Add Transaction (15 sec)**
- Click "Add Transaction" → type toggle (Income/Expense) → amount → category picker (with custom category creation) → save
- Transaction appears in filtered list with category badge

**3. Investments + Market (20 sec)**
- Portfolio tab: holdings with live prices (auto-refresh 60s), sparkline charts, P&L
- Market tab: browse Stocks/Crypto/Commodities/Indices/Forex/Bonds with real prices
- Click asset → price chart with period selector → "Add to Portfolio" pre-fills form

**4. Budgets (10 sec)**
- Set budget limit → progress bar shows spent vs limit → amber at 80%, red when exceeded
- Dashboard shows budget usage section

**5. Team Collaboration (15 sec)**
- Create team → invite member by email → both see each other's transactions/budgets
- User filter on Dashboard and Transactions → "All Members" / "My Data" / specific member

**6. Telegram Bot (10 sec)**
- Settings → Generate Link Token → paste in Telegram → `/link TOKEN`
- Send `50 groceries lunch` → bot confirms `✅ -$50.00 Groceries — lunch`
- `/budget` → text progress bars for all budgets

**7. Dark Mode + Currency (5 sec)**
- Toggle dark mode from sidebar → entire app switches instantly
- Change currency to EUR → all amounts convert using live exchange rates

---

## Lessons Learned (60 sec)

### What Surprised Us

1. **Parallel agents are a superpower** — 4 agents building backend services simultaneously, 3 agents writing tests in parallel. What would take hours sequentially took minutes.

2. **CLAUDE.md is the real product** — The implementation guide we wrote upfront saved us from architectural drift. Every agent followed the same patterns because the rules were clear.

3. **The "last 20%" is 80% of the work** — Basic CRUD was fast. Team data sharing, budget spent calculations, market data integration, and cross-user authorization took the most time.

4. **Test-first thinking prevents debt** — We caught response shape mismatches, missing eager loads, and race conditions because tests failed immediately when APIs changed.

5. **Real APIs are messy** — yfinance is synchronous (needed `asyncio.to_thread`), CoinGecko wraps responses differently than expected, and some tickers just don't have data. Graceful degradation was essential.

### Tech Stack Decisions That Paid Off

| Decision | Why It Worked |
|----------|---------------|
| Stateless JWT | Zero Redis/DB lookups for auth — just signature check |
| TanStack Query | Cache invalidation after mutations "just worked" |
| Docker host networking | Avoided iptables issues, all services on localhost |
| Redis for rate limiting + link tokens | Simple, fast, TTL-based — perfect fit |
| Pydantic schemas per operation | Create/Update/Response separation caught bugs early |

### What We'd Do Differently

- Start with shadcn/ui instead of building custom components
- Add WebSocket for real-time budget warnings
- Use a job scheduler for periodic price updates instead of on-demand

---

## Architecture Summary

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Frontend    │────▶│  Backend    │────▶│  PostgreSQL  │
│  React+TS   │     │  FastAPI    │────▶│  9 tables    │
│  :5173       │     │  :8000      │     └──────────────┘
└─────────────┘     └──────┬──────┘     ┌──────────────┐
                           │────────────▶│  Redis       │
┌─────────────┐            │             └──────────────┘
│  TG Bot     │────────────┘
│  python     │            ┌──────────────┐
└─────────────┘            │  Prometheus  │──▶ Grafana
                           │  Loki       │──▶ Dashboards
                           │  Promtail   │──▶ Alerts
                           └──────────────┘
```

**10 Docker services, 228 tests, 11,400+ LOC, built with Claude Code.**
