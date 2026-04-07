# Phase 03 Research: Data and Pipeline Cohesion

**Date:** 2026-04-08
**Phase:** 03-data-and-pipeline-cohesion

## Objective

Identify where send-state truth diverges between legacy and modern paths, then define low-risk convergence steps that preserve API contracts.

## Findings

### 1. Mixed source-of-truth exists

- Modern user-visible stats/history are database-backed through `EmailLog` and `Contact` records:
  - `src/application/campaign_service.py:get_stats`
  - `src/application/campaign_service.py:get_history`
  - `src/application/campaign_service.py:get_draft_logs`
- Legacy file tracking still exists in `src/tracker.py` and is still reachable via:
  - `src/api/routes_campaigns.py: /clear-tracking`
  - `src/application/campaign_service.py:clear_tracking_records`

Risk: operational confusion and inconsistent reset semantics when one path mutates file tracking while primary UX reads DB state.

### 2. Transition updates are partially consistent

- Draft creation marks `Contact.status = "draft"` and inserts `EmailLog(status="draft")`.
- Single-send path marks `EmailLog.status = "sent"` but does not consistently align `Contact.status`.
- Batch send path logs errors to console but does not persist per-item failures deterministically.

Risk: status drift and poor post-failure observability.

### 3. API contracts can be preserved while internals converge

- Existing routes already delegate to `campaign_service`, allowing convergence behind stable route signatures.
- No frontend contract changes are required for canonicalization if response shapes are preserved.

## Recommendations

1. Introduce canonical transition helpers in `campaign_service` for draft/sent/failed state updates and reuse in single + batch send paths.
2. Replace legacy `clear_tracking_records` behavior with DB-consistent reset semantics.
3. Keep legacy tracker isolated behind compatibility note only; avoid expanding its usage.
4. Add migration/hardening notes that explicitly document canonical source and transition rules.

## Phase Plan Split

- **03-01:** Canonical source convergence and storage-path cleanup.
- **03-02:** Deterministic transition hardening + migration notes and verification.

## Validation Targets

- Lint/type checks for frontend unaffected paths.
- Python compile + route smoke on campaign endpoints.
- Manual verification matrix for draft/send/failed/reset transitions.
