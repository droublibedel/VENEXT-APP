# Relational catalog layer (Instructions 19.2 / 19.2A / 19.2B)

## Philosophy (non-marketplace)

VENEXT relational catalogs are **closed, relationship-scoped commercial projections**. They are explicitly **not**:

- an open public marketplace,
- a global product search engine,
- a consumer ecommerce storefront,
- a social commerce feed,
- a public recommendation or “interest / trend / demand spike” engine without behavioural data.

Principles enforced in diagnostics and engines:

- **`publicMarketplaceDisabled` / `publicDiscoveryDisabled`**: no public discovery.
- **`validatedRelationshipOnly`**: partner expansion uses **ACCEPTED** `Relationship` rows when the commercial relationship graph (19.1A) is **not** active; when the graph is **ACTIVE**, the **incident edge list** from the graph bundle is the relational truth (no Prisma widening).
- **`relationshipScopedCatalogs`** + **`visibilityPolicy: RELATIONSHIP_SCOPED_ONLY`**: products load only under `ProductVisibility` rules tied to the viewer org or corridor relationship ids.
- **`catalogExposureMode: PARTNER_NETWORK_ONLY`**: no open-network catalog crawl.
- Reuse **`CommercialRelationshipGraphEngineService`** (19.1A) as the official relational context when **`partnerSource: GRAPH_BUNDLE`** — **`partnerSource: PRISMA_FALLBACK`** is a bounded degraded path only when the graph layer is disabled for the org.

## Role-scoped access (read snapshot)

Corridor partner organizations are derived from **incident edges**, then **filtered by viewer role** (`roleScopeMode`):

| Mode | Who | Partner catalogs exposed |
|------|-----|---------------------------|
| `PRODUCER_DOWNSTREAM_ONLY` | Producer / industrial producer | **Downstream** partners only (viewer is `upstream` on the edge). **No upstream** partner catalogs on this route. |
| `WHOLESALER_UPSTREAM_ONLY` | Wholesaler | **Upstream suppliers** only (viewer is `downstream`). **Downstream** retailers’ catalogs are **intentionally excluded** on this read layer — not a marketplace toward the retail network. The wholesaler’s **own** catalogs remain visible as **owner org** rows. |
| `RETAILER_SUPPLIER_ONLY` | Retailer | **Direct validated suppliers** (viewer is `downstream`). No downstream / off-network discovery. |
| `ADMIN_NEIGHBOR_ONLY` | Internal admin | **Neighbors on incident edges only** — not enterprise-wide “broad read”. **`adminBroadReadSupported` is always `false`**. |
| `UNKNOWN_SELF_ONLY` | Unknown commercial viewer | **Self org only** — no partner catalogs. |

`roleScopedAccess` is always **`true`** in diagnostics (literal).

## Graph ACTIVE vs Prisma fallback

- **`partnerSource: GRAPH_BUNDLE`**, **`fallbackUsed: false`**: `commercial_relationship_graph` bundle policy **ACTIVE**; corridor edges = graph snapshot edges incident to the viewer (may be empty).
- **`partnerSource: PRISMA_FALLBACK`**, **`fallbackUsed: true`**, **`degradedMode: true`**: graph bundle **not** active; bounded Prisma `Relationship` query (`ACCEPTED`, capped) reconstructs incident edges for the same role geometry.

**`graphPartnerCount`**: count of **distinct neighbor organizations** on incident edges (before role filter), for transparency.

## Visibility model

Sources modeled in snapshots:

- **Relationship visibility** — `ProductVisibility.visibleToRelationshipId` limited to **`corridorRelationshipIds`** from the resolved corridor.
- **Organization visibility** — `visibleToOrganizationId` targeting the viewer.
- **Sponsored injection** — `SponsoredProductInjection` rows constrained to the same corridor; **`sponsorGlobalInjectionBlocked: true`**; **`sponsorRequiresRelationshipScope: true`**. Rows whose **`productId` is not in the current `accessibleProducts` page slice are dropped** (no “ghost” sponsor row without a visible product).

## Symbolic availability

Product **`stockStatus`** and related fields are **symbolic** Prisma state — **not real-time stock** or logistics commitment. The UI and diagnostics state this explicitly.

## Heuristic product signals

All emitted product signals are **`heuristicOnly` / `advisoryOnly` / `symbolicExecution`** with **`signalHeuristicOnly: true`** on diagnostics. The former **`rising_interest_signal`** was removed in **19.2B** and replaced by **`relational_catalog_density_signal`** (a **page-density** threshold, not behavioural interest).

## Catalog intelligence (*Proxy honesty)

Numeric fields **`isolatedRetailersProxy`** and **`concentratedWholesalersProxy`** remain for compatibility. They are **not field-verified business metrics**. Each ACTIVE snapshot includes:

- **`proxyDerived: true`**
- **`proxyInputs`**: documented symbolic inputs
- **`intelligenceExplanation`**: explicit disclaimer

## Pagination

- **`cursorStrategy: COMPOSITE_KEYSET`**
- Catalog cursor: `ownerOrganizationId:catalogId`
- Product cursor: `catalogId:productId`
- **`nextCatalogCursor` / `nextProductCursor`** + **`productsTruncated` / `catalogsTruncated`** expose partial-page state; no infinite table UI is required — diagnostics carry the contract.

## Future dependencies

- **Ordering / cart / checkout / payment** remain out of this module; catalogs stay **read-only** intelligence here.
- **Mobile** reuses the same BFF + contracts; no additional public discovery paths.

## Graph dependency

Snapshots echo **`graphReuse`** and materialize graph overview metrics for intelligence blending. **`partnerSource`** tells clients whether neighbor geometry came from the **graph bundle** or **Prisma fallback**.
