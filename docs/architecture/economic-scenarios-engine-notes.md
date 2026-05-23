# Economic scenarios engine (Instruction 18.3) — architecture notes

## What this engine is

- **Deterministic heuristic scenario engine.** Scenarios are composed from a current **economic propagation snapshot** (Instruction 18.1), optional **historical memory** signals (Instruction 18.2), and fixed lattice rules. There is **no calibrated forecasting**: outputs are **symbolic industrial projections** for operator judgment, not validated predictive models.

## What this engine is not

- **Not a financial simulator** — no market microstructure, no P&L guarantees.
- **Not ML training** — memory tables and crisis signatures support **pattern linkage**, not model training pipelines.
- **Not real GIS** — “territory” and lattice language is **symbolic**; maps in the UI are non-geographic canvases unless explicitly wired to a GIS stack elsewhere.

## Heuristic components (explicit limitations)

| Component | Nature |
|-----------|--------|
| **Comparison scores** (`similarityScore`, gaps, `systemicDifference`) | Heuristic overlap of poles, territories, and risk axes — **not** statistical distance on real outcomes. |
| **Trajectory T0–T3** | Discrete stress ladder from propagation rollup — **not** wall-clock timed paths. |
| **Stabilization proposals** | **Advisory** directions only — **no automatic execution** in core; operators decide. |
| **Risk assessments** | Bounded rubric from scenario + propagation context — **not** external credit or market data. |
| **Synthetic / fallback impacts** | When propagation chains yield no usable impacts, rows are labeled **`SYNTHETIC_FALLBACK`** with **`observational: false`** — they must **not** be read as observed propagation. |

## Persistence vs live bundle

- **`GET /v1/economic-scenarios/bundle`** returns the **live composed** bundle (short-TTL cache + compose). Response includes **`sourceMode: "LIVE_COMPOSED_SCENARIO"`** and **`liveComposeDiagnostics`** (`composeCacheHit`, `cacheStrategy`, `serverCost`). This is the primary operator surface.
- **`GET /v1/economic-scenarios/persisted`** reads **recent Prisma rows** for **audit and reconciliation** with **`sourceMode: "PERSISTED_SCENARIO_AUDIT"`** and **cursor pagination** (`limit`, `cursor`, optional `scenarioType` / `severity` filters). It **never** calls `getBundle` / compose.

## Production auth boundary (Instruction 18.3B)

- The **Next.js BFF** route `GET /api/economic-scenarios/[[...path]]` proxies to core-domain **server-side only**.
- **Demo mode** (`NEXT_PUBLIC_DEMO_MODE` or `VENEXT_DEMO_MODE` truthy): the BFF may attach **`x-venext-demo-actor: true`** and a **known demo user id** when forwarding — never treated as production identity.
- **Non-demo**: the BFF requires **`Authorization`**, or **`VENEXT_SERVER_ACTOR_USER_ID` + `VENEXT_SERVER_ACTOR_ORG_ID`** (for controlled server-to-server / CI), or it returns **403** with `economic_scenarios_bff_actor_required`. The browser must **not** send a fabricated production `x-venext-user-id` and have it trusted.
- The **web pole client** calls **`/api/economic-scenarios/v1/...`** only (not `/api/core/...` directly) so actor headers are not invented in the browser for production.

## Persisted audit trail purpose

- **Persisted** rows are **historical snapshots** written best-effort after compose. Use them for **audit, reconciliation, and drift checks** against the live bundle — not as the real-time operator feed.

## Pagination contract (`GET /persisted`)

- **`limit`**: default **25**, max **100** (clamped server-side).
- **`cursor`**: opaque **base64url** encoding of `{ createdAt ISO, id }` for stable keyset pagination (newest first).
- **`scenarioType` / `severity`**: optional equality filters.
- Response includes **`page: { limit, nextCursor, hasMore }`**.

## Memory reuse (18.3A)

- When `scenario_memory_enabled` is on, the engine prefetches a **single** recent memory event sample for the whole compose and passes it into each scenario’s memory link step (`memoryReuseStrategy: COMPOSE_LEVEL_MEMORY_CONTEXT`). This avoids repeating identical `findMany` calls per scenario.

## Slice HTTP routes

- Slice routes (`/overview`, `/scenarios`, etc.) return **views of the same full compose** as `GET /bundle`. Responses include **`sliceDiagnostics`** with `serverCost: "FULL_COMPOSE"`, **`cacheStrategy: "SHORT_TTL_SCENARIO_CACHE"`**, and **`composeCacheHit`** reflecting the engine’s in-memory TTL cache for that organization.
- Each HTTP slice call still hits Nest once; **compose reuse** happens when multiple slice calls occur within the **same TTL window** on the core instance (per-organization cache).

## Demo-mode warning

- Demo mode **relaxes** identity for local UX. **Do not enable** `NEXT_PUBLIC_DEMO_MODE` / `VENEXT_DEMO_MODE` on internet-exposed production unless the entire stack is understood to be non-production.

## AI briefing

- When enabled, the economic scenario **briefing** may use a **mock / bounded** AI provider. Treat narrative as **explanatory**, not authoritative risk sign-off.
