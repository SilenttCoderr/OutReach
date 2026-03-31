# Architecture Contract

## Purpose

This document defines the target clean architecture boundaries for OutreachPro refactoring work. It is the authoritative dependency contract for Phase 2+ modularization.

## Layer Model

OutreachPro backend code should be organized into four conceptual layers:

1. API Layer
2. Application Layer
3. Domain Layer
4. Infrastructure Layer

### Layer Responsibilities

- API Layer (`src/api/*`, router modules):
  - HTTP transport concerns only
  - request/response mapping
  - auth dependency wiring
- Application Layer (`src/application/*`):
  - use-case orchestration
  - transaction boundaries
  - cross-service workflows
- Domain Layer (`src/domain/*`):
  - business entities and domain rules
  - value object validation
  - policy decisions independent of frameworks
- Infrastructure Layer (`src/infrastructure/*`):
  - external adapters (DB, Gmail, Stripe, storage)
  - framework implementation details
  - persistence implementations

## Allowed Dependencies

Required dependency direction:

- API -> Application -> Domain
- Infrastructure -> Application/Domain adapters only

Disallowed dependency direction:

- Domain importing FastAPI, SQLAlchemy session, or provider SDK clients directly
- Application importing HTTP request/response classes
- API importing low-level provider SDKs directly

## Boundary Violations

A change is considered a boundary violation if it introduces:

- framework classes in Domain entities/services
- transport-specific types in Application use-cases
- provider SDK coupling in API handlers

Boundary violations must be flagged in PR review and corrected before merge.

## Migration Rules

1. Preserve existing endpoint contracts while extracting logic.
2. Move one vertical slice at a time (auth, upload, draft/send, billing).
3. Add adapter wrappers before removing legacy direct calls.
4. Keep feature parity checks in place for each extracted slice.

## Definition Of Done For Module Extraction

A module extraction is complete when:

1. API layer contains only transport and dependency wiring.
2. Business orchestration is in Application services.
3. Domain logic is framework-agnostic.
4. External providers are called via Infrastructure adapters.
5. Existing tests and smoke checks pass.

## Canonical References

- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/codebase/ARCHITECTURE.md`
