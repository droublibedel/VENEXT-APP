# Relational sector intelligence & market structure (Instruction 20.23)

## Philosophy

This layer is **economic infrastructure**: it reads corridor-local sector topology, value-chain stress, and market-structure vectors so operators can reason about **concentration**, **propagation**, and **territorial imbalance**. It is deliberately **not** an ERP, CRM, financial dashboard, ad engine, dynamic pricing tool, or marketplace.

VENEXT stays on the side of **observation, correlation, and bounded propagation** — never autonomous commercial execution.

## Difference from ERP / BI

- **ERP** mutates operational records of record; 20.23 **does not** drive transactions.
- **BI dashboards** optimize for KPI storytelling; 20.23 exposes **auditable, bounded scores** with explicit explainers in diagnostics vectors.
- **Consumer analytics** is out of scope by design (no social graph, no public reputation, no parcel tracking vocabulary).

## Dependencies (data plane)

The ingestion chain is **geo-economic (20.22) → sector intelligence (20.23)**:

- After `syncGeoEconomicState()` completes (success or controlled failure path), `syncSectorIntelligenceState()` runs in a `finally` block so sector projections stay aligned with the latest territorial slice when geo is enabled.
- Engines may consult **fulfillment**, **orchestration**, **predictive risk**, **command center**, **geo-economic**, **pressure graph**, **strategic memory**, **recommendations**, **simulations**, and **reviews** — always as **read-only correlation inputs**, not as commerce automation triggers.

## Propagation

`RelationalSectorPropagationService` performs a **bounded BFS** over corridor-local sector nodes and dependencies. Maximum depth is controlled by `VENEXT_SECTOR_PROPAGATION_MAX_DEPTH` (clamped). Outputs are **paths + impact scores**, not forecasts from ML/LLM.

## Expansion

`RelationalSectorExpansionService` produces **read-only opportunity narratives** from expansion potential and concentration signals. There is **no** autopilot expansion or automated corridor negotiation.

## Governance

- Reads use `assertCorridorOperational(..., "operational_observation")` so **TERMINATED / DEGRADED / BLOCKED** corridors remain historically observable where policy allows observation.
- Mutations (for example archiving a sector signal) require `canMutateSectorState()` — **TERMINATED** blocks mutation.

## Realtime sector intelligence flow (Instruction 20.24)

End-to-end path:

**Core ingestion / recompute → Sector event → Gateway validation → Web subscription → Delta application**

1. **Core**: `RelationalSectorStreamingService.publishAfterIngestion` compares a deterministic **fingerprint** (hashed from scores, propagation depth, dependency edge count, and market-structure digest) stored on the primary sector node `metadata.stream`. If unchanged, **no realtime** is emitted (avoids broadcast storms).
2. **Sector events**: when the fingerprint changes, the core emits structured events:
   - `relational.sector.snapshot.updated` (kind `snapshot`, includes slugs + aggregate risk + structure type + `eventId` / `streamRevision`)
   - optional deltas: `relational.sector.score.updated`, `relational.sector.propagation.updated`, `relational.sector.dependency.updated`, `relational.sector.marketStructure.updated`
   - legacy minimal envelopes remain for narrow threshold alerts (`signal_created`, `market_fragility_detected`, `expansion_opportunity_detected`, `systemic_sector_risk`) but are **gated** on fingerprint change to reduce duplication with structured deltas.
3. **Gateway**: `safeParseRelationalSectorRealtimeBody` validates **legacy** payloads with `SectorRealtimeSchema` and **structured** payloads with dedicated Zod schemas. **`relational.sector.*` is matched before `relational.geo.*`**. `SectorRealtimeIngressCoordinator` enforces **idempotence** (`eventId` dedup window) and **debounce** (same org + eventType + fingerprint burst window).
4. **Web**: `RelationalSectorIntelligencePanel` consumes `RELATIONAL_ORDERS` websocket items carrying `relationalSectorEnvelope` / optional `relationalSectorRealtimePayload`, applies **scoped BFF refetches** (debounced) per event type, and keeps **BFF fallback** when the socket is disconnected (`syncMode: fallback`).

## Realtime (Instruction 20.23 baseline)

Fan-out types include **legacy minimal** `relational.sector.*` envelopes (`SectorRealtimeSchema`) and **Instruction 20.24 structured** envelopes (`SectorScoreUpdatedPayloadSchema`, `SectorSnapshotUpdatedPayloadSchema`, …) selected by `safeParseRelationalSectorRealtimeBody`. The API gateway validates **`relational.supply.*` before `relational.sector.*`**, then **`relational.sector.*` before `relational.geo.*`**, then the existing relational pressure / command / economic ordering continues downstream.

## V1 limits

- Deterministic heuristics only: **no generative AI**, **no opaque ML scoring**, **no marketplace scoring**.
- Sector graph materialization is corridor-scoped; cross-corridor industrial intelligence remains explicit future work.

## Absence of generative AI

All scores are **bounded (0..100)**, **recomputable from declared inputs**, and **traceable** via diagnostics JSON. LLMs are not used in this module path.
