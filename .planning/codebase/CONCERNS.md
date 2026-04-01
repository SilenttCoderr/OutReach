# Concerns Map

## High Priority Concerns
- Duplicate route definitions for auth status:
  - `src/auth_routes.py` defines `GET /auth/status` (mounted to `/api/auth/status`).
  - `app.py` also defines `GET /api/auth/status`.
  - Duplicate endpoints increase ambiguity and maintenance risk.
- Authentication token storage uses browser `localStorage` in `web/src/services/api.ts`.
  - This is vulnerable to token exfiltration if XSS is introduced.
- Password hashing stack is dependency-sensitive.
  - `passlib[bcrypt]` required pin `bcrypt<4.1` to avoid runtime register failures.
  - Future dependency updates can silently break auth without lockfile discipline.

## Medium Priority Concerns
- Mixed state systems increase complexity:
  - API path is DB-driven (`email_logs`, `contacts`) via `src/models.py`.
  - CLI path is file-driven via `src/tracker.py` and `data/tracking.json`.
  - Risk of divergence and inconsistent user-visible history.
- `app.py` has grown into a very large multi-responsibility file.
  - Routing, migration checks, upload pipeline, draft/send orchestration, and utility endpoints are all co-located.
- Gmail token refresh TODO exists in `src/gmail_client.py`.
  - Refreshed access tokens are not persisted back to DB in current flow.

## Operational And Security Concerns
- Startup migration strategy is ad-hoc in `app.py`.
  - Column existence checks are helpful for bootstrap but do not replace tracked migrations.
- Webhook handling in `src/stripe_routes.py` relies on configured signing secret.
  - Misconfiguration can either break fulfillment or allow unsafe assumptions in non-prod setups.
- Rate limiting is applied to send/draft endpoints but not explicitly to register/login endpoints.

## Reliability Concerns
- Background send task in `POST /api/send-all` loops over captured drafts and sleeps between sends.
  - Long-running background work can fail silently without durable job tracking.
- External integration errors are often logged with `print` rather than structured logging/alerting.
- Frontend API error handling is mostly string-based and may hide actionable backend diagnostics.

## Testing And Validation Concerns
- Current tests focus on selected endpoints with mocked DB behavior.
- No broad integration test validates complete upload -> draft -> send lifecycle.
- No frontend automated tests assert auth/session edge cases.

## Repo Hygiene Concerns
- Generated/runtime artifacts exist in workspace (`.venv/`, `web/.next/`, local DB file, uploads/logs).
- If not consistently ignored, these can create noisy diffs and accidental commits.
- Search results can become noisy unless generated paths are excluded during audits.

## Recommended Next Actions
- Consolidate duplicate `/api/auth/status` implementation into one source of truth.
- Move from localStorage token auth to HTTP-only cookies if threat model requires stronger XSS resilience.
- Add proper migration tooling (for example Alembic) and versioned schema changes.
- Add CI checks that install deps fresh and run auth regression tests.
- Split `app.py` routes into module routers for maintainability.
