# Roadmap: OutreachPro Platform Hardening

## Overview

This roadmap upgrades OutreachPro from a fast-moving brownfield codebase to a production-hardened system with cleaner architecture boundaries, safer deployment practices on Vercel/Render, and stronger verification gates. The sequence prioritizes risk reduction first (baseline, contracts, and deployment safety), then executes modularization and reliability hardening in controlled phases.

## Clean View

### Completed Phases
- Phase 1: Baseline and Deployment Contracts (complete)
- Phase 2: Backend Modularization Pass (complete)
- Phase 2.1: Frontend Refinement and Ship Readiness (complete)
- Phase 3: Data and Pipeline Cohesion (complete)

### Remaining Queue (Execution Order)
1. Phase 4: Security and Auth Hardening
2. Phase 5: Observability and Runtime Reliability
3. Phase 6: CI, Runbooks, and Release Safety

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Baseline and Deployment Contracts** - Establish production baselines, env contracts, and target clean architecture boundaries.
 (completed 2026-03-31)
- [x] **Phase 2: Backend Modularization Pass** - Decompose `app.py` orchestration into modular service and router layers.
 (completed 2026-04-01)
- [x] **Phase 2.1: Frontend Refinement and Ship Readiness (INSERTED)** - Refine UI quality, harden UX flows, and add frontend release gates.
 (completed 2026-04-08)
- [x] **Phase 3: Data and Pipeline Cohesion** - Unify tracking/state flows and stabilize send pipeline behavior.
 (completed 2026-04-07)
- [ ] **Phase 3.1: Draft Management and Gmail Sync (INSERTED)** - Allow UI to edit/delete drafts and two-way sync deletion state with Gmail API.
- [ ] **Phase 4: Security and Auth Hardening** - Harden token, secret, OAuth, and auth endpoint behavior.
- [ ] **Phase 5: Observability and Runtime Reliability** - Add structured logging, dependency-aware health, and operational visibility.
- [ ] **Phase 6: CI, Runbooks, and Release Safety** - Enforce verification gates and deployment rollback readiness.

## Phase Details

### Phase 1: Baseline and Deployment Contracts
**Goal**: Define architecture target, deployment contracts, and baseline checks that prevent known runtime/dependency failures.
**Depends on**: Nothing (first phase)
**Requirements**: [ARCH-01, DEPL-01, DEPL-02, DEPL-04, QUAL-03]
**Success Criteria** (what must be TRUE):
  1. Architecture contract document exists with explicit layer boundaries and dependency rules.
  2. Startup validation enforces required env vars and fails loudly with actionable diagnostics.
  3. Render/Vercel environment mapping is documented and tested for dev/preview/prod parity.
  4. Dependency compatibility guardrails exist for auth-critical packages.
**Plans**: 3 plans

Plans:
- [x] 01-01: Capture baseline architecture and runtime contracts
- [x] 01-02: Implement env/dependency preflight checks
- [x] 01-03: Align deployment config and ignore/build hygiene

### Phase 2: Backend Modularization Pass
**Goal**: Move orchestration out of `app.py` into modular routers/services while preserving API behavior.
**Depends on**: Phase 1
**Requirements**: [ARCH-02, ARCH-03]
**Success Criteria** (what must be TRUE):
  1. `app.py` acts as composition root with minimal business logic.
  2. Core flows are routed through modular services with clear interfaces.
  3. Existing endpoint contracts remain backward compatible for frontend clients.
**Plans**: 3/3 plans complete

Plans:
- [x] 02-01: Extract route groups and shared dependencies
- [x] 02-02: Introduce application service layer for campaign/auth/billing orchestration
- [x] 02-03: Refactor integration adapters behind infrastructure boundaries

### Phase 02.1: Frontend Refinement and Ship Readiness (INSERTED)

**Goal**: Refine public and dashboard UX into a release-ready frontend with automated quality gates for critical user flows.
**Requirements**: [DEPL-02, DEPL-03, QUAL-01, QUAL-02]
**Depends on:** Phase 2
**Success Criteria** (what must be TRUE):
  1. Public marketing/auth pages are visually consistent, responsive, and lint-clean.
  2. Dashboard core workflows (contacts -> drafts -> send + profile updates) have stable state handling and no type/lint bypasses.
  3. Frontend CI gates enforce lint/build/smoke checks before merge.
  4. Launch checklist includes explicit frontend UAT sign-off against deployed environment.
**Plans:** 7/7 plans complete

