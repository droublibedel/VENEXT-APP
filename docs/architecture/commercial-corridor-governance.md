# Commercial corridor governance (Instruction 20.4)

## What a corridor is

In VENEXT, an **ACCEPTED** commercial relationship is not a lightweight social connection. It is a **private economic corridor**: a governed channel between two organizations with its own lifecycle, health model, visibility rules, and audit surface.

The corridor layer **does not** turn VENEXT into a marketplace. There is no public ranking, no viral discovery graph, and no social reputation feed.

## Corridor ≠ trust

- **Commercial trust** is anchored on an **organization** (buyer/seller entity). It summarizes how that org behaves across accepted corridors, negotiations, and controlled sponsorship signals.
- **Corridor intelligence** is anchored on a **specific relationship** (a dyad / directed edge). It describes the operational and economic *coherence* of that private channel.

Trust may **influence** corridor heuristics with a **small, explicit, capped** modifier, but the persistence, enums, and APIs remain separate. Trust scores are never merged into corridor rows as a single fused model.

## Corridor ≠ marketplace

Corridor visibility is one of:

- strict private (parties only),
- partner-limited analytics,
- internal analytics engines,
- backoffice governance.

There is **no** global index of corridors, **no** public leaderboard, and **no** cross-tenant “best corridor” surface.

## State machine

`CommercialCorridorState` is richer than `Relationship.status`. Graph status remains the lifecycle truth, while `corridorState` captures operational posture (active, dormant, degraded, suspended, blocked, etc.). Illegal transitions are rejected at the policy layer.

## Health engine

`RelationshipGovernanceService.computeCorridorHealth` runs **per relationship id** with **bounded lookbacks** (orders / negotiations windows). Outputs include a private `corridorHealthScore`, derived `corridorState`, risk band, structured diagnostics, and persisted `CommercialCorridorSnapshot` rows to avoid full-table recomputation on read.

## Realtime

Core emits **minimal** `commercial.corridor.*` payloads to the API gateway. The gateway applies a **strict key whitelist** and **Zod** (`CommercialCorridorRealtimeSchema`) before attaching payloads to websocket items. Forbidden content includes exact trust scores, monetary amounts, catalog payloads, and raw conversations.

## Sponsored discovery

Sponsored acceptance follows the sponsor window + request sync contract; once validated, governance may transition the corridor to **ACTIVE** and emit a controlled success signal. Sponsored rejection terminates the corridor signal lane with a conflict-pattern signal. Expired sponsor windows cannot be used as a backdoor read path for corridor intelligence.

## Instruction 20.4A — relationship governance hardening

### State machine enforcement

All **commercial** `corridorState` mutations that are not the documented graph lifecycle mirror go through `RelationshipGovernancePolicyService.applyCorridorStateTransition`, which calls `validateRelationshipGovernance` (matrix + extra rules such as **BLOCKED → never ACCEPTED**). `applyGraphLifecycleCorridorMirror` is reserved for internal graph sync only; it bypasses the matrix by design and logs `governanceBypassReason: graph_lifecycle_corridor_mirror_internal`. `RelationshipGovernanceService.computeCorridorHealth` may persist a new `corridorState` only when the transition is allowed and the current state is **not** in `PROTECTED_CORRIDOR_STATES`.

### Protected states

`PROTECTED_CORRIDOR_STATES` includes **BLOCKED**, **SUSPENDED**, **RESTRICTED**, **TERMINATED**, and **PENDING_REVIEW**. The health engine may still compute a suggested operational state, but diagnostics record `computedSuggestedState`, `persistedCorridorState`, `protectedStatePreserved`, and `stateOverwriteBlockedReason` instead of overwriting the row.

### Sponsored outcome governance

`applySponsoredRelationshipOutcome` requires an **ACCEPTED** relationship, a coherent sponsor window (not expired), **RELATIONSHIP_ACCEPTED_SYNCED** on the sponsored request, `convertedToRelationship`, and disallows activation from **BLOCKED** / **SUSPENDED** corridors. Outcomes use `applyCorridorStateTransition` (accepted → **ACTIVE**; rejected commercial → **TERMINATED** with conflict signal; blocked / suspended graph statuses map corridor to **BLOCKED** / **SUSPENDED**). `sponsoredConversionSuccess` in diagnostics is derived only when the full sync contract holds, not from `SPONSORED_DISCOVERY` + `ACCEPTED` alone.

### Relationship id for negotiations

`NegotiationEngineService` resolves a relationship for the buyer/seller edge. If none exists, the engine allows only the **sponsored temporary** lane (principle agreement, no hard acceptance). Otherwise mutations throw **`commercial_corridor_required`**. `NegotiationToCartConverterService` requires the same resolved relationship and `cart_conversion` corridor checks; production may **fail closed** if governance policy is not injected (`VENEXT_GOVERNANCE_FAIL_CLOSED`).

### Operational corridor rules

`assertCorridorOperational` distinguishes **negotiation**, **order_creation**, **cart_conversion**, and **reservation_strong**. **BLOCKED** blocks all; **SUSPENDED** blocks commerce and strong reservation and (by default) negotiation unless explicitly allowed for review flows; **RESTRICTED** / **PENDING_REVIEW** block commerce; **DORMANT** blocks new orders/carts until a reactivation path sets `allowDormantOrderReactivation`. **DEGRADED** does not hard-block; warnings live in diagnostics.

