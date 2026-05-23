# Relational fulfillment coordination (Instruction 20.11)

## Purpose

VENEXT **operational coordination** is the B2B corridor task layer after fulfillment execution: responsibilities, deadlines, blocking steps, and partner confirmations. It is **not** Trello, Jira, Monday, marketplace customer support, or consumer parcel tracking.

## Incident vs task

| Incidents (20.10) | Tasks (20.11) |
|-------------------|----------------|
| Dispute / reception problem | Operational work item |
| Resolution workflow (propose / accept) | Status workflow (start / block / complete) |
| May block completion via `blocksFulfillmentCompletion` | May block via `blockingFulfillment` |

Both can prevent `FULFILLMENT_COMPLETED` until resolved or closed.

## Task model

- `RelationalFulfillmentTask` — corridor operational unit linked to fulfillment record, order, relationship.
- `RelationalFulfillmentTaskEvent` — append-only journal (no deletes).

Statuses: `OPEN` → `IN_PROGRESS` → `COMPLETED` / `BLOCKED` / `CANCELLED`, with waiting states for external / corridor validation.

## Blocking tasks

`blockingFulfillment: true` + open status → `countBlockingOpenTasks()` blocks fulfillment completion (in addition to unresolved blocking incidents).

## Confirmations

`requiresBuyerConfirmation` / `requiresSellerConfirmation` — task completes only when both sides confirmed (`buyerConfirmedAt` / `sellerConfirmedAt`).

## API

- `GET/POST …/relational-fulfillment/:id/tasks`
- `POST …/relational-fulfillment/tasks/:taskId/{assign|start|block|complete|reopen|cancel|comment}`

Participant guards: buyer/seller on fulfillment record only.

## Realtime

`relational.fulfillment.task_*` — minimal payload (`taskId`, status, type, priority). No long descriptions, fileUrl, GPS, payment.

## Feature flags

- `relational_fulfillment_coordination_enabled`
- `relational_fulfillment_coordination_realtime_enabled`

## Out of scope

No consumer notifications, wallet, PSP, public tracking URLs, GPS coordinates, marketplace SAV tickets.
