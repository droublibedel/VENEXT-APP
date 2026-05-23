# Relational supply flow intelligence (Instruction 20.24)

## Philosophy

VENEXT reads **relational economic flows** inside a governed corridor: product and fulfillment signals are aggregated into **supply flow intelligence** — continuity, pressure, bottlenecks, dependencies, and bounded propagation. This is **not** an ERP, WMS, TMS, GPS stack, parcel tracking layer, or marketplace fulfillment engine.

## What this is not

- ERP / classical supply-chain suite  
- WMS or stock execution  
- TMS or route optimization  
- GPS or live map tracking  
- Payment / wallet / PSP analytics  
- Public scoring or marketplace reputation  

## What this is

- **Corridor-first** analytical projection on orders, fulfillment, incidents, sector and geo-economic context  
- **Deterministic, explainable** scores (bounded integers, documented drivers)  
- **Append-only** flow events for auditability  
- **Realtime** `relational.supply.*` events with strict minimal payloads validated at the gateway **before** `relational.sector.*`, `relational.geo.*`, `relational.pressure.*`, `relational.command.*`, and `relational.economic.*`  

## Pipeline position

`Geo economic (20.22) → Sector intelligence (20.23) → Supply flow intelligence (20.24)`  

Ingestion hook: `syncSupplyFlowState()` runs from sector ingestion `finally` so the chain completes even when sector projection short-circuits.

## Governance

- Reads use `assertCorridorOperational(..., "operational_observation")` (historical read allowed on `TERMINATED`).  
- **Ingestion mutations** require `assertSupplyFlowMutationAllowed(corridorState)` **before** any Prisma write (`relational_supply_flow_*`, signals, events, realtime). Archive and other write endpoints use the same gate.  
- No mutations to orders, fulfillment execution, wallet, or payments from this module.  

## V1 limits

- Small bounded graphs (dual-flow corridor pattern + optional dependency edge).  
- Propagation depth capped by `VENEXT_SUPPLY_FLOW_MAX_DEPTH` (default 8, max 32).  
- Realtime payloads are intentionally minimal to keep the transport corridor-safe.  

## 20.24A Hardening (governance, sources, propagation)

### TERMINATED governance

- `operational_observation` still allows **reads** on terminated corridors (Instruction 20.14).  
- **All Prisma mutations** in `syncSupplyFlowState()` are gated by `assertSupplyFlowMutationAllowed()` **before** node upserts, bottleneck updates, dependency edges, signals, events, or realtime fan-out.  
- Diagnostics: `governanceOperation: "supply_flow_ingestion"`, `corridorTerminated`, `mutationBlocked`.

### Real inputs (no fixed dependency strength / probability)

- Dependency edge scores are computed deterministically from: open fulfillment incidents, coordination task saturation, economic pressure plus geo fragility, sector operational risk max, unresolved predictive risk signals (20.13), active strategic memories (20.18), operational metric stress (20.12), and active peer economic dependency edges on the corridor pressure node.  
- Product flow categories come from **order line quantities × product.category**; dominant category and `volumeConfidenceLevel` follow row coverage. Explicit fallbacks (for example missing pressure node, no order lines then buyer org category) set `heuristicFallbackUsed` plus `fallbackReasons` — never silent.

### Propagation

- `propagationChains` and propagation pressure use **persisted** `relational_supply_flow_edges`, traversed with depth bounded by `VENEXT_SUPPLY_FLOW_MAX_DEPTH`.  
- API exposes `traversalDiagnostics`: `cascadeDepth`, `visitedNodes`, `edgeTraversalCount`, `boundedTraversalApplied`.

### Remaining heuristics (explicit)

- Continuity and bottleneck **score blending** inside `RelationalSupplyFlowNodeService` and `RelationalSupplyFlowBottleneckService` remains bounded deterministic heuristics (not logistics truth). Drivers are documented in node `diagnostics`.  
- `RelationalSupplyFlowPressureService` category and territory pressure maps blend node disruption scores (relational aggregation, not SKU-level truth).

### API diagnostics (`overviewDiagnostics`)

- Overview and pressure DTOs include `overviewDiagnostics` with `predictiveSignalsUsed`, `strategicMemoriesUsed`, `operationalMetricsUsed`, product flow slice, propagation traversal snapshot, `heuristicFallbackUsed`, `fallbackReasons`.

## Related documentation

- `docs/architecture/relational-sector-intelligence.md` — upstream sector projection.  
- `docs/architecture/relational-geo-economic-territorial-intelligence.md` — territorial slice feeding sector/flow context.  
