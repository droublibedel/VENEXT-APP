# Instruction 20.83 — Permissions globales commerce-first

## Livrable

Contrôle d'accès **relationship-first** centralisé — sans IAM enterprise ni RBAC visible.

**Aucun commit git.**

## Package `packages/commerce-access-control/`

| Fichier | Rôle |
|---------|------|
| `commerce-access-control.types.ts` | Contexte, permissions, ressources |
| `commerce-access-control-governance.ts` | CRG, formal/terrain, flags |
| `commerce-access-control-visibility.ts` | Visibilité par ressource, anti-bypass URL |
| `commerce-access-control-permissions.ts` | 16 permissions `can*` |
| `commerce-access-control-guards.ts` | `guardCommerceResource`, `guardBackendRoute` |
| `commerce-access-control-errors.ts` | Messages UX humains |
| `commerce-access-control-context.ts` | `buildAccessContext` |
| `useCommerceAccessControl.ts` | Hook React |
| `commerce-access-integration.ts` | Ponts packages VENEXT |
| `commerce-access-control.spec.ts` | **55 tests** |

## Permissions centralisées

`canViewRelationalCatalog`, `canCreateOrder`, `canViewOrder`, `canUpdateOrderStatus`, `canViewDelivery`, `canConfirmDelivery`, `canViewSettlement`, `canConfirmSettlement`, `canUseWallet`, `canUseTerrainMessaging`, `canUseFormalMail`, `canViewNotifications`, `canViewActivityFeed`, `canUseOfflineCache`, `canViewPartnerProfile`, `canAutoAcceptRelationship`.

## Erreurs UX (pas de jargon technique)

Catalogue non disponible · Relation non active · Commande non accessible · Règlement non autorisé · Action indisponible hors connexion · Accès réservé à ce partenaire.

## Intégration

- `commercial-activity-feed` — gouvernance + access
- `commerce-offline-foundation` — cache sécurisé
- `commerce-notifications` — filtre notifications
- BFF — `commerce-access-middleware.ts` sur notifications, activity-feed, offline
- Core — `CommerceAccessGuardService` sur routes foundation

## Feature flags

`commerce_access_control_enabled`, `commerce_visibility_guard_enabled`, `commerce_backend_access_guard_enabled` — DEV true / PROD false.

## Confirmation VENEXT

- Pas de catalogue global
- Pas de bypass URL (garde `organizationId`)
- Relationship-first
- Terrain vs formel (messaging / mail)
- Wallet propriétaire uniquement, offline financier bloqué
- Offline cache filtré par gouvernance
