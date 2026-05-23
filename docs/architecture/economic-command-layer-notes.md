# Economic command layer (Instruction 18.5)

## Purpose

The **economic command** surface is a **deterministic, heuristic executive readout** that composes signals already produced by economic propagation (18.1), economic memory (18.2), economic scenarios (18.3), economic coordination (18.4), and data intelligence. It answers: *where is systemic economic pressure, what analytical frictions appear between poles, and what should leadership look at next* — **without** acting on operational systems.

## What this layer is not

- **Not** an autonomous agent or chatbot.
- **Not** an execution engine (no orders, payments, CRM, inventory, or campaign mutations).
- **Not** a calibrated forecasting or treasury model.
- **Not** an ERP-style operational dashboard.

## Advisory posture

All scores are **bounded proxies (0–1)**, **heuristic**, and **advisory only**. Diagnostics explicitly carry `heuristicOnly`, `advisoryOnly`, `symbolicProjection`, `nonOperationalExecution`, and `proxySignals`. Decision risks are **warnings**, not prohibitions. Arbitrations carry `nonOperationalExecution: true`.

## Composition and caching

The engine composes **propagation once**, then **coordination from the seeded propagation bundle** to avoid duplicate propagation compose. A **short TTL cache** (`SHORT_TTL_COMMAND_CACHE`) serves repeated slice reads. Responses default to **`projection=summary`**; **`projection=full`** embeds upstream `sourceBundles` and a **`snapshot`** mirror for audit.

## Symbolic canvas

The industrial map uses **`geometryMode: SYMBOLIC_PROJECTION`** and **`realGeography: false`**. The on-screen French label states that the layout is **symbolic and non-geographic**.

## Realtime

Optional fan-out posts to the API gateway internal ingest path. Delivery is **non-blocking** (`Promise.allSettled`, warn-only on failure). Sub-flags gate risks, arbitrations, tensions, and realtime pulses.

## Industrial demo wording

Demo copy stays industrial and declarative — **no conversational assistant framing** and no “AI operator” language.

## Instruction 18.5A — hardening notes

### Slice HTTP routes (cost honesty)

`GET /economic-command/overview`, `/pressure-zones`, `/risks`, `/arbitrations`, `/tensions`, `/narrative`, `/stress` are **convenience views** over the same `loadBundle` path as the executive bundle. Each request can still run the **full command compose graph** (propagation → coordination subgraph including scenarios, memory, data intelligence) unless the **short TTL command cache** hits. Responses include `sliceDiagnostics` with `sliceSource: FULL_BUNDLE_SLICE`, `serverCost: FULL_COMPOSE`, `independentCompute: false`, and `recommendedClientMode: BUNDLE_FIRST`.

### Compose diagnostics (non-misleading)

Bundle `diagnostics` expose `composePlan` (per sub-pipeline logical steps), `composeCount` as the **sum of that plan** (backward compatible aggregate), `composeCountMeaning: logical_pipeline_steps_not_cpu_cost`, and `costDisclosure` explaining that cold compose can still invoke the upstream stack even when the summary is cached.

### Client sequential fallback

If the **bundle** BFF request fails, the industrial client may **parallel-fetch slices**, validate them with shared Zod schemas, and **reconstruct** a minimal `EconomicCommandBundle` with `sourceMode: SEQUENTIAL_SLICE_FALLBACK`, `degraded: true`, and `missingSlices` listing HTTP slices that failed validation or were absent. Each slice fetch remains a **full compose** on the server — this path is a resilience UX affordance, not a cheaper query mode. The UI shows **“Mode dégradé — données reconstruites depuis les vues partielles”** and marks unavailable panels when a slice is missing.

### Realtime classification (demo / live / synthetic)

Gateway and client label economic-command stream rows as **DOMAIN_LIVE**, **DEMO_MIRROR**, or **SYNTHETIC_TICK** (French copy in `SignalStream` / `EconomicCommandRealtimeStrip`) so operators do not confuse demo ticker traffic with domain telemetry.

### `silent_tension_zone`

When **silent stress** or **silent tension intensity** crosses conservative thresholds (or multiple silent tensions appear), `EconomicPressureZoneService` emits a `silent_tension_zone` row: `heuristicOnly: true`, bounded scores, `sourceSignals` referencing silent stress / tensions, and an explanation that it is an **early-warning weak-signal proxy**, not dispatch authority.

### Projection weight

`projection=summary` (the default for UI fetches) keeps `payloadWeightClass: compact` and omits embedded upstream bundles. `projection=full` sets `payloadWeightClass: large`, `sourceBundlesEmbedded: true`, and `fullProjectionWarning` explaining that full projection is for **audit/debug** and must not be the default UI load.