### Realtime symmetry

Corridor domain events are posted per **target organization** (deduped party list) through the internal gateway fan-out. Payloads are Zod-validated (`CommercialCorridorRealtimeSchema`) with explicit delivery arrays and bounded `changedSignals` — never trust scores, orders, prices, messages, or catalog data. The API gateway reapplies the same schema at ingress.

### Signal readiness

Diagnostics expose **`emittedSignalTypes`**, **`unavailableSignalTypes`**, and per-signal **`signalReadiness`** (`EMITTED`, `NOT_CONNECTED_YET`, `REQUIRES_PAYMENT_MODULE`, `REQUIRES_LOGISTICS_MODULE`, `REQUIRES_MORE_HISTORY`) so the UI never presents a signal as live when the engine does not emit it.

### Risk level unification

`deriveCorridorRiskLevel` is the single function mapping **health score + corridor state (+ degraded flag)** to **LOW | MEDIUM | HIGH | CRITICAL**, used in compute, snapshots, queries, and diagnostics (no inversion with health bands).

### Visibility enforcement

`assertCorridorIntelligenceVisibility` enforces **BACKOFFICE_ONLY** and **INTERNAL_ANALYTICS** on reads (non-backoffice actors get **Forbidden**). **PARTNER_ONLY** vs **STRICT_PRIVATE** affects redaction depth in `RelationshipGovernanceQueryService` (metadata and numeric health hidden or coarsened for non-backoffice).

### Known limitations

Suspended negotiation in “review” mode requires an explicit **`allowSuspendedNegotiation`** flag at call sites; the default remains deny. Optional governance dependencies log **ERROR** in production when missing and only throw when **fail closed** is enabled.

## Instruction 20.4B — corridor governance final hardening

### Sponsored sync awaits corridor outcome

`SponsoredRelationshipSyncService` **awaits** `RelationshipGovernanceService.applySponsoredRelationshipOutcome` after the sponsor window + request rows are updated. Analytics bumps and `accepted_synced` / `rejected_synced` realtime maintenance events fire **only** when the corridor outcome succeeds. In production, a missing governance service on this mutation path **fails closed** (`InternalServerErrorException`). Development logs structured warnings and returns `corridorGovernanceSynced: false` without emitting the maintenance events.

### Single writer for `corridorState`

All `Relationship.corridorState` mutations go through `RelationshipGovernancePolicyService.persistCorridorStateRow` (including `applyCorridorStateTransition`, `applyGraphLifecycleCorridorMirror`, and `computeCorridorHealth` via `HEALTH_COMPUTE` audit). Generic repositories must not set `corridorState` directly.

### Compute routing

`computeCorridorHealth` proposes an operational state, merges optional-dependency diagnostics, persists via the single writer with `governanceDecisionSource: "HEALTH_COMPUTE"`, and records `computedSuggestedState` / transition denial fields in diagnostics when protected states block writes.

### Optional dependency honesty

`detectOptionalDependencyStatus` reports `optionalDependencyMissing`, `optionalDependencyWarnings`, `dependencyStatus`, and `productionFailClosed`, plus policy wiring truth: `orderCreationDirectCallSites: "NOT_PRESENT_IN_CODEBASE"`, `orderCreationPolicyWired: false`, `cartConversionPolicyWired: true`. Negotiation and cart conversion paths log these structures when optional policy injection is absent.

### Realtime delivery honesty

`CommercialCorridorRealtimeSchema` replaces blind symmetry with `intendedTargetOrganizationIds`, `deliveredTargetOrganizationIds`, optional `skippedTargetOrganizationIds`, `emittedToAllCorridorParties`, and `partialDeliveryReason`. `changedSignals` is a strict union of engine signal types and `CommercialCorridorRealtimeChangeType` tokens. Zod refiners reject impossible `emittedToAllCorridorParties: true` claims without two distinct parties and two distinct delivered ids. Core emits conservative per-org payloads (`emittedToAllCorridorParties: false`) and logs `emittedToAllCorridorPartiesDerived` after the fan-out round.

### `order_creation` policy truth

No direct `Order` creation call sites exist outside the negotiation → cart conversion path; diagnostics expose **`NOT_PRESENT_IN_CODEBASE`**. `cart_conversion` remains the commerce gate wired to `assertCorridorOperational`.

### DEGRADED operational caution

`assertCorridorOperational` attaches `CORRIDOR_DEGRADED_OPERATIONAL_CAUTION` to optional `governanceTelemetry` bags; negotiation and cart conversion log structured telemetry when warnings are present.

### Frontend numeric redaction

`CorridorOverviewSurface` shows the 0–100 internal index **only** when `relationshipIntelligenceScope === RELATIONSHIP_BACKOFFICE_FULL` and the API exposes `corridorHealthNumeric`; partner/private scopes never render the exact figure even if a contract leak occurred.

### Sponsored rejection mapping

Sponsored rejection applies `BLOCKED` / `SUSPENDED` corridor targets when the graph relationship is blocked or suspended; commercial rejection maps to `TERMINATED`, with window-expiry annotations on metadata. Diagnostics carry `sponsoredRejectionReason`, `sponsoredRejectionPolicy`, and `sponsoredRejectionCorridorTarget` after compute overlays.
