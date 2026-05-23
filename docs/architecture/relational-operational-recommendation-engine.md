# Relational operational recommendation engine (Instruction 20.14)

Deterministic, explainable corridor recommendations derived from operational intelligence (20.12) and predictive risk (20.13). Not an LLM assistant, not public scoring, not payment execution.

## Data model

`RelationalOperationalRecommendation` on `Relationship` with lifecycle: `ACTIVE` → `ACKNOWLEDGED` | `DISMISSED` | `RESOLVED` | `EXPIRED`.

## Generation pipeline

1. Fulfillment / operational events → `RelationalOperationalIntelligenceIngestionService`
2. Chained `RelationalPredictiveRiskIngestionService.recalculateCorridor`
3. Chained `RelationalOperationalRecommendationIngestionService.regenerateForRelationship`

Policy: cooldown, max active per corridor, score/confidence clamps, duplicate codes.

## Governance

`assertCorridorOperational(relationshipId, "operational_observation")` allows read on `BLOCKED`, `DEGRADED`, `TERMINATED` corridors for historical analytics.

## Realtime

Events under `relational.operational.recommendation_*` (and collapse/drift aliases) validated by `RelationalOperationalRecommendationRealtimeSchema` in API gateway before fan-out.

## Feature flags

- `relational_operational_recommendation_enabled`
- `relational_operational_recommendation_realtime_enabled`

## API

Core controller prefix: `relational-operational-recommendation` — list, overview, acknowledge, dismiss, resolve.

Web BFF: `/api/relational-operational-recommendation/v1/relational-operational-recommendation/*`
