# Industrial operational continuity (Instruction 18.7 / 18.7A)

## Purpose

This layer is an **advisory, deterministic, symbolic** readout of **operational continuity and stability** stacked **above** the industrial situation room. It is not an automation system, APS engine, ERP workflow, dispatcher, or autonomous agent.

**IOC is a continuity lens, not a source of operational truth.** It summarizes stability, cadence, corridors, and cross-cutting continuity language from **Situation Room outputs**. It does **not** replace ISR for crisis cell / mission / dependency detail.

## When to use ISR vs IOC

| Use **Industrial Situation Room (18.6)** when you need | Use **Industrial Operational Continuity (18.7)** when you need |
|--------------------------------------------------------|----------------------------------------------------------------|
| Situation cells, missions, critical dependencies, executive attention as **primary** readouts | A **continuity-framed** digest: stability states, continuity pressures, corridors as **lens**, cadence proxies |
| The authoritative symbolic cockpit for the current industrial snapshot | A **transverse executive** summary that explicitly **echoes** upstream compose counts for disclosure |
| Full situation-room bundle as the operational narrative source | Same upstream materialization cost as ISR for a cold read — IOC adds **synthesis only**, not a second propagation graph |

**Recommended order:** open **ISR first**; use **IOC after** when stakeholders want continuity vocabulary (stability / cadence / choke language) without re-reading raw cells.

## What IOC must not be used for

- MES / APS / production scheduling, dispatch, or execution
- ERP operational planning or workflow automation
- Treating IOC scores as calibrated KPIs without domain review
- Parallel **slice** HTTP calls as a “cheaper” query mode (each slice still triggers **full compose** on the server unless the short-TTL cache hits)

## Symbolic continuity

- **Stability states**, **continuity pressures**, **critical corridors**, and **cadence signals** are derived from the **industrial situation room bundle** (which already encapsulates the economic-command compose path — **at most one cold propagation** upstream of the situation room).
- Map geometry is **symbolic projection** only (no real geography, no operational routing).

## Non-execution

- No task execution, scheduling, production planning, or auto-remediation.
- No conversational recommendations or “AI optimization” framing.

## Compose honesty

- `continuityComposePlan` includes `situationRoomMaterialization` and `continuitySynthesis`, plus **echoed** counters from the situation-room `composePlan` (propagation, coordination, scenarios, memory, DI, command, situation-room synthesis) for transparent disclosure.
- `continuityComposeMeaning` is `logical_pipeline_steps_not_cpu_cost`.
- `upstreamPropagationColdStarts` echoes the situation-room diagnostic when the upstream situation-room read was not served from cache (still **no second propagation compose** initiated by the continuity layer itself).

## Cache and single-flight (18.7A)

- Per `organizationId` + **projection** (`summary` | `full`), concurrent **cold** IOC reads share **one in-flight** upstream ISR materialization; followers set `diagnostics.inFlightReuse: true`.
- Short TTL cache remains process-local; `diagnostics.cacheStrategy` is `SHORT_TTL_CONTINUITY_CACHE_WITH_SINGLE_FLIGHT`.

## Payload

- **summary**: compact; situation-room bundle not embedded by default.
- **full**: larger; may attach `embeddedIndustrialSituationRoom` for audit/debug, with `sourceBundlesEmbedded` and `payloadWeightClass: large`, plus optional `fullProjectionWarning`.

## Product positioning (diagnostics)

- `productRole`: `CONTINUITY_LENS_ABOVE_SITUATION_ROOM`
- `relationToSituationRoom`: explicit sentence that IOC **uses** ISR outputs and **does not replace** ISR.

## Realtime classifications

Clients distinguish **DOMAIN_LIVE**, **DEMO_MIRROR**, and **SYNTHETIC_TICK** for `INDUSTRIAL_OPERATIONAL_CONTINUITY` stream rows — transport/provenance labels, not autonomous decisions.

**Synthetic tick naming (18.7A):** gateway-generated demo ticks use `demo.industrial_operational_continuity.synthetic_tick.*` **only** — never `live.*`. **`live.*`** types are reserved for **core → gateway** domain fan-in (`DOMAIN_LIVE`). The UI must not label synthetic ticks as live domain signals.

## Slice routes and FULL_COMPOSE (18.7A)

- `GET .../stability-states`, `/pressures`, `/corridors`, `/cadence`, `/briefings` return **views of the same full compose** as `GET .../bundle`.
- Responses include `sliceDiagnostics` with `recommendedClientMode: "BUNDLE_FIRST_ONLY"`, `parallelSliceWarning`, and HTTP header `x-venext-slice-cost: FULL_COMPOSE`.
- **Do not** call multiple slice endpoints in parallel expecting lower cost; prefer **bundle first**.

## Degraded / disabled

- When flags or upstream dependencies are off, the engine returns an **empty / disabled** bundle with **zero** continuity compose steps and explicit cost disclosure that **no** upstream situation-room materialization ran (or upstream situation room is inactive).
