---
name: Stateless JWT auth — no token storage
description: Never store tokens in Redis/DB. Use stateless signature-verified JWT only. Analytics must always query fresh data from DB.
type: feedback
---

Never store JWT tokens (access or refresh) server-side in Redis or DB. Tokens must be fully stateless — validated by signature verification and expiry check only.

**Why:** User considers server-side token storage a bad architectural approach. Tokens are self-contained; storing them adds unnecessary complexity and a false sense of control.

**How to apply:** When implementing auth, use `python-jose` or `PyJWT` for signing/verifying. No token blacklist tables, no Redis token cache. For forced invalidation (password change), use a `token_issued_after` timestamp on the user model. Also: never cache analytics/chart data in Redis — always query the DB for fresh results.
