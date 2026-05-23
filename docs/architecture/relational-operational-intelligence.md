# Relational operational intelligence (Instruction 20.12)

## Purpose

VENEXT **operational intelligence** is corridor B2B execution insight — not ecommerce dashboards, marketplace KPIs, public seller ratings, or vanity analytics.

## vs marketplace analytics

| Marketplace KPI | Corridor operational intelligence |
|-----------------|-----------------------------------|
| Seller rating / stars | Internal alerts only |
| Customer satisfaction | Partner operational signals |
| Delivery success rate | Fulfillment SLA & stagnation |
| Public reputation | No public scoring |

## Data model

- `RelationalOperationalAlert` — persisted operational signals (severity, type, resolution)
- `RelationalOperationalMetric` — duration metrics from real Prisma timestamps

## SLA snapshot

`GET …/sla-snapshot/:relationshipId` returns:

- `corridorOperationalHealth` — STABLE | CAUTION | DEGRADED | CRITICAL
- blocking tasks, open incidents, coordination load
- average fulfillment / reception delays

Readable on **BLOCKED**, **DEGRADED**, **TERMINATED** corridors (historical observation).

## Ingestion

Metrics computed on:

- fulfillment completion
- reception validation
- incident resolution
- task completion
- critical execution transitions (DISPATCHED, RECEIVED, COMPLETED)

## Realtime

`relational.operational.alert_created`, `alert_resolved`, `sla_degradation_detected`, `corridor_risk_detected` — minimal payload (no PII, no fileUrl, no payment).

## Feature flags

- `relational_operational_intelligence_enabled`
- `relational_operational_realtime_enabled`

## Out of scope

No wallet, payment execution, consumer tracking, gamification, or public leaderboards.
