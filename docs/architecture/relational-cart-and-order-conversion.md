# Relational cart and controlled order conversion (Instruction 20.5)

## What this is

The **relational cart** is a private, corridor-scoped preparation surface. It converts accepted negotiations, human-confirmed conversational drafts, and (when policy allows) sponsored principle alignments into a **reviewable line structure** before any relational order exists.

This is **not** a public marketplace cart, **not** a checkout, and **not** an open e-commerce flow.

## How it differs from a classic e-commerce cart

| E-commerce cart | VENEXT relational cart |
| --- | --- |
| Often public or catalog-wide | Private to buyer/seller orgs on an **accepted** relationship |
| Add-to-cart from open catalog | Lines validated against **relational visibility** and seller ownership |
| Checkout + payment | **No** payment execution, **no** PSP, **no** wallet debit in this layer |
| Stock reservation | **Symbolic** stock signals only; **no** physical reservation |

## Why there is no public checkout here

Checkout implies a standardized, often anonymous, payment capture path. VENEXT intentionally separates **corridor validation**, **relational preparation**, and any future payment execution so that nothing in this instruction can be mistaken for consumer checkout.

## Corridor governance

Every cart creation calls `RelationshipGovernancePolicyService.assertCorridorOperational(relationshipId, "cart_conversion")`.

Order conversion uses `"order_creation"` on the same relationship. `RESTRICTED` blocks commerce by default; a documented backoffice-only flag can allow `cart_conversion` when explicitly justified.

## Negotiation and conversational draft

- **Accepted negotiation (hard accept)** upserts a cart in `READY_FOR_REVIEW` with `NEGOTIATION_ACCEPTED` and `requiresBuyerSellerConfirmation` where applicable.
- **Human-confirmed conversational draft (20.1B)** upserts a cart with `CONVERSATIONAL_DRAFT_CONFIRMED`, linking `threadId`, `negotiationId`, and `sourceMessageId`, preserving extracted terms as metadata only.

## Sponsored principle agreement (20.2B)

Without an **ACCEPTED** relationship, there is **no** convertible cart and **no** `prisma.order.create` path. Diagnostics remain on the negotiation metadata; `createCartFromSponsoredPrincipleAgreement` returns `RELATIONSHIP_REQUIRED`.

## Controlled order conversion

`RelationalCartConversionService.convertCartToOrder` is the **only** `prisma.order.create` entry point for this relational materialization path. Preconditions include buyer/seller alignment, non-empty validated lines, corridor operational for `order_creation`, and cart status `LOCKED_FOR_ORDER` or `CONFIRMED_BY_BOTH_PARTIES`.

## Limits (explicit)

- No payment execution, no invoice finalization, no wallet debit.
- No physical stock reservation; symbolic stock only.
- Realtime payloads are minimal (no line prices, no raw messages, no PSP data).

---

## Instruction 20.5A — hardening (production readiness)

### Database

- Versioned SQL migration: `prisma/migrations/20260521130000_instruction_20_5_relational_cart/migration.sql` creates `relational_carts`, `relational_cart_items`, and related enums and FKs (depends on `CommercialCorridorState` from Instruction 20.4).

### Line validation before order materialization

- `convertCartToOrder` rejects non-convertible line statuses with `relational_cart_line_requires_review`, including `CATALOG_VISIBILITY_REQUIRES_REVIEW`, `QUANTITY_REQUIRES_REVIEW`, `PRODUCT_UNAVAILABLE`, and `REJECTED`.
- Only `VALIDATED` and `SYMBOLIC_STOCK_ONLY` lines may convert; symbolic lines add diagnostics (`stockNotReserved`, `symbolicStockOnly`).

### Backoffice RESTRICTED override

- `allowRestrictedCommerceForBackoffice` is **never** taken from participant request bodies.
- `resolveBackofficeCartOverride(actor, request)` grants the flag only when:
  - `x-venext-internal-key` matches `VENEXT_INTERNAL_REALTIME_KEY`, or
  - the actor is backoffice-trusted (`BACKOFFICE_ADMIN` role or valid `x-venext-backoffice-token`) **and** header `x-venext-restricted-commerce-override: granted` is present.
- Diagnostics: `backofficeOverrideRequested`, `backofficeOverrideGranted`, `backofficeOverrideSource`.

### Conversational draft → cart (`from-draft`)

- HTTP clients must **omit** `relationshipId`; if present, the API responds with `client_relationship_id_not_allowed`.
- The server resolves the `ACCEPTED` relationship from the thread’s buyer/seller org pair (and validates `negotiationId` against `thread.negotiationId` when set). Mismatch → `thread_relationship_mismatch`.

