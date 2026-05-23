# Relational operational simulation engine (Instruction 20.16)

Deterministic, explainable corridor simulation — projections only, **no real operational mutations**.

## Philosophy

- Stress-test SLA, incidents, execution saturation, collapse propagation
- Analytical and audit-ready — not LLM, not autopilot, not financial trading
- Simulation records are synthetic artifacts; orders/fulfillment/wallet/payments are never modified

## Pipeline

Operational ingestion → recommendations → orchestration → optional `suggestStressProjection` (SLA_STRESS_TEST when idle)

## Collapse propagation

`projectCollapsePropagation()` computes: operationalFragility, collapsePropagationRisk, stabilizationProbability, recoveryComplexity.

## Governance

- Read: `operational_observation` on all corridor states including TERMINATED
- **RUNNING** blocked on TERMINATED / SUSPENDED

## Human review

`COLLAPSE_PROPAGATION`, `MULTI_CORRIDOR_STRESS`, `GOVERNANCE_BREAKDOWN` → `requiresHumanReview: true`

## Feature flags

- `relational_operational_simulation_enabled`
- `relational_operational_simulation_realtime_enabled`
