# Instruction 10 — Governance backoffice (command center)

## Purpose

VENEXT backoffice is a **system governance cockpit**, not a generic CRUD admin. It supervises flags, graph, sponsored lane, AI gateway state (mock), realtime contracts, industrial poles, payments capability, safety connectors, data quality, and audit history.

## Backend

- **Module root:** `services/core-domain-service/src/modules/backoffice/`
- **Logical modules:** `backoffice-audit-log`, `backoffice-feature-control`, `backoffice-ecosystem`, `backoffice-graph-supervision`, `backoffice-signal-monitoring`, `backoffice-data-quality`
- **HTTP prefix:** `GET|PATCH /v1/backoffice/*` (global `v1` prefix)
- **Auth:** `BackofficeGovernanceGuard` — `x-venext-backoffice-token` (env `VENEXT_BACKOFFICE_TOKEN`, default `dev-backoffice-token`), or `x-venext-user-role: BACKOFFICE_ADMIN`, or `DEV_AUTH_BYPASS` on core (demo).

## Prisma

- `BackofficeAuditLog` — append-only governance events.
- `Organization.governanceSuspended` — kill-switch distinct from verification.
- `SponsoredProductInjection.governanceState` — JSON state for pause / reject / approve flows.

## Frontend

- **App:** `apps/backoffice-web`
- **UI shell:** `src/app/governance/layout.tsx`
- **Panels:** `src/app/governance/[[...panel]]/page.tsx` loads live JSON from `/api/core/v1/backoffice/...` via same-origin proxy `src/app/api/core/[[...path]]/route.ts`.
- **Degraded mode:** 503 / fetch errors show an operational warning strip (no static mock payloads).

## Feature flags

- **List + evaluate:** `GET /v1/backoffice/features` uses `CanonicalFeatureFlagEvaluator` for global samples per governed key.
- **Patch:** `PATCH /v1/backoffice/features/:key` upserts via `FeatureFlagsService` and writes an audit row. Supports `scopeType` including `ROLE`, `ORGANIZATION`, `REGION`, `COUNTRY`, `GLOBAL`.

## Realtime honesty

- Monitoring panel surfaces **DEMO** vs **LIVE** channel lists; gateway health is probed when `API_GATEWAY_URL` / `VENEXT_API_GATEWAY_URL` is set.
