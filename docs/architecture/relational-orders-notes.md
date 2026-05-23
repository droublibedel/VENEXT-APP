# Relational orders (Instruction 20.0)

## Relation-only ordering

VENEXT relational orders are **not** open-marketplace or anonymous catalogue checkouts. Each read snapshot is scoped to **validated relationships** and the viewing organization’s **corridor role** (producer downstream, retailer upstream-only, wholesaler incident edges, admin neighbor-only), reusing the **commercial relationship graph bundle (19.1A)** and the same Prisma `Order` / `OrderItem` / `Relationship` rows — **no parallel relational engine**.

## Symbolic fulfillment

Delivery and availability fields are **symbolic projections** of Prisma enums and product rows. The API does **not** claim logistics realtime, carrier truth, or warehouse automation.

## No payment integration

Contract statuses deliberately exclude payment lifecycle states (`PAID`, `PAYMENT_PENDING`, …). Diagnostics expose `paymentNotIntegrated: true` as an explicit honesty flag.

## No public commerce

Snapshots are `relationshipScopedOnly` with `publicMarketplaceDisabled` and `publicDiscoveryDisabled`. There is no global product discovery, multi-vendor cart, or public “buy now” surface in this layer.

## Graph reuse

Graph edges drive corridor relationship ids when the bundle policy is `ACTIVE`; otherwise the service falls back to Prisma `ACCEPTED` relationships with the same geometry, marking `fallbackUsed` and adjusting `sourceOfTruth` / `partnerSource` in diagnostics.

## Role scopes

- **Producer / industrial producer**: downstream orders on corridor edges where they are upstream.
- **Wholesaler**: both supplier-side and client-side orders on **incident** accepted edges (distinct from catalog upstream-only visibility in 19.2).
- **Retailer**: supplier-side orders only.
- **Admin**: same neighbor-only geometry as admin graph viewers — **no** broad global read.

## Instruction 20.0A — grossiste catalogue (19.2B) vs commandes (20.0)

- **Catalogue relationnel 19.2B** : pour un grossiste, la lecture catalogue est surtout **amont fournisseur** (fournisseurs du corridor).
- **Commandes relationnelles 20.0** : le grossiste voit des commandes **amont et aval** sur les arêtes **incidentes** acceptées (bidirectionnel par rapport au simple “catalogue amont”).
- Le contrat expose cette différence dans les diagnostics : `orderScopeMode: INCIDENT_RELATION_ORDERS`, `catalogScopeContrast: CATALOG_READ_IS_UPSTREAM_FOR_WHOLESALER_BUT_ORDER_READ_IS_INCIDENT`, et un `scopeExplanation` court côté API + surfaces web “Portée relationnelle”.

## Order ↔ relationship direction validation

- Les ids de relation autorisés viennent du graphe corridor (19.1A) ou du fallback Prisma `ACCEPTED`.
- Pour chaque lecture, on construit une **map relationshipId → (upstreamOrg, downstreamOrg)** depuis ces arêtes.
- Le filtre Prisma exige que `{ buyerOrganizationId, sellerOrganizationId }` soit **exactement** la paire `{ upstream, downstream }` de la relation (dans un sens ou l’autre). Les commandes dont les extrémités ne coïncident pas avec la géométrie de la relation sont exclues du snapshot.
- Les diagnostics portent `relationshipDirectionValidated: true` et `rejectedByRelationshipDirectionCount` (compte des lignes `Order` encore visibles côté viewer qui violeraient cette règle si on ne filtrait pas explicitement la direction — signal d’intégrité / données incohérentes).

## Types de commande préparés mais non branchés

- Le schéma prévoit `NEGOTIATED_ORDER`, `GROUPED_PROCUREMENT_ORDER`, `RESERVATION_CONVERSION_ORDER`. Le moteur 20.0 n’émet aujourd’hui que **`DIRECT_RELATIONAL_ORDER`**.
- Les diagnostics listent `emittedOrderTypes`, `unavailableOrderTypes`, et `orderTypeReadiness` avec `NOT_CONNECTED_YET` pour les types futurs afin d’éviter toute ambiguïité “contrat annoncé = actif”.

## Signaux réservés ou à analyse plus profonde

- Six types de signaux existent dans le contrat ; seuls un sous-ensemble est émis selon la page et les heuristiques `RelationalOrdersStateService`.
- `ORDER_CONCENTRATION_RISK`, `DEPENDENCY_ORDER_RISK`, `SYMBOLIC_STOCK_WARNING` sont documentés comme **`REQUIRES_DEEPER_ORDER_ITEM_ANALYSIS`** tant qu’il n’y a pas d’analyse fine des lignes.
- Les autres signaux conditionnels peuvent être `EMITTED_HEURISTIC`, `AVAILABLE_CONDITIONAL_HEURISTIC`, ou absents de la page courante (`unavailableSignalTypes`).

## Statut EXPIRED

- La valeur `EXPIRED` existe dans l’énumération relationnelle, mais **aucune source métier d’expiration** n’est branchée sur le mapping Prisma actuel.
- `statusReadiness.EXPIRED` vaut `NOT_CONNECTED_YET_NO_EXPIRY_SOURCE`. Un filtre `status=EXPIRED` positionne `requestedStatusUnsupported: true` sur le snapshot pour signaler explicitement que le filtre n’est pas honnête sans source d’expiration.

## Lignes de commande et catalogue 19.2B

- Les `orderLines` proviennent des **`OrderItem` + `Product`** historiques ; elles ne repassent pas par un moteur de **revalidation** de visibilité catalogue 19.2B ligne à ligne.
- Diagnostics : `catalogVisibilityRevalidated: false`, `orderLinesUseHistoricalOrderItems: true`, `catalogPolicySource: ORDER_ITEM_PRODUCT_REFERENCE`.

## Pagination UI minimale

- L’API supporte `orderCursor`, `status`, `relationshipId`. Le pôle web affiche `nextOrderCursor`, `ordersTruncated`, les filtres appliqués, un bandeau si le status demandé n’est pas supporté, et un bouton **“Charger page suivante”** lorsque `nextOrderCursor` est présent et la politique est `ACTIVE`.

## Heuristic signals

`RelationalOrderSignal` entries are `advisoryOnly`, `heuristicOnly`, and `symbolicExecution` — consultative supply-chain readouts, not optimization or demand-forecasting claims.

## Pagination strategy

Keyset pagination on **`createdAt` descending, `id` descending** with opaque cursor `createdAtISO + "__" + orderId`. Optional **`status`** query filters via a Prisma `OR` of `(OrderStatus, DeliveryStatus)` tuples that map to the requested relational label under the same rules as the snapshot mapper (keeps keyset semantics consistent).

## Future logistics / payment separation

Negotiation, reservation conversion, grouped procurement, wallet PSP, and realtime logistics bridges remain **out of scope** for 20.0. This module is the **read contract + access + diagnostics + advisory signals + realtime classification** foundation; payment and execution stacks should attach behind explicit future flags without widening public discovery.
