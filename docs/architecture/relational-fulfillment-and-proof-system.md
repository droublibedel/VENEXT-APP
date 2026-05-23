# Relational fulfillment & reception proof (Instruction 20.9)

## Purpose

VENEXT **relational fulfillment** is the post–order-execution operational layer for **B2B corridor partners**: loading, transfer, arrival, commercial reception proof, partner validation, and operational incidents. It is **not** consumer home delivery, not public parcel tracking, and not a marketplace support desk.

## Difference vs public delivery

| Relational fulfillment (20.9) | Consumer delivery (out of scope) |
|--------------------------------|----------------------------------|
| Inter-enterprise corridor ops | End-customer “track my package” |
| Reception proof & partner validation | GPS live map for shoppers |
| Governance-bound transitions | Checkout / pay-now flows |
| `publicTrackingDisabled: true` contract | Public tracking tokens |

## Link to order execution (20.8)

When `Order.relationalOrderExecutionStatus` becomes **`READY_FOR_DISPATCH`** or **`DISPATCHED`**, core creates a `RelationalFulfillmentRecord` in the **same DB transaction** as the execution event (via `ensureFulfillmentRecordForExecution`). Records are **not** created for `CANCELLED` / `BLOCKED` execution, or before dispatch readiness.

Initial fulfillment status: **`PREPARING_FULFILLMENT`**.

## State machine

Linear path:

`PREPARING_FULFILLMENT` → `READY_FOR_LOADING` → `LOADING_CONFIRMED` → `IN_TRANSFER` → `ARRIVED_AT_DESTINATION` → `RECEPTION_PENDING_VALIDATION` → `RECEPTION_VALIDATED` → `FULFILLMENT_COMPLETED`.

Branches: `INCIDENT_REPORTED`, `RECEPTION_PARTIALLY_VALIDATED`, `RECEPTION_REJECTED`, `FULFILLMENT_BLOCKED`. Terminals: `FULFILLMENT_COMPLETED`, `FULFILLMENT_BLOCKED`, `RECEPTION_REJECTED`. No backward jumps; reception validation requires arrival (or pending-validation phase).

## Reception proof

`POST …/proofs` accepts corridor proof types (`RECEIPT_PHOTO`, `RECEIPT_DOCUMENT`, `RECEIPT_SIGNATURE_SCAN`, `LOADING_DOCUMENT`, `DAMAGE_EVIDENCE`). No biometrics, no facial recognition, no human courier tracking.

## Reception validation

`POST …/validate-reception` is **buyer-only**. Requires arrival-phase status and at least one proof when `proofRequired`. Sets `proofValidated`, `receptionValidatedAt`, status `RECEPTION_VALIDATED`. If order execution is `RECEIVED`, `completeFulfillmentIfExecutionAligned` may advance to `FULFILLMENT_COMPLETED`.

## Incidents

Operational incident types (damage, partial reception, document mismatch, etc.) create `RelationalFulfillmentIncident` rows and may set `INCIDENT_REPORTED` or partial validation — not public SAV tickets.

## Corridor governance

All mutating paths call `assertCorridorOperational(..., "fulfillment_execution")` with the same fail-closed matrix as order execution (TERMINATED / BLOCKED / SUSPENDED denied; DEGRADED warnings; RESTRICTED backoffice; DORMANT env gate).

## Realtime

Envelope family `relational.fulfillment.*` published to the existing relational-orders internal domain-signal route. Payload validated by `RelationalFulfillmentRealtimeSchema` (strict, no GPS, wallet, or payment fields).

## Feature flags

- `relational_fulfillment_enabled`
- `relational_fulfillment_realtime_enabled`
- `relational_fulfillment_proof_enabled`

## Instruction 20.9A — hardening (audit-ready)

### Proof bypass closed

Generic `POST …/transitions` **cannot** reach `RECEPTION_VALIDATED`, `FULFILLMENT_COMPLETED`, `RECEPTION_PARTIALLY_VALIDATED`, or `RECEPTION_REJECTED`. Error code: `fulfillment_sensitive_transition_requires_domain_endpoint` with `sensitiveTransitionBlocked`, `requiredDomainEndpoint`, `attemptedTargetStatus`.

Domain-only paths:

- `POST …/validate-reception` → `RECEPTION_VALIDATED` (buyer-only)
- `completeFulfillmentIfExecutionAligned()` → `FULFILLMENT_COMPLETED`
- `POST …/report-incident` → partial / incident statuses

