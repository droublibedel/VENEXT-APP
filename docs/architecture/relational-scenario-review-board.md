# Relational scenario review board (Instruction 20.17)

Human decision layer above operational simulations, orchestrations, recommendations, and predictive signals.

## Philosophy

- B2B corridor decision center — not ecommerce dashboard, not SAV, not conversational AI
- Deterministic policy rules + append-only audit journal
- Simulations remain projections; approvals may create **DRAFT / WAITING_VALIDATION** orchestration plans only — never auto-start commerce execution

## Pipeline

Operational intelligence → predictive → recommendation → orchestration → simulation → **scenario review board**

Auto-review creation for critical simulations, collapse propagation, governance breakdown, multi-corridor stress.

## Validation modes

- **Dual validation**: `COLLAPSE_PROPAGATION`, `GOVERNANCE_BREAKDOWN`, `MULTI_CORRIDOR_STRESS` → two organizations must approve
- **Executive validation**: CRITICAL severity, high collapse score, BLOCKED/SUSPENDED corridor, multiple concurrent critical simulations

## Governance

- Read: `operational_observation` on all corridor states including TERMINATED
- Approve: forbidden on TERMINATED; critical actions blocked on suspended corridors
- No order/wallet/payment/public tracking mutations

## Realtime

`relational.scenario.review_*` — minimal payload (ids, status, severity, decisionType)

## Feature flags

- `relational_scenario_review_enabled`
- `relational_scenario_review_realtime_enabled`

## V1 limits

- No autopilot execution, no generative AI decisions
- Orchestration attachment on approve does not start ACTIVE runs automatically
