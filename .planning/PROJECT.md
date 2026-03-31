# OutreachPro Platform Hardening

## What This Is

OutreachPro is an AI-assisted cold outreach product with a Next.js frontend (Vercel) and a FastAPI backend (Render). It already supports auth, CSV contact ingestion, draft generation, Gmail send, and credit-based billing. This initiative focuses on making the production deployment path resilient, modular, and maintainable via clean architecture boundaries.

## Core Value

Users can reliably run end-to-end outreach campaigns in production without auth, billing, or email-delivery regressions during deploys.

## Requirements

### Validated

- ✓ User authentication works via email/password and Google OAuth — existing
- ✓ Contact import from CSV persists into DB-backed contacts — existing
- ✓ Draft generation and send lifecycle exists with Gmail integration — existing
- ✓ Credits and checkout flow exist via Stripe integration — existing

### Active

- [ ] Backend is modularized into clear layers (API, application, domain, infrastructure)
- [ ] Deployment to Render/Vercel is deterministic and rollback-safe
- [ ] Runtime observability is sufficient to detect and triage production incidents quickly
- [ ] Auth, secrets, and token handling are hardened for production
- [ ] CI and verification gates prevent high-risk regressions before deploy

### Out of Scope

- Building new user-facing growth features — this cycle is architecture and reliability focused
- Replatforming away from FastAPI or Next.js — current stack remains in place
- Migrating frontend host away from Vercel or backend host away from Render — optimize existing deployment model

## Context

- Current system is brownfield with working behavior concentrated in `app.py` and service modules under `src/`.
- Frontend and backend are deployed separately (`web/` to Vercel, root API to Render).
- Existing codebase map now lives in `.planning/codebase/*.md` and should be treated as canonical for this milestone.
- There is known architectural drift from rapid iteration:
  - large backend entrypoint
  - mixed legacy/modern flows
  - dependency sensitivity in auth stack

## Constraints

- **Hosting**: Frontend must remain on Vercel and backend on Render — existing ops setup and DNS are already aligned.
- **Stack**: FastAPI + SQLAlchemy + Next.js remain the primary stack — avoid high-risk rewrite.
- **Compatibility**: Existing auth, Gmail, and Stripe flows must remain backward compatible — user-facing continuity is mandatory.
- **Security**: Secret and token handling must satisfy production-safe defaults — deployment hardening cannot weaken auth.
- **Delivery**: Improvements should be phased with deploy-safe increments — avoid big-bang refactors.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Prioritize reliability and modularity before new features | Current risk is operational fragility, not feature scarcity | — Pending |
| Keep Vercel + Render deployment topology | Already in place and sufficient for current scale | — Pending |
| Refactor incrementally behind stable API contracts | Reduce migration risk while improving architecture | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-31 after initialization*