### Order ↔ cart link and idempotence

- `Order` is created with `convertedFromRelationalCart: { connect: { id: cart.id } }` so the Prisma inverse `Order.convertedFromRelationalCart` resolves.
- `relational_carts.convertedOrderId` is set in the same transaction via conditional `updateMany` (`convertedOrderId` null + allowed status). Lost races delete the orphan `Order` and return an idempotent replay payload when another conversion won.
- Optional `conversionAttemptId` may be stored in cart metadata for tracing.

### Source types not yet wired

- `RELATIONAL_REORDER` remains `NOT_CONNECTED_YET` in API diagnostics `sourceTypeReadiness` until explicitly implemented.
- `MANUAL_RELATIONAL_ENTRY` is **CONNECTED** for Instruction 20.6 (direct catalog → relational cart). Negotiated paths remain unchanged.

### Frontend (web-industrial)

- `fetchRelationalCart` + `useRelationalCart` load `/api/core/v1/relational-cart/:cartId` with Zod `safeParse`. Without `cartId`, surfaces show **“Aucun panier relationnel sélectionné.”** No fabricated line data.
- The relational catalog pole exposes **“Ajouter au panier relationnel”** when `relational_cart_direct_catalog_enabled` is on, the product row resolves `cartEligibleRelationshipId`, and the viewer is the buyer (viewer org ≠ product source org). This is not a public checkout.

### Realtime internal ingest (api-gateway)

- Internal controller requires `eventType` in an explicit allow-list of `relational.cart.*` events; unknown subtypes return `relational_cart_realtime_unknown_event`.
- Non-`relational.cart.*` domains are rejected. Payloads must satisfy strict `RelationalCartRealtimeSchema` (rejects e.g. wallet/payment-shaped keys).
- `relational.cart.catalog_item_added` is allow-listed for Instruction 20.6 (minimal payload, no prices).

### Breaking API migration — negotiation `convert-to-cart` vs relational cart

**Legacy (removed / misleading):** some flows implied negotiation `convert-to-cart` directly returning a durable `orderId`.

**Current flow:**

1. Negotiation **accepted** (or conversational draft confirmed) → **RelationalCart** materialization (`from-negotiation` / `from-draft`).
2. Partner **review / confirm / lock** on the relational cart.
3. `POST relational-cart/:cartId/convert-to-order` → `orderId` in the conversion response.

**API diagnostics (contract):**

- `legacyOrderIdReturned: false`
- `requiresCartConversionStep: true`

## Instruction 20.6 — direct relational ordering from catalog

### Two ordering paths (corridor-only)

1. **Direct (this instruction):** authorized user sees a product in an **authorized relational catalog** snapshot → chooses quantity → `POST /v1/relational-cart/from-catalog` → **same** relational cart lifecycle as negotiated materialization (review / lock / `convert-to-order`). No negotiation thread is required.
2. **Negotiated:** discussion / negotiation / draft → relational cart → validation → order. Unchanged.

### What this is not

- **Relational catalog is not a public marketplace.** There is no global catalog discovery, no public ranking, and no anonymous checkout.
- **“Ajouter au panier relationnel” is not “buy now”, “checkout”, or “pay”.** No payment execution, no wallet debit, and no PSP capture happen in this layer.
- **No physical stock reservation:** symbolic stock signals only; `stockReservationDisabled` stays true in diagnostics and realtime.

### API and validation

- **Route:** `POST /v1/relational-cart/from-catalog` (proxied by web as `/api/core/v1/relational-cart/from-catalog`).
- **Relationship:** must be `ACCEPTED`; buyer/seller orgs must match the relationship corridor; governance uses `RelationshipGovernancePolicyService.assertCorridorOperational(relationshipId, "cart_conversion")` (same hook family as other cart materializations, with dormant handling aligned to 20.4B via env / policy options where applicable).
- **Product policy:** `RelationalCartPolicyService.validateLineForDirectCatalog` is **stricter** than negotiated `validateLineForCart`: visibility must be **relationship-scoped or buyer-org visibility** on the live product — no “prior order line only” shortcut. Invisible products → `catalog_product_not_visible_for_relationship`.
- **Quantity:** positive finite quantity, unit must match `Product.unitLabel`; optional MOQ / pack checks use product-level hooks when configured (test env uses `VENEXT_DIRECT_CATALOG_TEST_MOQ` / `VENEXT_DIRECT_CATALOG_TEST_PACK_SIZE`); otherwise a diagnostic warning `quantityBusinessRuleNotConfigured` may appear without blocking.
- **Cart merge:** lines merge when an existing `MANUAL_RELATIONAL_ENTRY` cart is in **`DRAFT` or `READY_FOR_REVIEW`** for the same buyer, seller, and relationship; same `productId`, `catalogId`, and `unit` merge quantities with `directCatalogQuantityHistory` metadata. Carts in post-confirmation or terminal states do not receive silent new lines from this path.

