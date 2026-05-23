# Economic coordination engine — design notes (18.4 / 18.4A)

## Scope and limits

- The economic coordination layer is a **deterministic heuristic v1** readout. It synthesizes signals that already exist in propagation, scenarios, economic memory, and Data Intelligence.
- There is **no autonomous decision-making** and **no automatic business execution**. Recommendations are **symbolic** (`symbolicCoordinationOnly: true` where applicable); they do not trigger payments, stock movements, or CRM writes.
- Posture, cross-pole priorities, conflicts, escalation scores, and orchestration narratives are **proxies** for human review. **Thresholds are not calibrated** for production-grade risk management; treat numeric scores as relative indicators within a visit window, not as audited KPIs.

## Payload projection (`?projection=summary|full`)

- **Default: `summary`** — HTTP responses include coordination-level fields only (`overview`, `posture`, `priorities`, `conflicts`, `orchestrations`, `escalation`, `memory`, `diagnostics`). Large upstream bundles (propagation, scenarios, memory, Data Intelligence) are **not** embedded unless `projection=full`.
- **`full`** — may attach `sourceBundles` (propagation, scenarios, memory context, Data Intelligence) for audit or deep debugging. Diagnostics expose `payloadProjection` and `sourceBundlesEmbedded`.

## Data Intelligence reuse

- Propagation compose may already materialize a Data Intelligence bundle. When `upstreamDataIntelligenceBundle` is present on the propagation bundle, coordination **reuses** it and avoids a second `DataIntelligenceBundleService.compose` call where possible. Diagnostics report `dataIntelligenceReuse` (`FROM_PROPAGATION` | `DIRECT_COMPOSE` | `UNAVAILABLE`) and `dataIntelligenceComposeCount`.

## Systemic intelligence pressure naming

- `overview.systemicIntelligencePressure` is derived from Data Intelligence `economicPropagationScore`. It is **not** “strategic department pressure”. Diagnostics carry `strategicPressureSource` and `strategicPressureLabel` so UI and integrations can label the scalar honestly as a **proxy**.

## Shock taxonomy

- Supply / finance / relationship / strategic / operational shock classification uses a **controlled taxonomy** (`economic-coordination-shock-taxonomy.ts`) instead of ad hoc regex scattered across services. Extend the allowlists when new shock types are introduced in `EconomicShockService`.

## Symbolic map canvas

- The operational map for this pole uses **symbolic projection** (densities placed in a demo bounding box). It is **not** surveyed industrial geography. See `ECONOMIC_COORDINATION_SYMBOLIC_PROJECTION` in the web canvas adapter.

## Explaining this to industrial users

- Position the layer as a **read-only coordination cockpit**: it highlights where poles disagree on risk narratives, where logistics and finance scalars diverge, and where scenario optimism conflicts with propagation stress.
- Emphasize **human arbitration**: the system documents tensions and sequencing ideas; it does not close incidents, re-route inventory, or change payment terms.
- When asked about scores, say they are **heuristic blends** refreshed on a short TTL cache — useful for stand-ups and war rooms, not for compliance sign-off without domain review.
