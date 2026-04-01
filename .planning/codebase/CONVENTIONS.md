# Conventions Map

## Backend Coding Conventions
- Module naming follows snake_case (for example `src/data_processor.py`, `src/stripe_routes.py`).
- Route handlers are mostly function-based FastAPI endpoints inside `app.py` or APIRouters.
- Request payload schemas for auth/checkout use Pydantic models (`RegisterRequest`, `LoginRequest`, `CheckoutRequest`).
- DB access pattern:
  - Injected session dependency via `Depends(get_db)` from `src/database.py`.
  - Query/update through SQLAlchemy ORM models in `src/models.py`.
- Error handling style:
  - HTTP-facing errors use `HTTPException`.
  - Integration/internal failures are often printed and converted to simple error responses.

## Frontend Coding Conventions
- Client components opt in using `"use client"` at top of file.
- Auth/session handling is token-based in browser storage (`localStorage` key `token`).
- API calls centralized in `web/src/services/api.ts`.
- Response handling pattern in API helpers:
  - Throw `Error` with backend `detail` if available.
  - Redirect to `/login` on 401 for selected endpoints.
- Route organization follows Next.js App Router conventions under `web/src/app/*`.

## Styling Conventions
- Tailwind v4 with custom tokenized theme variables in `web/src/app/globals.css`.
- Shared utility classes (`btn-primary`, `card`, `input`, etc.) are used instead of repeating style blocks.
- Visual language is high-contrast dark-first with accent-driven status color tokens.

## API Surface Conventions
- Auth API mounted under `/api/auth/*` from `src/auth_routes.py`.
- Payments API mounted under `/api/stripe/*` from `src/stripe_routes.py`.
- Main domain endpoints (`/api/upload`, `/api/draft`, `/api/send-all`, etc.) remain in `app.py`.
- JSON field names in API responses are snake_case in backend and consumed as-is in frontend types.

## Operational Conventions
- Environment values are loaded from `.env` through `python-dotenv`.
- Startup migration checks are embedded in app startup (not managed by Alembic yet).
- Local dev defaults:
  - Frontend expected at `http://localhost:3000`.
  - Backend expected at `http://localhost:8000`.

## Inconsistencies Worth Tracking
- Some comments and route logic in `app.py` indicate evolving/refactor-in-progress state.
- Both modern DB-backed tracking and legacy file tracking are maintained in parallel.
- Logout semantics in frontend/backend are partly client-only (`localStorage` removal).
