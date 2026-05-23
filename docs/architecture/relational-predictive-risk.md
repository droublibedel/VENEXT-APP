# Relational predictive risk (Instruction 20.13)

## Purpose

Deterministic **operational drift** and **predictive risk** engine for B2B corridors — not LLM, not chatbot, not public seller scoring.

## Authorized data sources only

- Operational metrics (20.12)
- Fulfillment, incidents (20.10), coordination tasks (20.11), execution (20.8)

No social data, GPS, marketing analytics, or external feeds.

## Models

- `RelationalPredictiveRiskSignal` — bounded `signalScore` (0–100), `confidenceLevel` (0–1), explainable `diagnostics`
- `RelationalOperationalDriftSnapshot` — baseline vs current metric, `deviationPercentage`

## Collapse detection

`RelationalOperationalCollapseService` produces:

- `corridorCollapseRisk`
- `operationalFragility`
- `sustainedOperationalDegradation`

From alerts, incidents, blocking tasks, coordination load, drift — no opaque ML.

## Realtime

`relational.predictive.risk_detected`, `risk_resolved`, `operational_drift_detected`, `sla_collapse_warning` — minimal payload.

## Feature flags

- `relational_predictive_risk_enabled`
- `relational_predictive_realtime_enabled`

## Out of scope

No LLM, embeddings, public reputation, stars, marketplace ranking, or recommended suppliers.