### Event journal

`RelationalFulfillmentEvent` persists every mutation: transitions, proofs, validation, incidents, completion. Enum `RelationalFulfillmentEventType`: `FULFILLMENT_TRANSITIONED`, `FULFILLMENT_PROOF_SUBMITTED`, `RECEPTION_VALIDATED`, `INCIDENT_REPORTED`, `FULFILLMENT_COMPLETED`, `FULFILLMENT_BLOCKED`.

### Transactions / concurrency

All mutations run in Prisma transactions with status re-check and `updateMany` expected-status guards. Conflict: `fulfillment_concurrency_conflict`.

### POST response Zod

`RelationalFulfillmentActionResponseSchema` validates all mutation responses (`paymentExecutionDisabled: true`, `publicTrackingDisabled: true` literals required).

### fileUrl V1 validation

Allowed: `/uploads/…` relative paths; HTTPS hosts in `VENEXT_PROOF_FILE_ALLOWED_HOSTS`. Rejected: `http://`, `file://`, `ftp://`, `javascript:`, localhost, private IPs. Error: `fulfillment_proof_file_url_not_allowed`.

### Blocking incidents

Blocking: `UNAUTHORIZED_SUBSTITUTION`, `DOCUMENT_MISMATCH`, `QUANTITY_MISMATCH` (+ `PARTIAL_RECEPTION` → `RECEPTION_PARTIALLY_VALIDATED`). Non-blocking by default: `FULFILLMENT_DELAY`, `PACKAGING_ISSUE` (recorded with warning, status unchanged).

### Frontend actions (minimal)

Pole `relational-fulfillment` exposes real API actions: advance step, submit proof (manual URL), validate reception (buyer), report incident. No fake upload; proof action hidden when `relational_fulfillment_proof_enabled` is off.

### Realtime minimalism

Action envelopes: `relational.fulfillment.proof_submitted`, `relational.fulfillment.reception_validated`, `relational.fulfillment.incident_reported`, `relational.fulfillment.completed`. Payload excludes `fileUrl`, incident `description`, GPS, payment, wallet.

## Instruction 20.10 — Incident resolution & reception dispute workflow

B2B corridor operational governance — **not** marketplace customer support, consumer refunds, or public dispute tickets.

### Reception rejection

`POST …/reject-reception` — **buyer-only**. Requires arrival-phase status. Sets `RECEPTION_REJECTED`, creates blocking incident (`resolutionStatus: OPEN`), `proofValidated: false`. Event `RECEPTION_REJECTED`, realtime `relational.fulfillment.reception_rejected`.

### Partial reception

`POST …/validate-partial-reception` — **buyer-only**. Notes required, proof if `proofRequired`. Status `RECEPTION_PARTIALLY_VALIDATED`, blocking incident OPEN until resolved. Event `PARTIAL_RECEPTION_VALIDATED`.

### Incident resolution proposal

`POST …/incidents/:incidentId/propose-resolution` — buyer or seller participant. Sets `RESOLUTION_PROPOSED`, stores `resolutionProposal`. Event `INCIDENT_RESOLUTION_PROPOSED`.

### Double acceptance

- `POST …/accept-resolution-buyer` — buyer only
- `POST …/accept-resolution-seller` — seller only

When **both** sides accept → `RESOLVED`, `blocksFulfillmentCompletion: false`, event `INCIDENT_RESOLVED`, realtime `relational.fulfillment.incident_resolved`. Completion may proceed via `completeFulfillmentIfExecutionAligned` when execution aligned.

### Completion after resolution

Unresolved blocking incidents (`resolutionStatus !== RESOLVED`) prevent `FULFILLMENT_COMPLETED`. Non-blocking incidents do not. Partial reception may complete after resolution when policy + execution align.

### Feature flag

`relational_fulfillment_incident_resolution_enabled` — when off, resolution mutations return `relational_fulfillment_incident_resolution_disabled`; read remains available.

### Out of scope

No consumer refund, wallet, PSP, public tracking, GPS, marketplace SAV vocabulary.

## V1 limitations

- No carrier GPS ingest or coordinates in persistence/contracts.
- No wallet / PSP orchestration on this surface.
- No consumer-facing tracking URLs or home-address delivery model.
- Proof storage is URL reference only (no file pipeline in V1).
