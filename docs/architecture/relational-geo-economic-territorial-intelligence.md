# Relational geo-economic territorial intelligence (Instruction 20.22)

## Philosophy

This layer implements **systemic geo-economic intelligence infrastructure**: a read-mostly, corridor-first analytical projection of **economic territory** (aggregated regional basins derived from organization territory metadata and corridor topology). It is **not** a consumer map product, **not** GPS tracking, **not** delivery route optimization, and **not** real-time user location telemetry.

VENEXT uses deterministic scores (density, pressure, propagation exposure, expansion potential) to **supervise** how economic concentration and dependency structure cluster across **territorial codes** that summarize jurisdictions—not street-level addresses.

## Difference from GPS / logistics tooling

| GPS / logistics consumer maps | VENEXT geo-economic layer |
| --- | --- |
| Continuous device tracking | No device coordinates; no live courier paths |
| ETA / route optimization | No automated commercial execution; projections only |
| Public map tiles | Private analytical surfaces for authorized org members |

## Territorial propagation

Propagation uses a **bounded breadth-first expansion** over the **economic pressure dependency graph** (Instruction 20.21) as a systemic proxy for how stress can traverse linked corridors. Depth is capped by `VENEXT_GEO_PROPAGATION_MAX_DEPTH` (default 8, hard max 32).

## Economic density

`RelationalGeoEconomicDensityService.computeZoneDensity` derives six bounded components (corridor, fulfillment, orchestration, operational, cluster, pressure) and rolls them into an `operationalDensityScore` suitable for persistence on `RelationalGeoEconomicZone`.

## Regional supervision

`RelationalGeoEconomicPressureService.detectPressureZones` labels congestion, corridor concentration, and propagation pressure using explainable string diagnostics—suitable for audit trails and operator review.

## Governance

- Reads use `assertCorridorOperational(..., "operational_observation")`, which **allows** historical observation on **TERMINATED** corridors.
- Writes (ingestion mutations, archive) require `canMutateGeoEconomicState()` → **false** when `corridorState === TERMINATED`.

## Ingestion chain

`RelationalEconomicPressureIngestionService.syncPressureMapForRelationship` recomputes the pressure graph when mutable, then always invokes `RelationalGeoEconomicIngestionService.syncGeoEconomicState` so **Pressure Mapping → Geo Economic Intelligence** ordering holds whenever pressure ingestion runs.

## Realtime sector intelligence flow

See **Instruction 20.24** in `docs/architecture/relational-sector-intelligence.md` for the full **Core → Sector event → Gateway → Web delta** contract (structured `relational.sector.*` payloads, fingerprint dedupe, gateway idempotence).

Fan-out types are `relational.geo.*` with a strict `GeoEconomicRealtimeSchema` payload (no wallet fields, no coordinates, no payment execution). On the internal relational-orders domain ingress, the API gateway validates **`relational.supply.*` before `relational.sector.*`**, then **`relational.sector.*` before `relational.geo.*`**, then **`relational.geo.*` before `relational.pressure.*`** (Instruction 20.24 + 20.23 + 20.22 ordering).

## V1 limitations

- Territory codes are derived from **organization country/city** tokens—coarse administrative proxies, not cadastral precision.
- Propagation follows the **pressure dependency** topology, not physical infrastructure graphs.
- No automated commercial decisions are taken from these scores; they are observability inputs only.
