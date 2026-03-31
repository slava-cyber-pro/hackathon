from prometheus_client import Counter, Histogram, Gauge

# ── Business Metrics ──────────────────────────────────────────

users_registered_total = Counter(
    "budgetsphere_users_registered_total",
    "Total number of user registrations",
)

logins_total = Counter(
    "budgetsphere_logins_total",
    "Total number of login attempts",
    ["status"],  # "success" or "failure"
)

transactions_created_total = Counter(
    "budgetsphere_transactions_created_total",
    "Total transactions created",
    ["type"],  # "income" or "expense"
)

investments_created_total = Counter(
    "budgetsphere_investments_created_total",
    "Total investments created",
    ["category"],
)

teams_created_total = Counter(
    "budgetsphere_teams_created_total",
    "Total teams created",
)

# ── Performance Metrics ───────────────────────────────────────

db_query_duration = Histogram(
    "budgetsphere_db_query_duration_seconds",
    "Database query duration in seconds",
    ["operation"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0],
)

active_websocket_connections = Gauge(
    "budgetsphere_active_websocket_connections",
    "Number of active WebSocket connections",
)
