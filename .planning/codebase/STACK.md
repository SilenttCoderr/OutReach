# Stack Map

## Runtime
- Backend runtime: Python 3.x (local venv currently 3.14 in this workspace), deployed with `uvicorn`.
- Frontend runtime: Node.js (README asks for Node 18+, local machine currently Node 24 from npm logs).
- API server process entrypoint: `app.py` and `Procfile` (`uvicorn app:app`).
- Frontend app entrypoint: `web/src/app/layout.tsx` with App Router pages in `web/src/app`.

## Backend Frameworks And Libraries
- Web framework: FastAPI (`fastapi`), ASGI server `uvicorn`.
- ORM and database: SQLAlchemy with `sqlite:///./cold_outreach.db` fallback in `src/database.py`.
- Auth and security libs:
  - JWT: `python-jose[cryptography]` in `src/auth.py`.
  - Password hashing: `passlib[bcrypt]` plus `bcrypt<4.1` pin in `requirements.txt`.
  - OAuth client: `Authlib` (Google OAuth flow in `src/auth.py`, `src/auth_routes.py`).
- Integrations:
  - Gmail APIs: `google-api-python-client`, `google-auth-*` in `src/gmail_client.py`.
  - Gemini: `google-genai` in `src/llm_generator.py`.
  - Payments: `stripe` in `src/stripe_routes.py`.
  - Optional storage: `boto3` in `src/storage.py`.
- Data/template tooling: `pandas`, `jinja2`, `python-dotenv`, `click`, `rich`.

## Frontend Frameworks And Libraries
- Framework: Next.js App Router (`next` 16.1.4) in `web/package.json`.
- UI libraries: React 19, Lucide icons, Framer Motion.
- Styling: Tailwind CSS v4 with design tokens in `web/src/app/globals.css`.
- Language/tooling:
  - TypeScript strict mode in `web/tsconfig.json`.
  - ESLint flat config in `web/eslint.config.mjs`.

## Build And Deployment Surface
- Backend container build: `Dockerfile` (Python 3.11 slim + `pip install -r requirements.txt`).
- Backend process for PaaS: `Procfile` and direct `uvicorn` command in `app.py`.
- Frontend hosting settings: `vercel.json` and `web/next.config.ts`.
- Dev proxy behavior:
  - If `NEXT_PUBLIC_API_URL` is missing, `web/next.config.ts` rewrites `/api/*` to `http://127.0.0.1:8000/api/*`.

## Config And Environment
- Primary environment template: `.env.example`.
- Key runtime config loaded at startup via `dotenv` in `app.py` and other modules.
- Config/data artifacts in repo:
  - Profile config: `config/profile.json`.
  - Sample data and trackers: `data/*.csv`, `data/tracking.json`.

## Notable Version Constraints
- `bcrypt<4.1` is required with current `passlib` usage to keep register/login stable.
- Next.js app currently aligned to `next` 16.x + React 19.x.
- SQLAlchemy is 2.x and code is written with 2.x style session/query usage.
