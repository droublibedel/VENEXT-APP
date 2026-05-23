# Relational order execution (Instruction 20.8)

## Purpose

VENEXT executes **relational** B2B orders as a **private corridor fulfillment core**: preparation, partner validation, dispatch confirmation, transit phases, arrival, reception, and completion. This is **not** a consumer marketplace checkout, **not** public parcel tracking, and **not** a wallet or PSP surface.

## Lifecycle

Operational statuses (`RelationalOrderExecutionStatus` on `orders.relational_order_execution_status`):

`CREATED` → `PREPARING` → `READY_FOR_DISPATCH` → `DISPATCHED` → `IN_TRANSIT` → `ARRIVED` → `RECEIVED` → `COMPLETED`.

Exceptional statuses: `BLOCKED`, `PARTIALLY_FULFILLED`, `REJECTED_AT_RECEPTION`, `CANCELLED`, `RETURN_REVIEW` (see policy service matrix). Arbitrary skips, backward jumps, `CREATED` → `COMPLETED`, and `RECEIVED` without the linear corridor chain are rejected.

## Governance

Every transition calls `RelationshipGovernancePolicyService.assertCorridorOperational(relationshipId, "order_execution")`:

- `BLOCKED` and `SUSPENDED` corridors deny execution.
- `RESTRICTED` denies execution unless a **documented backoffice** path matches cart-style restricted commerce override (header + actor; never body-spoofed).
- `DEGRADED` allows execution but emits **governance warnings** (telemetry only).
- `DORMANT` denies unless `VENEXT_ORDER_EXECUTION_ALLOW_DORMANT_CORRIDOR` is set to `1` or `true` (explicit env escape hatch).

## Execution events

Each successful transition persists `RelationalOrderExecutionEvent` with `previousStatus`, `nextStatus`, `eventType`, optional actors, `diagnostics` (e.g. delay hours, governance warnings), and `metadata` (e.g. idempotency key).

## Realtime

Core publishes to the internal gateway route `POST /internal/v1/realtime/relational-orders/domain-signal` with envelope types `relational.order.*` and a **strict minimal** JSON body validated by `RelationalOrderExecutionRealtimeSchema` at the gateway boundary. Payloads intentionally exclude GPS, public consumer tracking, wallet fields, prices, full catalog dumps, and private coordinates.

## Payment vs logistics

Execution telemetry is **logistics-oriented** and **governance-oriented**. `paymentExecutionDisabled: true` and `publicTrackingDisabled: true` are literal contract fields — payment rails stay out of this module in V1.

## V1 limitations

- No third-party carrier GPS ingest.
- No public tracking links.
- No marketplace discovery or ranking.
- English/French operational copy in UI surfaces; wording avoids “checkout”, “buy now”, and “track package”.

## Instruction 20.8A — execution hardening (audit closure)

### Corridor state exhaustiveness (`order_execution`)

`assertCorridorOperational(..., "order_execution")` delegates to `assertExhaustiveCorridorStateForOperation`, which **fail-closes** on every `CommercialCorridorState`:

- `TERMINATED`, `INVITED`, `PENDING_REVIEW`, `BLOCKED`, `SUSPENDED` → forbidden.
- `RESTRICTED` → forbidden unless `allowRestrictedOrderExecutionForBackoffice` (header-derived actor; never body metadata).
- `DORMANT` → forbidden unless `VENEXT_ORDER_EXECUTION_ALLOW_DORMANT_CORRIDOR` is `1`/`true` **and** `allowDormantOrderExecution` from the controller; emits warning codes.
- `DEGRADED` → allowed with structured governance warnings (same telemetry hook as other ops).
- `ACTIVE` → allowed.
- `ACCEPTED` → allowed with **legacy mirror** warning codes (graph/corridor alignment).

### `CANCELLED` vs `BLOCKED`

Prisma enum `RelationalOrderExecutionEventType` includes **`EXECUTION_CANCELLED`** (migration `20260524120000_instruction_20_8a_execution_cancelled_enum`). All transitions into `CANCELLED` map to that event type. Operational halts still use **`EXECUTION_BLOCKED`**. Persisted diagnostics add `haltKind: "CANCELLED"`, `executionStopReason: "ORDER_EXECUTION_CANCELLED"`, and `semanticEventType: "EXECUTION_CANCELLED"` for cancellation.

### Partial fulfillment completion

When `PARTIALLY_FULFILLED → COMPLETED`, transition diagnostics include `completionKind: "PARTIAL_FULFILLMENT_COMPLETED"`, `fulfilledAsPartial: true`, `requiresFulfillmentReview: true`, and `partialFulfillmentResolved: true`. Normal `RECEIVED → COMPLETED` (and `RETURN_REVIEW → COMPLETED`) use `completionKind: "STANDARD_EXECUTION_COMPLETED"` with `fulfilledAsPartial: false` and review flags cleared.

### POST transition Zod boundary

`RelationalOrderExecutionService.applyTransition` builds `RelationalOrderExecutionTransitionResponseSchema` and **`safeParse`**s it; invalid shapes throw `BadRequestException` with `relational_order_execution_transition_response_invalid`.

### Web `safeParse`

`fetchRelationalOrderExecutionView` validates with `RelationalOrderExecutionViewResponseSchema.safeParse`. Malformed JSON surfaces `relational_order_execution_response_invalid` (no silent cast-as-DTO fallback).

### `relationshipId` consistency

Transitions require a non-empty `order.relationshipId`, a matching `relationship` row in `ACCEPTED` status, and events always persist `relationshipId` from the order row. Diagnostics record `relationshipIdSource: "ORDER_RELATIONSHIP"` and `relationshipIdConsistencyValidated: true`.

### Realtime

`EXECUTION_CANCELLED` / `nextStatus === CANCELLED` publishes envelope **`relational.order.cancelled`**, distinct from **`relational.order.blocked`**. Optional `diagnostics` on realtime payloads are strict Zod (no prices, no GPS, no public tracking).

### Limitations (unchanged V1)

No PSP/wallet, no consumer checkout, no public parcel tracking product, no live GPS ingest — see sections above.
