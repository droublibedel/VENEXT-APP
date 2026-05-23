# Relational macro-economic resilience (Instruction 20.25)

## Philosophy

VENEXT projects **macro-economic resilience** and **adaptive corridor intelligence** from governed relational signals: fulfillment stress, sector/geo context, supply-flow disruption, economic pressure graph, predictive risk, strategic memory, command center, orchestration, simulation, and scenario review. This is deterministic industrial intelligence — not generative AI, not marketplace scoring, not logistics ERP.

## What this is not

- Generative AI / LLM copilot / autopilot  
- ERP / WMS / TMS  
- GPS / parcel tracking / public logistics maps  
- Wallet / payment execution  
- Public supplier rating or marketplace reputation  

## Pipeline position

`pressure → geo → sector → supply-flow → macro-economic`

Ingestion: `syncMacroEconomicState()` runs in the `finally` block of `syncSupplyFlowState()` (20.24A chain).

## Governance

- Reads: `assertCorridorOperational(..., "operational_observation")` — **TERMINATED** corridors remain historically observable.  
- Mutations: `assertMacroEconomicMutationAllowed()` **before** any Prisma write — blocks **TERMINATED**, **SUSPENDED**, **BLOCKED**.  
- Diagnostics: `governanceOperation`, `mutationBlocked`, `corridorTerminated`, `mutationSkippedReason`.  
- Anti-loop: per-relationship ingest guard set during `syncMacroEconomicState`.

## Real inputs (authorized)

Prisma reads from: fulfillment incidents/tasks, operational metrics, predictive risk (20.13), strategic memory (20.18), command center (20.20), economic pressure node + peer edges (20.21), geo zone (20.22), sector nodes (20.23), supply-flow nodes (20.24), orchestration, simulation, scenario review.

Explicit fallbacks (`heuristicFallbackUsed`, `fallbackReasons`) when pressure node, supply-flow nodes, or geo link are missing — never silent.

## Resilience engine (deterministic)

Bounded scores: `resilienceScore`, `structuralFragility`, `operationalContinuity`, `dependencyExposure`, `adaptationCapacity`, `systemicPressure`, `economicStress`, `corridorRecoveryProbability`, `macroEconomicRisk`, `propagationRisk`, `fragilityScore` — all documented in node `diagnostics` JSON.

## Dependency & propagation

- Dependency edges computed from corridor context weights (no fixed constants).  
- Propagation DFS on persisted `relational_macro_economic_dependencies`, depth capped by `VENEXT_MACRO_ECONOMIC_MAX_DEPTH` (default 8).  
- Traversal diagnostics: `cascadeDepth`, `visitedNodes`, `edgeTraversalCount`, `boundedTraversalApplied`, `collapseExposure`.

## Realtime

`relational.macro.*` validated at gateway **before** `relational.supply.*`. Minimal payload: `relationshipId`, `macroNodeId`, `macroNodeCode`, `intensity`, `propagationDepth`.

## V1 limits

- Dual macro node pattern per corridor (primary resilience + adaptive capacity).  
- Snapshot append on each successful ingestion (audit journal).  
- Territorial/sector maps are relational aggregates, not SKU-level truth.  
- Resilience blending formulas remain bounded heuristics (explicit in diagnostics).

## Remaining heuristics (explicit)

- Score weighting in `RelationalMacroEconomicResilienceService` (documented per-weight in `diagnostics`).  
- Fragility map blending in `RelationalMacroEconomicFragilityService`.  
- Adaptation readiness boost from open simulation/review counts.
