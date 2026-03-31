# Phase 2: Backend Modularization Pass - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Source:** Phase 1 outputs + roadmap requirements

<domain>
## Phase Boundary

Phase 2 performs the first real structural extraction from the large `app.py` composition into modular routers and application service modules while preserving API behavior and frontend compatibility.

</domain>

<decisions>
## Implementation Decisions

### Locked decisions
- Keep public API routes and response contracts backward compatible.
- Use incremental extraction by vertical slice; do not rewrite all modules at once.
- Enforce architecture contract defined in `docs/ARCHITECTURE_CONTRACT.md`.
- Keep provider-specific calls behind infrastructure adapters as extraction progresses.

### the agent's Discretion
- Exact package paths for `src/api`, `src/application`, and adapter modules.
- Which slices to extract first as long as dependencies remain safe.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `docs/ARCHITECTURE_CONTRACT.md`
- `.planning/codebase/ARCHITECTURE.md`
- `app.py`
- `src/auth_routes.py`
- `src/stripe_routes.py`

</canonical_refs>

<specifics>
## Specific Ideas

- Move non-trivial orchestration from endpoint bodies into application services.
- Introduce explicit module boundaries for route registration and shared dependencies.
- Keep extraction measurable with regression checks against existing endpoints.

</specifics>

<deferred>
## Deferred Ideas

- Full legacy tracking unification remains in Phase 3.
- Security hardening beyond compatibility-preserving extraction remains in Phase 4.

</deferred>

---

*Phase: 02-backend-modularization-pass*
*Context gathered: 2026-03-31 after Phase 1 completion*
