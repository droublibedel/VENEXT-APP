# Commercial relationship graph (Instruction 19.1)

## What this layer is

The commercial relationship graph is a **closed, validated, economic relationship projection** built on Prisma `Relationship` rows (and related organization metadata). It answers questions about **distribution structure**, **commercial dependency**, **symbolic coverage**, and **corridor risk** for a producer-scoped industrial view.

## What VENEXT is not (and how this module stays honest)

| Anti-pattern | How 19.1 avoids it |
|--------------|-------------------|
| Open marketplace | No public discovery, no catalog browsing for strangers. `openMarketplace: false` is enforced in diagnostics. |
| Social network | No followers, likes, feeds, or social scoring. `socialNetworkMode: false` in diagnostics; UI copy is relationship / partner / corridor language only. |
| Classic CRM graph | Edges are **validated commercial relationships** with provenance (`RelationshipSource`, `RelationshipStatus`), not arbitrary contacts. |
| “Fake network” demo | Canvas positions are **deterministic hashes** of organization IDs inside a demo bounding box — **symbolic layout**, not surveyed geography. |

## Validated relationships first

Default materialization uses **`RelationshipStatus.ACCEPTED`** only. Pending edges appear **only** when `includePending` is explicitly requested; diagnostics expose `pendingEdgePreviewIncluded`.

## Symbolic projection

Coverage, territories, and map coordinates are **symbolic**. The bundle and canvas adapter carry `symbolicProjection: true` and French disclosure: *projection relationnelle symbolique — non géographique réelle*. This is suitable for future mobile / wholesaler / retailer experiences without implying GPS truth.

## Commercial dependency & coverage

- **Dependency clusters** aggregate concentration (e.g. many retailers on one wholesaler), dormant corridors, and bridge overload heuristics.
- **Coverage** is expressed as densities and gap labels — not a real choropleth map.

## Heuristic limits

Signals and scores are **bounded 0–1**, `heuristicOnly: true`, `advisoryOnly: true`. Each signal carries a **`confidenceExplanation`** string derived from deterministic counts (documented in the engine), not opaque ML.

## Future usage (mobile / B2B tiers)

The same `CommercialRelationshipGraphBundle` contract can power:

- Producer dashboards (upstream/downstream stability),
- Wholesaler corridor load views,
- Retailer dependency warnings,
- Offline-first summaries (`projection=summary`).

Keep **bundle-first** semantics: slice HTTP routes are **projections** of one materialization (see `buildCommercialRelationshipGraphSliceDiagnostics`).

---

## Instruction 19.1A — hardening & unification (architecture)

### Engine unification (single source of truth)

- **Official bundle materializer (19.1):** `CommercialRelationshipGraphEngineService` in `services/core-domain-service/src/modules/commercial-relationship-graph/commercial-relationship-graph-engine.service.ts`. This is the only class that emits `CommercialRelationshipGraphBundle` with full diagnostics (`emittedClusterTypes`, truncation flags, `dataSourcesUsed`, etc.).
- **Legacy HTTP traverser (renamed, not a second “graph truth”):** `RelationalCommerceNetworkTraverserService` in `services/core-domain-service/src/modules/relational-commerce/relational-commerce-network-traverser.service.ts`. It serves **partners pack**, **bounded `traverseNetwork`**, **shortest-path hops**, and **QR join** flows used by relational-commerce, commercial-network context, sponsored injection, and data intelligence. It does **not** duplicate bundle materialization; comments in that file point to the official engine module.

### Consumer alignment

- `relational-commerce.module.ts` registers the traverser instead of a second `CommercialRelationshipGraphEngineService` under relational-commerce.
- `commercial-network-relationships` exposes `graphReuse: COMMERCIAL_NETWORK_RELATIONSHIPS_GRAPH_REUSE_TOKEN` (see `packages/shared-contracts/src/commercial-network/dtos.ts`) documenting **both** the traverser slice and the official bundle class name — no silent double logic.

### Signal taxonomy

- **`pending_relationship_signal`:** pending invitations / non-validated preview when `includePending` is used — never conflated with **`expansion_opportunity_signal`**, which is reserved for edges classified as expansion in the validated model.

### Cluster / chain contract honesty

- Full materialization fills **`emittedClusterTypes` / `unavailableClusterTypes`** and **`emittedChainTypes` / `unavailableChainTypes`** from what the builders actually return (or empty when chains are disabled by flag).
- **`summary` HTTP projection** strips chain payloads and caps clusters to 12 entries; diagnostics are **recomputed** for the visible payload, with **`summaryProjectionOmitsChains`** / **`summaryProjectionClustersCapped`** so clients are not misled by full-graph type lists while viewing a compact body.

### Pagination & limits

- Prisma reads use bounded `take` values; the bundle exposes **`nodesLimit`**, **`edgesLimit`**, **`nodesTruncated`**, **`edgesTruncated`**, and **`paginationSupported: false`** until cursor pagination is implemented.

### Viewer scope (future wholesaler / retailer / mobile)

- Diagnostics include **`viewerScope`** (`INDUSTRIAL_PRODUCER_VIEW` by default). Enum also defines **`WHOLESALER_VIEW`**, **`RETAILER_VIEW`**, **`ADMIN_VIEW`** for future enforcement — **no broadened data access yet**, only typed preparation.

### Additional bounded data sources (19.1A)

- Per-edge and diagnostics enrichment uses **Prisma `groupBy` / bounded `findMany`** on orders, reservation intents, shipments, group-buying sessions, product visibility, economic-signal count (ego org), and negotiation pairs matched by buyer/seller org IDs in the subgraph — **no N+1** relationship queries for these aggregates.

### Role fallback

- Unknown commercial categories (with edges) map to **`UNKNOWN_COMMERCIAL_ROLE`** instead of silently labelling **`WHOLESALER_B`**.

### Future catalogue dependency

- Relational catalogues and commands remain **out of scope** for 19.1A; the graph layer only reads visibility and relationship-scoped counts where already modeled in Prisma, to stay ready for catalogue modules without implementing them here.
