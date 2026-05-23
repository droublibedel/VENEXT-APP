# Relational strategic memory registry (Instruction 20.18)

Explainable corridor learning registry — deterministic pattern capitalisation, not opaque ML.

## Philosophy

- B2B economic corridor memory — not CRM, not SAV, not conversational AI
- Append-only event journal + structured memory records
- No external embeddings, no LLM, no social scoring

## Pipeline

Operational stack → scenario review → **strategic memory registry**

Auto-memories from: approved reviews, resolved incidents, recurring patterns (SLA drift, incidents, orchestrations, collapse recovery).

## Reuse workflow

- `reuseMemory` increments counters and logs MEMORY_REUSED
- `assessMemoryOutcome` evolves confidence (+5 success / -12 failure)
- Blocked on INVALIDATED, TERMINATED corridor, low confidence, excessive failures

## Pattern detection

Deterministic rules in policy engine — repeatable incidents, SLA alerts, effective orchestrations, human decision consistency.

## Governance

- Read history: `operational_observation` on all corridor states including TERMINATED
- New memory creation blocked on TERMINATED corridor (historical read still allowed)
- Reuse blocked on TERMINATED
- Invalidation allowed even after TERMINATED

## Realtime

`relational.memory.*` — minimal payload (ids, type, severity, confidence)

## Feature flags

- `relational_strategic_memory_enabled`
- `relational_strategic_memory_realtime_enabled`

## V1 limits

- No vector search or external ML
- Pattern detection is rule-based counts, not statistical learning
- Reuse does not auto-start orchestrations
