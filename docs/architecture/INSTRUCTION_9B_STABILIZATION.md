# Instruction 9B — Block 6→9 stabilization

Cross-cutting fixes after the global audit. No Instruction 10 scope; no new product features.

## Canonical sponsored engine

- **Owner:** `SponsoredInjectionEngineService` (`services/core-domain-service/src/modules/relational-commerce/sponsored-injection-engine.service.ts`).
- Single gate: `sponsored_products_enabled` via `RelationalFlagsService` → `CanonicalFeatureFlagEvaluator`.
- Category compatibility, geo, graph depth (`shortestPathHops` vs `maxRelationshipDepth`), and relevance floor live in this service only.
- `SponsoredVisibilityEngineService.listActiveInjections` delegates to the injection engine (no parallel Prisma listing path).

## Canonical feature flag evaluator

- **Owner:** `CanonicalFeatureFlagEvaluator` (`services/core-domain-service/src/feature-flags/canonical-feature-flag.evaluator.ts`).
- HTTP probe: `GET /v1/feature-flags/canonical/:key` (optional org/region/country query params).
- `RelationalFlagsService` and `FinancialFeaturesService` resolve booleans only through this evaluator.
- `FeatureFlagsService` remains for CRUD / admin listing (`findRuntime`, `upsertRuntime`), not per-request enablement logic.

## Demo vs live realtime

- **Demo:** WebSocket `session.open` advertises `demo.realtime.economic_signals` and `mode: "demo"`; batches use `type: demo.operational.signal.batch` (`services/api-gateway/src/realtime/realtime-economic-signal.gateway.ts`).
- **Live (contract):** `live.economic.signal`, `live.relationship.event`, `live.catalog.visibility.changed` — only for persisted/domain events. Core exposes `RealtimeDomainEventPublisher` (no-op implementation until a bridge exists).

## AuthZ bypass policy

- Headers: `x-venext-user-id`, `x-venext-acting-organization-id` (see `venext-auth-context.ts`).
- When `DEV_AUTH_BYPASS=true` or `1`, org/relationship checks log a warning and skip enforcement (`OrganizationAccessService`, `RelationshipAccessService`).
- Non-production with no headers still allows anonymous demo traffic; production-style denial applies when headers imply a different org than the route or when the user is not a relationship participant.

## Graph traversal limits

- `traverseNetwork(startOrganizationId, maxDepth, maxNodes)` batches `relationship.findMany` per frontier, returns `visitedNodes`, `exploredEdges`, `truncated`, and `maxDepth` (`commercial-relationship-graph-engine.service.ts`).

## Mobile pagination contract

- Query params: `limit`, `cursor`, `projection` (`summary` | `standard` | `full`).
- **Living catalog:** `GET /v1/product-intelligence/living-catalog` — default `standard`; pass `client=mobile` for summary unless `projection` is set.
- **Segmented partner feed:** `GET /v1/relational-commerce/catalog/segmented-feed` — catalog pagination via `limit` / `cursor`; sponsored lane may use `sponsoredLimit` / `sponsoredCursor` / `sponsoredProjection`.
- Responses expose `page: { limit, nextCursor, hasMore, projection }` on living catalog; segmented feed adds `catalogPage` and `sponsoredDiscoveryPage`.

## Guards (audit naming)

- `VenextAuthzGuard` — composite HTTP guard (`venext-authz.guard.ts`).
- `OrganizationAccessGuard` — alias export (`organization-access.guard.ts`), same class as `VenextAuthzGuard`.
