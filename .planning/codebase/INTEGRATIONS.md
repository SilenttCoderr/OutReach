# Integrations Map

## External Services Overview
- Google OAuth/OpenID for user authentication (`src/auth.py`, `src/auth_routes.py`).
- Gmail API for draft creation and sending (`src/gmail_client.py`, `app.py`).
- Google Gemini (GenAI) for personalized email generation (`src/llm_generator.py`).
- Stripe Checkout and webhook credit fulfillment (`src/stripe_routes.py`).
- Optional Cloudflare R2/S3-compatible upload backup (`src/storage.py`, upload flow in `app.py`).

## Authentication Providers
### Google OAuth
- Initiation endpoint: `GET /api/auth/google` in `src/auth_routes.py`.
- Callback endpoint: `GET /api/auth/callback` in `src/auth_routes.py`.
- Required env vars:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `FRONTEND_URL`
  - `SESSION_SECRET`
- Token persistence:
  - Access/refresh tokens and expiry stored on `users` table fields (`src/models.py`).

### JWT Session Layer
- JWT creation and verification in `src/auth.py`.
- Bearer token consumed by backend dependencies in routes via `require_auth`.
- Frontend stores token in `localStorage` and attaches header from `web/src/services/api.ts`.

## Messaging Integrations
### Gmail API
- Client encapsulation in `src/gmail_client.py`.
- OAuth scopes used:
  - `gmail.send`
  - `gmail.compose`
- Primary operations:
  - Create draft (`users.drafts.create`)
  - Send draft (`users.drafts.send`)
  - Send direct message (`users.messages.send`)
- Invocation points:
  - Draft generation endpoint `POST /api/draft` in `app.py`.
  - Single send endpoint `POST /api/send/{draft_id}` in `app.py`.
  - Batch send endpoint `POST /api/send-all` in `app.py`.

### Gemini API
- Used only in LLM mode (toggle from frontend or CLI).
- Generator implementation in `src/llm_generator.py`.
- Required env var: `GEMINI_API_KEY`.
- Fallback behavior: if LLM call fails, module returns a static fallback email template.

## Payments Integration
### Stripe
- Checkout session creation endpoint: `POST /api/stripe/create-checkout-session` in `src/stripe_routes.py`.
- Webhook endpoint: `POST /api/stripe/webhook` in `src/stripe_routes.py`.
- Credits fulfillment logic updates `users.credits` on `checkout.session.completed`.
- Required env vars:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - optional `STRIPE_PRICE_ID_CREDITS`

## Storage And Data Integrations
- Primary database:
  - Local: SQLite file `cold_outreach.db`.
  - Production: PostgreSQL URL via `DATABASE_URL`.
- Optional object storage backup for uploads in `src/storage.py`.
- CSV ingest via pandas in `src/data_processor.py`.

## Integration Guardrails
- CORS configured in `app.py` using `FRONTEND_URL` and optional `FRONTEND_URL_EXTRA`.
- Rate limits enforced on sensitive send/draft endpoints using `slowapi` in `app.py`.
- Stripe webhook verifies signature before processing.
