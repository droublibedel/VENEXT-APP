# Relational operational orchestration engine (Instruction 20.15)

Deterministic corridor orchestration: structured action plans and sequenced steps from recommendations (20.14), predictive risk (20.13), SLA metrics (20.12), and fulfillment operations — **not** an autonomous AI agent or autopilot.

## Philosophy

- **Propose, orchestrate, sequence** — humans validate critical paths.
- No payment execution, PSP, wallet, or opaque scoring.
- Every orchestration has provenance (`sourceRecommendationId`, diagnostics JSON).

## Pipeline

1. Operational events → intelligence → predictive → recommendations (20.14)
2. `RelationalOperationalOrchestrationIngestionService.syncForRelationship` builds plans from active recommendations

## Human validation

Types `COLLAPSE_PREVENTION`, `GOVERNANCE_REVIEW`, `CORRIDOR_RECOVERY` set `requiresHumanValidation` and start in `WAITING_VALIDATION`. Approve → `DRAFT` → `start` → `ACTIVE`.

## Governance

- Read: `operational_observation` on any corridor state (including BLOCKED / TERMINATED).
- **No new ACTIVE orchestration** on `TERMINATED` or `SUSPENDED` corridors.

## Realtime

`relational.operational.orchestration_*` — minimal payload (ids, type, priority, status, `computedAt`).

## Feature flags

- `relational_operational_orchestration_enabled`
- `relational_operational_orchestration_realtime_enabled`

## V1 limits

- No automatic commerce mutations
- No cross-corridor orchestration
- Step assignment is advisory (organization/user fields optional)
