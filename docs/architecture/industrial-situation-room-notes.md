# Industrial situation room (Instruction 18.6)

## Purpose

The industrial situation room is an **advisory, symbolic, deterministic** cockpit layered **above** economic command. It is intended for COO / supply / industrial / crisis-cell style **readouts**, not for conversational automation, autonomous agents, or real-world orchestration.

## Symbolic nature

- **advisoryOnly** and **symbolicExecution** are explicit on situation cells, operational missions, and critical dependencies.
- Map geometry uses **symbolic projection** (no real geography, no dispatch routing).
- **heuristicOnly: true** on executive attention items — bounded, explainable heuristics, not generative “AI” advice.

## No execution

- The module does **not** mutate business data, assign operational tasks, trigger workflows, or perform auto-remediation.
- Missions are **labels for attention and cross-domain review**, not executable work packages.

## Deterministic pipeline

- One **cold** economic-command materialization per organization per cache window: `IndustrialSituationRoomEngineService` calls `EconomicCommandEngineService.getBundleWithCacheMeta` only when the short TTL situation-room cache misses.
- **Propagation** is not composed a second time by the situation room; it is embedded inside the economic-command bundle already.
- **composePlan** mirrors the upstream economic-command compose steps and adds a single logical step `situationRoomSynthesis` (count meaning: `logical_pipeline_steps_not_cpu_cost`).

## Payload and projection

- **summary** (default): compact payload; upstream bundles are **not** embedded.
- **full**: larger payload; may attach `embeddedEconomicCommand` for audit/debug; diagnostics flag `sourceBundlesEmbedded` and `payloadWeightClass: large`, with `fullProjectionWarning` when applicable.

## Realtime classifications

Gateway and client surfaces distinguish:

- **DOMAIN_LIVE** — domain fan-out from core.
- **DEMO_MIRROR** — demo batch replay.
- **SYNTHETIC_TICK** — synthetic heartbeat / batch tick.

These labels describe **transport and provenance**, not autonomous decision-making.

## Degraded and disabled modes

- When feature flags or upstream dependencies are off, the engine returns a **disabled** bundle with honest **composePlan** zeros and disclosure that **no** upstream economic-command compose ran.
- **degradedMode** in diagnostics reflects contract-level degradation when present on the materialized bundle.

## Testing focus

- No second upstream economic-command compose when the situation-room cache hits.
- Missions and cells remain advisory/symbolic.
- Narrative strings avoid chatbot / copilot / “we recommend” framing.
