# Structure Map

## Top-Level Layout
- `app.py`: Main FastAPI app, middleware, startup, and core API endpoints.
- `src/`: Backend modules (auth, DB, models, generators, Gmail, Stripe, storage).
- `web/`: Next.js frontend app.
- `scripts/`: Utility scripts and legacy CLI helpers.
- `tests/`: Backend tests and visual smoke script.
- `docs/`: Operational docs (onboarding, launch checklist, guides).
- `config/`: Profile/config data consumed by generators.
- `data/`: CSV samples and local tracking artifacts.
- `templates/`: Jinja text templates for non-LLM email generation.

## Backend Directory (`src/`)
- `src/auth.py`: JWT, password hashing, OAuth registration.
- `src/auth_routes.py`: Auth API router mounted under `/api/auth`.
- `src/database.py`: Engine/session setup and dependency provider.
- `src/models.py`: SQLAlchemy models (`User`, `Contact`, `EmailLog`).
- `src/data_processor.py`: CSV/JSON ingestion and Apollo format conversion.
- `src/email_generator.py`: Jinja-based deterministic email generation.
- `src/llm_generator.py`: Gemini-based dynamic generation + logging.
- `src/gmail_client.py`: Gmail API wrapper for draft/send operations.
- `src/stripe_routes.py`: Stripe checkout + webhook fulfillment router.
- `src/tracker.py`: Legacy file-based send tracker.

## Frontend Directory (`web/src/`)
- `web/src/app/`: App Router pages and nested routes.
- `web/src/app/dashboard/`: Authenticated dashboard experience.
- `web/src/app/login/` and `web/src/app/signup/`: entry auth views.
- `web/src/components/layout/`: shared header/sidebar shell.
- `web/src/components/ui/`: reusable button/card/input components.
- `web/src/services/api.ts`: API adapter and request helpers.
- `web/src/lib/utils.ts`: frontend utility helpers.

## Runtime And Generated Directories
- `uploads/`: runtime-uploaded user files and optional attachments.
- `logs/`: runtime and screenshot artifacts.
- `web/.next/`: Next.js build/dev output (generated).
- `.venv/`: Python virtual environment (local generated).
- `__pycache__/`: Python bytecode cache (generated).

## Infra/Config Files
- `requirements.txt`: Python dependency manifest.
- `web/package.json`: frontend dependency and script manifest.
- `Dockerfile`: backend container recipe.
- `Procfile`: process command for PaaS deployment.
- `vercel.json`: frontend deployment settings.
- `web/next.config.ts`: Next.js rewrite config for local API routing.

## Naming And Organization Notes
- Backend naming is Pythonic snake_case for modules/functions.
- Frontend naming uses lowercase route folders and TS/React component files.
- API endpoints consistently begin with `/api/*` from backend perspective.
- Router modularity is partial: auth and stripe are split; many core routes still live in `app.py`.
