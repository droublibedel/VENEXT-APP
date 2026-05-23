# Commercial trust layer (Instruction 20.3)

## Philosophy

VENEXT models **private, relational economic trust** derived from corridor behavior: negotiation cadence, accepted relationships, sponsored discovery outcomes, symbolic reservation alignment, and aggregate order status patterns. It is **not** a public marketplace reputation system, social graph, or popularity score.

## Difference from marketplace reputation

- No public stars, leaderboards, or “top seller” semantics.
- Trust levels and scores are **visibility-scoped** (self, accepted partner limited view, sponsored temporary minimal, or back-office full).
- Diagnostics explicitly state `heuristicOnly`, disabled public ranking, and disabled social scoring.

## Confidentiality

Trust profiles are readable only when:

- the subject organization reads itself (`SELF_PRIVATE`);
- an **ACCEPTED** upstream/downstream partner reads a limited projection (`ACCEPTED_PARTNER_LIMITED`);
- an active **sponsored conversation window** grants a minimal temporary slice (`SPONSORED_TEMPORARY_MINIMAL`);
- **back-office** operators present valid admin headers/token (`BACKOFFICE_FULL`).

## Visibility scopes

| Scope                             | Typical consumer                         |
| --------------------------------- | ---------------------------------------- |
| `SELF_PRIVATE`                    | Member of the subject organization       |
| `ACCEPTED_PARTNER_LIMITED`        | Accepted corridor partner                |
| `SPONSORED_TEMPORARY_MINIMAL`    | Active sponsored window counterpart      |
| `BACKOFFICE_FULL`                 | Internal governance / ops               |

**Instruction 20.3A — `NONE` removed as an API-visible scope.** Missing actor, unknown subject, or no corridor match does **not** downgrade to a “none” payload: the API returns **403** (`commercial_trust_visibility_denied` / `commercial_trust_profile_not_visible` / `commercial_trust_profile_actor_required`). A full profile, full trust score, full signals, or rich metadata must **never** be returned in that situation.

## Trust visibility hardening (20.3A)

- **NONE is always denied:** `CommercialTrustVisibilityService.assertProfileReadable` throws `ForbiddenException` when `actingOrganizationId` is missing (except explicit `DEV_AUTH_BYPASS` or backoffice full). `CommercialTrustQueryService` defensively rejects any legacy `"NONE"` scope before redaction.
- **Partner limited redaction:** Partner corridor views use banded `trustScore` (numeric corridor band, not the raw score), `trustCorridorBand` (`LOW` \| `MEDIUM` \| `HIGH`), stripped ratios, empty signal metadata, generic explanations, and a restricted allow-list of signal types.
- **Sponsored minimal visibility:** No per-signal rows, no ratios, no snapshots in the profile response; `trustScore` is a **non-informative placeholder** (schema-satisfying only) plus `sponsoredMinimalDisclaimer`; trust level remains coarse.
- **Runtime Zod validation:** `CommercialTrustProfileResponseSchema` / `CommercialTrustRelationshipResponseSchema` validate core HTTP responses before return; invalid shapes become **500** with a contract violation code.
- **Realtime minimalism:** Gateway domain fan-in for commercial trust uses a **fixed short `detail` string** (no `JSON.stringify` of the HTTP body). Client rows may attach `commercialTrustRealtimePayload` with only: `organizationId`, `relationshipId` (nullable), `trustLevel`, `changedSignals`, `heuristicOnly`, `computedAt` — unknown extra keys are dropped (payload rejected).
- **Orders integration:** Order rows are read inside `CommercialTrustComputationService`. The only in-repo **Order create** path today is negotiation → cart (`NegotiationToCartConverterService`), which calls `CommercialTrustTouchService.touchOrganizations` (non-blocking batch). The relational-orders module is **read-only** for mutations; operators should run **`POST /v1/internal/v1/commercial-trust/recompute-orders-impact/:organizationId`** (or `recompute`) on a schedule if order aggregates must refresh without negotiation events.
- **Internal route path warning:** Nest `setGlobalPrefix("v1")` + controller base `internal/v1/commercial-trust` ⇒ effective paths **`/v1/internal/v1/commercial-trust/...`** (double `v1`). See `COMMERCIAL_TRUST_INTERNAL_CONTROLLER_PATH` in core-domain `commercial-trust-routes.constants.ts`.
- **Profile route auth:** `CommercialTrustProfileAccessGuard` on `GET /commercial-trust/profile/:id` and `GET /commercial-trust/relationship/:id` — resolved actor required unless dev bypass or backoffice full; visibility rules remain in `CommercialTrustVisibilityService`.
- **Diagnostics:** Responses include `actorRequired: true`, `anonymousAccessAllowed: false`, `visibilityEnforcedAt: "GUARD_AND_SERVICE"`.

## Heuristic limits

Computation is **per `organizationId`**, bounded Prisma samples (negotiation cap, edge caps, shipment lookback), persisted snapshots, and internal recompute. Diagnostics expose `computationMode: PER_ORGANIZATION`, `incrementalReady`, and `dataCompleteness` proxies — not a claim of ground truth.

## Integrations

- **Sponsored discovery (20.2B):** trust touch on conversation open, relationship request, sync outcomes, and window expiration batch.
- **Negotiation (20.1):** completion ratios, unresolved ratios, latency proxy from negotiation timestamps (not chat volume).
- **Relational orders (20.0):** aggregate status mix (`ORDER_FULFILLMENT_CONSISTENCY`) — counts only, never prices. See **Trust visibility hardening** for how trust refresh aligns when orders change outside negotiation→cart.

## Realtime

Events `commercial.trust.updated` and `commercial.relationship.signal.changed` are emitted from core with **minimal bodies** (no messages, catalogues, or pricing). The gateway maps them to **non-sensitive** row `detail` text and an optional **whitelisted** `commercialTrustRealtimePayload` for clients subscribed to the `COMMERCIAL_TRUST` pole.

## Accepted relationship counting (20.3A)

`acceptedRelationshipWhereForOrg` and `hasAcceptedRelationshipBetween` treat **both** upstream/downstream **and** requester/receiver edges as first-class. `countDistinctAcceptedRelationships` counts **distinct relationship ids** (no double-count when multiple columns reference the same org on one row). Pure helper `isAcceptedCommercialRelationshipForOrg` documents per-row eligibility.

## Risks

Heuristic drift, sparse corridors producing `LOW` confidence, and misinterpretation if UI copy becomes gamified — guarded by wording tests and diagnostics copy.
