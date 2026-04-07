# Phase 3: Data and Pipeline Cohesion - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 removes mixed legacy/modern tracking ambiguity by converging send-state tracking onto one canonical source and hardening draft/send state transitions so API behavior is deterministic and observable.

</domain>

<decisions>
## Implementation Decisions

### Canonical tracking source
- **D-01:** Canonical send tracking source is database-backed `EmailLog` + `Contact.status`; file-based `data/tracking.json` is legacy and must not remain authoritative.
- **D-02:** Legacy tracker paths can remain temporarily for backward compatibility only when wrapped behind explicit compatibility behavior, not as primary flow logic.

### Status transitions and determinism
- **D-03:** Draft creation and send flows must transition both email-log and contact state consistently (new -> draft -> sent / failed) with no silent partial updates.
- **D-04:** Batch send paths must record explicit per-item failure states rather than only console logs.

### Operational observability for pipeline flows
- **D-05:** Service-level transition points should produce structured, queryable records through existing models so stats and history endpoints remain stable and reliable.
- **D-06:** Public API response contracts remain backward compatible while internals are unified.

### the agent's Discretion
- Exact helper/function boundaries used to centralize transition logic in campaign services.
- Whether compatibility wrappers live in service or API layer, as long as canonical source remains DB-backed.
- Exact migration-note location and formatting.

</decisions>

<specifics>
## Specific Ideas

- Existing ambiguity is concentrated in the legacy `EmailTracker` file store versus the newer `EmailLog`/`Contact` DB model path.
- `clear-tracking` should align with canonical DB semantics instead of mutating a sidecar JSON store.
- Transition outcomes should be understandable from `stats` and `history` without reading server logs.

</specifics>

<canonical_refs>
## Canonical References

### Phase-level requirements and roadmap
- `.planning/PROJECT.md` - milestone intent and hardening constraints
- `.planning/REQUIREMENTS.md` - `ARCH-04` and related reliability constraints
- `.planning/ROADMAP.md` - Phase 3 scope and success criteria
- `.planning/STATE.md` - current execution position

### Existing implementation contracts
- `src/models.py` - canonical data models (`Contact`, `EmailLog`) and status fields
- `src/application/campaign_service.py` - draft/send orchestration and batch path
- `src/api/routes_campaigns.py` - public campaign pipeline API surface
- `src/tracker.py` - legacy file-based tracker to deprecate/isolate
- `docs/ARCHITECTURE_CONTRACT.md` - layer boundaries and dependency rules

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/application/campaign_service.py` already centralizes most draft/send logic and is the best convergence point.
- `src/models.py` provides DB entities needed for canonical transition/state tracking.

### Established Patterns
- Route handlers in `src/api/routes_campaigns.py` delegate orchestration to application services.
- Status and history responses are already derived from DB records for most user-visible flows.

### Integration Points
- `clear-tracking` endpoint currently bridges to legacy tracker and should be migrated to canonical DB behavior.
- Batch send flow (`send_drafts_batch`) needs explicit failure-state persistence for deterministic observability.

</code_context>

<deferred>
## Deferred Ideas

- Queue-system replatforming (Celery/RQ) remains a v2 concern.
- New user-facing analytics features beyond hardening scope are deferred.

</deferred>

---

*Phase: 03-data-and-pipeline-cohesion*
*Context gathered: 2026-04-08*
