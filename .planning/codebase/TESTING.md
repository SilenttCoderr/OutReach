# Testing Map

## Current Test Assets
- Backend API tests: `tests/test_api.py` (pytest + FastAPI TestClient + MagicMock overrides).
- Visual smoke script: `tests/visual_recon.py` (Playwright screenshots for `/`, `/login`, `/dashboard`).
- Utility/auth helper scripts in `scripts/` support manual verification flows:
  - `scripts/test_gmail_auth.py`
  - `scripts/simulate_webhook.py`
  - `scripts/check_db_tokens.py`

## Frameworks And Tooling
- Python test framework: `pytest` (used directly in `tests/test_api.py`).
- API test harness: `fastapi.testclient.TestClient`.
- Browser/UI smoke checks: `playwright.sync_api` in standalone script.
- Frontend linting exists (`web/eslint.config.mjs`) but no dedicated frontend unit/e2e test suite is present.

## Backend Coverage Characteristics
- Covered areas in `tests/test_api.py`:
  - `/api/stats`
  - `/api/contacts`
  - `/api/history`
  - `/api/send-all`
  - stripe webhook path with mocked construct_event
- Approach:
  - Dependency override of auth and DB providers.
  - Mostly schema/status behavior assertions.

## Observed Gaps
- Auth flow tests for register/login/google callback are missing.
- Credit deduction and insufficient credit behavior in `/api/draft` is mostly untested.
- Gmail integration paths are not isolated with robust API mocks.
- Frontend user flows (`/signup`, `/login`, dashboard actions) lack automated assertions.
- No CI workflow detected to run tests automatically on push/PR.

## Suggested Execution Commands
- Backend tests (from repo root):
  - `pytest tests/test_api.py -v`
- Visual smoke run:
  - `python tests/visual_recon.py`
- Frontend static checks:
  - `cd web && npm run lint`

## Quality Improvement Opportunities
- Add auth integration tests for both email/password and OAuth callback handling.
- Add database-backed integration tests for draft/send lifecycle.
- Add frontend e2e tests (Playwright) for signup/login/dashboard happy paths.
- Add regression tests for dependency-sensitive auth hashing behavior (bcrypt/passlib pin).
- Introduce CI to run backend tests + frontend lint + minimal smoke tests.
