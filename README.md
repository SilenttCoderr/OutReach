# OutreachPro

OutreachPro is a career-outreach workspace for organising contacts, generating tailored email drafts, reviewing every message, and sending through the user's connected Gmail account.

The live frontend is available at [out-reach-gamma.vercel.app](https://out-reach-gamma.vercel.app).

## What it does

- Google sign-in and Gmail connection
- Contact import from CSV or manual entry
- Campaign creation with optional PDF context, email templates, and writing prompt presets
- AI-assisted draft generation using the user profile and chosen campaign context
- A review desk that caches drafts locally and refreshes while the tab is active
- Direct Gmail sending and clear guidance for Gmail's manual scheduled-send flow
- Personal profile, skills, highlights, sign-off, credits, and account settings
- Personal email-template and AI-prompt libraries

## Stack

- Frontend: Next.js 16, React 19, Tailwind CSS, GSAP, Framer Motion
- Backend: FastAPI, SQLAlchemy, PostgreSQL (SQLite is supported locally)
- Integrations: Google OAuth/Gmail API, Gemini, Stripe, Resend
- Hosting: Vercel for the frontend and Render for the API/database Blueprint

## Repository layout

```text
app.py              FastAPI application entrypoint
src/                Backend routes, services, models, and integrations
tests/              Backend API and service tests
web/                Next.js frontend and Playwright tests
render.yaml         Render API + PostgreSQL Blueprint
.github/workflows/  Continuous integration
```

## Run locally

### 1. Backend

Requirements: Python 3.11+ and a Google OAuth client configured for local development.

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

On macOS/Linux, activate the environment with `source .venv/bin/activate` and copy the environment file with `cp .env.example .env`.

### 2. Frontend

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`. The frontend proxies API requests to `http://127.0.0.1:8000` in local development.

## Environment

Copy `.env.example` to `.env` and fill in the required values. The important production settings are:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (SQLite is used locally when omitted) |
| `FRONTEND_URL` | Public Vercel URL, used for CORS and OAuth redirects |
| `SECRET_KEY`, `JWT_SECRET`, `SESSION_SECRET` | Independent high-entropy application secrets |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth and Gmail access |
| `GEMINI_API_KEY` | Draft generation |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Credits and billing |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Password-reset email |

Never commit `.env`, OAuth credentials, Gmail tokens, or production database exports.

## Quality checks

Frontend:

```bash
cd web
npm run lint
npm run ui:guard
npm run build
npm run test:e2e:smoke
```

Backend:

```bash
python -m pytest tests
```

## Deploy

### Vercel frontend

The Vercel project root is `web/`. Set `NEXT_PUBLIC_API_URL` to the public Render API URL, then deploy from the `main` branch.

### Render API

Create a Render Blueprint from `render.yaml`. Set the required secrets in Render and make sure `FRONTEND_URL` exactly matches the production Vercel domain. Verify the release with:

```bash
curl https://your-render-service.onrender.com/health
```

### Google OAuth

In Google Cloud Console, add the production callback URL:

```text
https://your-render-service.onrender.com/api/auth/callback
```

Add the Vercel domain to the OAuth consent screen's authorised domains, and configure the same frontend URL in Render.

## License

Private project. All rights reserved.
