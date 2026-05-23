# Conversation Security & Trust Model (Instruction 20.1B)

This document describes how **commerce-messaging**, **relational negotiation drafts**, **negotiation-engine**, **offline outbound sync**, and the **commerce WebSocket** gate access. It is **not** a legal or contractual automation layer.

## Authentication and actor authority

- **Server-resolved actor only**: `CommerceThreadActorResolver` reads `x-venext-user-id` and `x-venext-acting-organization-id` (or dev bypass envs). Controllers must **not** trust `actorUserId`, `senderUserId`, `senderOrganizationId`, `buyerOrganizationId` / `sellerOrganizationId`, or `organizationId` from the client body for authorization.
- **Diagnostics**: responses can include `bodyActorTrusted: false` and `actorResolvedFrom` (`AUTH_CONTEXT` | `DEV_FALLBACK`).

## Thread corridor and access policy

- **`CommerceThreadAccessPolicy`**: single place for `assertCanReadThread`, `assertCanWriteThread`, `assertCanConfirmNegotiationDraft`, and commercial consistency (thread ↔ negotiation ↔ product owner ↔ accepted relationship).
- **Guards**: `CommerceThreadParticipantGuard` (routes with `:threadId`), `CommerceMessagingActorGuard` (actor-only routes), `NegotiationParticipantGuard` (negotiation `:id`).

## WebSocket subscribe (api-gateway)

- **Production-like** (`NODE_ENV=production` without `VENEXT_COMMERCE_WS_OPEN_INSECURE=1`): subscribe requires **`userId` + `organizationId`** in the subscribe JSON; the gateway calls core `POST /v1/internal/commerce-messaging/ws-subscribe-validate` with `VENEXT_INTERNAL_REALTIME_KEY`. Successful validation sets `wsThreadScopeValidated: true` when membership and corridor checks pass.
- **Explicit insecure OPEN** (dev default or `VENEXT_COMMERCE_WS_OPEN_INSECURE=1`): threadId-only subscribe may be allowed for demos; `realtimeAuthorizationValidated` / `wsThreadScopeValidated` stay **false** and the server exposes that in `session.open` / `subscribe.ack` / ticks.
- **Legacy TOKEN mode** (`VENEXT_COMMERCE_WS_THREAD_AUTH_MODE=TOKEN` + `VENEXT_COMMERCE_WS_SUBSCRIBE_SECRET`): shared-secret gate only; **does not** prove thread membership.

Configure core URL for the gateway: **`VENEXT_CORE_DOMAIN_HTTP_URL`** or **`CORE_DOMAIN_URL`** (default `http://127.0.0.1:3200`).

## Symbolic reservation and heuristics

- Conversational **reservation intents** remain **symbolic** (not WMS / inventory / fulfillment). Downstream analytics should use shared-contract helpers such as `isSymbolicConversationReservationIntent` / `shouldIgnoreSymbolicConversationReservation` where applicable (extend as the product evolves).

## Human validation and limitations

- Draft confirm/reject paths are **human-in-the-loop** metadata flows where flagged; implicit acceptance and heuristics stay **non-contractual**.
- Stale proposals, ambiguity, and contradictory terms require ongoing tightening in the draft engine (flags such as `staleProposalDetected`, `conflictingTermsDetected`, `ambiguousAcceptanceDetected` are part of the target model).

## Audit trail

- Technical audit events (`ConversationalNegotiationAuditEvent` and persistence) are planned extensions; critical actions should record actor, transition, confidence, and source message ids when the storage layer is wired.

## Honest scope

This stack provides **technical enforcement of corridor and identity** plus **transparent diagnostics**. It does **not** replace legal review, ERP master data, or operational fulfillment systems.