### Feature flags

- `relational_cart_direct_catalog_enabled` — gates the HTTP route and UI affordance (403 / hidden when off).
- `relational_cart_direct_catalog_realtime_enabled` — gates fan-out of `relational.cart.catalog_item_added` only.

### Realtime

- **Event:** `relational.cart.catalog_item_added`
- **Payload:** minimal corridor-safe fields (`cartId`, `relationshipId`, optional `productId`, `status`, `sourceType`, `changedFields`, governance flags, `paymentExecutionDisabled: true`, `computedAt`). No line prices, wallet fields, or message bodies.

### 20.6A — Relational cart workspace activation

- **Post-add navigation:** after a successful direct-catalog add, the UI deep-links to `/poles/relational-cart?cartId=<uuid>` (not the catalog pole). Copy is preparation / partner review only — no public checkout, no payment, no marketplace cart framing.
- **Pole:** `relational-cart` is a first-class industrial pole (`PoleSlug`, registry, `PoleEntryClient`, intel manifest). Workspace reads `cartId` from the query string; without it, the user sees “Aucun panier relationnel sélectionné.” When `relational_cart_enabled` is off, the pole shows a clean disabled message instead of breaking navigation.
- **Data:** the client fetches `GET /v1/relational-cart/:cartId` (via web BFF), validates the envelope with Zod (`safeParse`), and binds real cart + diagnostics into overview, items, governance, conversion, and realtime strip surfaces — no simulated cart payloads.
- **Separation:** catalog pole = discovery and corridor-safe add; relational-cart pole = private relational basket, governance review, and controlled conversion preparation; order conversion remains a distinct controlled path (no PSP, no wallet debit, no stock reservation in this layer).

### 20.7 — Review & dual confirmation workflow

- **Not checkout:** buyer/seller confirmations are corridor preparation only — not payment, not a definitive public order until `convert-to-order` runs under strict domain rules.
- **States:** `CONFIRMED_BY_BUYER`, `CONFIRMED_BY_SELLER`, `CONFIRMED_BY_BOTH_PARTIES` track separate confirmations; timestamps and actor user ids are first-class columns (`buyerConfirmedAt`, `sellerConfirmedAt`, …), queryable — not metadata-only.
- **Lock:** `POST …/lock` requires `CONFIRMED_BY_BOTH_PARTIES`, both timestamps, non-empty cart, convertible lines, `relationship` **ACCEPTED**, operational corridor (`cart_conversion` governance), and cart metadata flags `paymentExecutionDisabled` / `stockReservationDisabled` true. Result: `LOCKED_FOR_ORDER` with `lockedAt`, `lockedByUserId`, `lockDiagnostics` JSON.
- **Conversion:** `POST …/convert-to-order` accepts **only** `LOCKED_FOR_ORDER` (attempts from `CONFIRMED_BY_BOTH_PARTIES` alone return `relational_cart_not_locked_for_order`). Idempotent replay when `convertedOrderId` already set.
- **Content change reset:** merging or replacing lines (direct catalog merge, negotiation refresh, conversational draft refresh) on a cart that had confirmations clears buyer/seller confirmation fields, sets `READY_FOR_REVIEW`, sets diagnostics `confirmationsResetBecauseCartChanged`, and emits `relational.cart.confirmations_reset` (plus metadata `confirmationResetReason: CART_CONTENT_CHANGED`).
- **Flags:** `relational_cart_review_enabled`, `relational_cart_dual_confirmation_enabled`, `relational_cart_lock_enabled` — when off, matching routes return 403 / policy disabled; read-only cart fetch remains available; UI hides or disables the corresponding actions.
- **Realtime (minimal):** `relational.cart.reviewed`, `relational.cart.buyer_confirmed`, `relational.cart.seller_confirmed`, `relational.cart.both_parties_confirmed`, `relational.cart.locked_for_order`, `relational.cart.confirmations_reset` (plus legacy `relational.cart.locked` mirror on lock), with optional boolean hints `buyerConfirmed`, `sellerConfirmed`, `bothPartiesConfirmed`, `lockEligible`, `conversionEligible` — no prices, wallet, PSP, or message bodies.

