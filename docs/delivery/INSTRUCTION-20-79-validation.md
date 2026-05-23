# Instruction 20.79 — Persistance backend/BFF fondations métier

## Statut

Persistance démo réelle mise en place (PostgreSQL + Prisma JSON documents + core-domain + commerce-bff). Mocks conservés comme fallback.

**Aucun commit git** (demande explicite).

## Architecture

| Couche | Rôle |
|--------|------|
| `prisma/schema.prisma` → `CommerceFoundationRecord` | Stockage JSON par entité métier |
| `packages/shared-contracts` → `commerce-foundation/` | Contrats Zod stables |
| `services/core-domain-service` → `commerce-foundation-persistence` | Repository, service, API `/v1/commerce-foundation/*` |
| `services/commerce-bff` (port 3210) | Proxy `/api/*` + fallback local |
| Apps mobile | Hooks live/fallback + proxy Vite → BFF |

## Modèles persistés

ActorProfile, CommercialRelationship, RelationalCatalog, CommercialOrder, CommercialDelivery, CommercialSettlement, CommerceMessageThread, ProfessionalMailThread, CommercialContextState, FeatureFlagState, WalletDemoState.

## Routes BFF

- Terrain : `/api/grossiste-b/:endpoint`, `/api/detaillant/:endpoint`, `/api/commerce-wallet/:endpoint`
- Fondations : `/api/actors/me`, `/api/relationships`, `/api/commercial-orders`, `/api/commercial-context`, `/api/feature-flags`, catalogues, livraisons, règlements, messaging, mail pro

## Feature flags (DEV true / PROD false via hooks)

- `venext_backend_persistence_enabled`
- `venext_bff_routes_enabled`
- `venext_live_data_fallback_enabled`

Synchronisés : `prisma/seed.ts`, hooks Grossiste B / Détaillant / Grossiste A / Industrial.

## Seed démo

`buildCommerceFoundationDemoSeed()` — histoire AgroNexus → Grossiste A/B → Détaillants Yopougon/Aminata, relations formelles/terrain, commande, livraison, règlement démo, messagerie, mail pro.

Activation : `POST /v1/commerce-foundation/seed-demo` ou BFF `POST /api/commerce-foundation/seed-demo`.

## Limitations volontaires

- Pas de banque / mobile money / SMS / KYC externe réels
- Pas de marketplace globale ni recherche produits publique
- Pas de websocket ni polling
- Gouvernance packages non dupliquée — orchestration légère dans le service

## Confirmation contraintes

- Persistance backend réelle : oui (démo)
- Mocks fallback : oui
- Catalogues relationnels protégés : `assertCatalogAccess` / `relationship_only`
- Pas d’intégration bancaire réelle : oui (`walletDemoMode`)
