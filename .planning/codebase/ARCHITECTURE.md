# Architecture Map

## System Shape
- Monorepo with two primary runtime surfaces:
  - FastAPI backend at repo root (`app.py`, `src/*`).
  - Next.js frontend in `web/` (`web/src/app/*`, `web/src/services/api.ts`).
- Supporting legacy CLI flow remains in `scripts/cli.py` and `src/tracker.py`.

## Backend Layering
- API composition and middleware are centralized in `app.py`.
- Domain/service modules are in `src/`:
  - Auth: `src/auth.py`, `src/auth_routes.py`
  - Payments: `src/stripe_routes.py`
  - Data and generation: `src/data_processor.py`, `src/email_generator.py`, `src/llm_generator.py`
  - Email transport: `src/gmail_client.py`
  - Persistence: `src/database.py`, `src/models.py`
- Database table creation and startup migration checks run in `@app.on_event("startup")` inside `app.py`.

## Frontend Layering
- Route-based UI in `web/src/app/*` (public pages + dashboard sections).
- Shared shell and navigation in `web/src/components/layout/*`.
- UI primitives in `web/src/components/ui/*`.
- API boundary concentrated in `web/src/services/api.ts`.

## Request/Response Flow
1. Browser page invokes service function from `web/src/services/api.ts`.
2. Service resolves `API_BASE_URL` from `NEXT_PUBLIC_API_URL` with `/api` normalization.
3. Request reaches FastAPI endpoint in `app.py` or included routers (`src/auth_routes.py`, `src/stripe_routes.py`).
4. Route dependencies enforce auth and DB session (`require_auth`, `get_db`).
5. SQLAlchemy persists/retrieves rows from `users`, `contacts`, `email_logs` in `src/models.py`.
6. JSON response returns to frontend for render.

## Authentication Data Flow
- Email/password:
  - Register/login endpoints in `src/auth_routes.py`.
  - Hash/verify in `src/auth.py` using passlib+bcrypt.
  - JWT returned and stored client-side in `localStorage`.
- Google OAuth:
  - OAuth redirect and callback in `src/auth_routes.py`.
  - OAuth tokens persisted in DB user record.

## Campaign Pipeline Flow
1. CSV upload endpoint (`POST /api/upload`) parses file with `DataProcessor`.
2. Contact rows are inserted into `contacts` table if not already present.
3. Draft generation endpoint (`POST /api/draft`) loads new contacts, checks credits, generates body (template or LLM), and creates Gmail drafts.
4. Each draft is logged in `email_logs` with status and Gmail draft id.
5. Send endpoints move draft records to sent status after Gmail API response.

## Async And Background Work
- FastAPI background task used for:
  - Upload backup to object storage.
  - Batch send queue in `POST /api/send-all`.
- LLM module has async-aware logging with thread pool offload in `src/llm_generator.py`.

## Architectural Notes
- Hybrid state model exists:
  - DB-backed tracking (`email_logs`) in API flow.
  - File-backed tracking (`data/tracking.json`) in CLI flow.
- This dual-path architecture is functional but increases maintenance complexity.

## Target Architecture Contract
- Target layer contract is defined in `docs/ARCHITECTURE_CONTRACT.md`.
- Dependency direction to enforce during modularization: `API -> Application -> Domain`.
