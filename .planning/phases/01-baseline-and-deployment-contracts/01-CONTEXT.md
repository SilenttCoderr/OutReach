# Phase 1: Baseline and Deployment Contracts - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Source:** User objective + codebase mapping

<domain>
## Phase Boundary

Phase 1 establishes explicit architecture and deployment contracts for the existing brownfield app. It does not execute the full modular refactor; it defines the target boundaries and implements preflight protections that prevent startup/deployment regressions on Render and Vercel.

</domain>

<decisions>
## Implementation Decisions

### Locked decisions
- Keep current platform topology: Next.js on Vercel, FastAPI on Render.
- Keep existing product behavior stable while introducing reliability guardrails.
- Use incremental refactor strategy; avoid big-bang rewrites.
- Enforce startup env/dependency contract checks before serving traffic.
- Capture and document architecture boundaries before phase-by-phase extraction.

### the agent's Discretion
- Exact module naming for clean architecture boundary documents.
- How to structure preflight utility modules (single file vs package).
- Exact CI command shapes for compatibility checks.

</decisions>

<canonical_refs>
## Canonical References

### Product and planning
- `.planning/PROJECT.md` - project objective and constraints
- `.planning/REQUIREMENTS.md` - requirement IDs and scope
- `.planning/ROADMAP.md` - phase goal and success criteria
- `.planning/STATE.md` - current execution position

### Codebase map
- `.planning/codebase/ARCHITECTURE.md` - current architecture and flow
- `.planning/codebase/STACK.md` - runtime/dependency baseline
- `.planning/codebase/CONCERNS.md` - known reliability and security risks

### Runtime and deploy config
- `app.py` - backend startup, routes, middleware
- `src/database.py` - DB URL and engine initialization
- `.env.example` - expected environment contract
- `Dockerfile` - backend container/runtime command
- `web/next.config.ts` - frontend API routing/rewrite behavior
- `vercel.json` - frontend deployment config

</canonical_refs>

<specifics>
## Specific Ideas

- Define a concrete architecture contract doc to anchor later extraction phases.
- Add startup preflight checks for required env keys and dependency compatibility.
- Verify deployment matrix for local/dev/preview/prod API URL behavior.

</specifics>

<deferred>
## Deferred Ideas

- Full route/service decomposition (Phase 2).
- Tracking model unification and migration (Phase 3).

</deferred>

---

*Phase: 01-baseline-and-deployment-contracts*
*Context gathered: 2026-03-31 via bootstrap planning*