Plans:
- [x] 02.1-01-PLAN.md - Harden frontend API/session boundary and auth/checkout behavior
- [x] 02.1-02-PLAN.md - Refine public marketing and auth UI consistency
- [x] 02.1-03-PLAN.md - Polish dashboard workflows and shell behavior
- [x] 02.1-04-PLAN.md - Harden accessibility semantics for icon-only and binary dashboard controls
- [x] 02.1-05-PLAN.md - Add shared state messaging and destructive-flow safety guards
- [x] 02.1-06-PLAN.md - Consolidate visual token usage and add style guard automation
- [x] 02.1-07-PLAN.md - Add frontend release gates, smoke tests, and UAT sign-off

### Phase 3: Data and Pipeline Cohesion
**Goal**: Remove mixed legacy/modern tracking ambiguity and make send pipeline state transitions consistent.
**Depends on**: Phase 2
**Requirements**: [ARCH-04]
**Success Criteria** (what must be TRUE):
  1. There is one canonical send tracking source of truth.
  2. Draft/send state transitions are deterministic and observable.
  3. Legacy path behavior is either isolated, migrated, or explicitly deprecated.
**Plans**: 2/2 plans complete

Plans:
- [x] 03-01: Unify tracking model and storage path
- [x] 03-02: Harden pipeline transitions and migration notes

### Phase 3.1: Draft Management and Gmail Sync (INSERTED)
**Goal**: Allow users to edit generated drafts in UI, delete drafts, and actively synchronize manual deletions from Gmail before attempting sends.
**Depends on**: Phase 3
**Requirements**: [SYNC-01, SYNC-02, SYNC-03]
**Success Criteria** (what must be TRUE):
  1. A backend endpoint exists to update the subject/body of an existing draft via Gmail API.
  2. A backend endpoint exists to softly or hard delete a draft from the EmailLog and Gmail.
  3. The `/api/drafts` list fetches check against Gmail API existence to reflect true active draft status.
  4. The frontend Drafts page displays Edit/Delete controls and functions properly.
**Plans**: 
- [x] 03.1-01-PLAN.md — Draft Sync and Delete Architecture
- [x] 03.1-02-PLAN.md — Draft Updates and UI Wiring

### Phase 4: Security and Auth Hardening
**Goal**: Strengthen auth and secret handling for production resilience and abuse resistance.
**Depends on**: Phase 3
**Requirements**: [SECU-01, SECU-02, SECU-03, SECU-04]
**Success Criteria** (what must be TRUE):
  1. Secret/key validation and failure paths are explicit and tested.
  2. OAuth refresh writes are reliable and do not silently drop updated credentials.
  3. Auth endpoints have documented and enforced abuse protections.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Harden secret and token lifecycle management
- [ ] 04-02: Fix OAuth refresh persistence and auth consistency gaps
- [ ] 04-03: Add auth abuse protections and security checks

### Phase 5: Observability and Runtime Reliability
**Goal**: Make operational behavior measurable and diagnosable during incidents.
**Depends on**: Phase 4
**Requirements**: [RELY-01, RELY-02, RELY-03]
**Success Criteria** (what must be TRUE):
  1. Structured logs cover critical auth, billing, and send pipeline events.
  2. Health endpoint reflects dependency readiness (DB and essential integrations).
  3. Background send failures are surfaced with retry/failure visibility.
**Plans**: 2 plans

Plans:
- [ ] 05-01: Add structured logging and trace context
- [ ] 05-02: Implement dependency-aware health and background task reliability controls

### Phase 6: CI, Runbooks, and Release Safety
**Goal**: Prevent regressions through automated gates and establish dependable release/rollback playbooks.
**Depends on**: Phase 5
**Requirements**: [DEPL-03, RELY-04, QUAL-01, QUAL-02]
**Success Criteria** (what must be TRUE):
  1. CI validates backend tests, frontend lint/build, and smoke checks before merge.
  2. Runbook exists for common incidents and rollback steps on Vercel/Render.
  3. Critical flows (register/login, upload->draft->send, Stripe webhook credits) have regression coverage.
**Plans**: 3 plans

Plans:
- [ ] 06-01: Implement CI quality gates and checks
- [ ] 06-02: Expand regression coverage for critical production flows
- [ ] 06-03: Publish deployment and incident runbooks

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 2.1 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Baseline and Deployment Contracts | 3/3 | Complete    | 2026-03-31 |
| 2. Backend Modularization Pass | 3/3 | Complete | 2026-04-01 |
| 2.1. Frontend Refinement and Ship Readiness | 7/7 | Complete | 2026-04-08 |
| 3. Data and Pipeline Cohesion | 2/2 | Complete    | 2026-04-07 |
| 4. Security and Auth Hardening | 0/3 | Not started | - |
| 5. Observability and Runtime Reliability | 0/2 | Not started | - |
| 6. CI, Runbooks, and Release Safety | 0/3 | Not started | - |
