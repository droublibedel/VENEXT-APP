# Instruction 20.83-A — Validation

## Objectif

Branchement complet de `commerce-access-control` sur catalogues, commandes, wallet, messaging, BFF et core.

## Livrables

| Surface | Statut | Détail |
|---------|--------|--------|
| Catalogues relationnels | OK | `relational-catalog-access-bridge.ts`, gouvernance `canViewCatalog` + flags |
| Commandes | OK | `relational-order-access-bridge.ts`, `canAccessRelationalOrder`, gardes core/BFF |
| Wallet | OK | `commerce-wallet-access-bridge.ts`, `resolveWalletGovernance` + pont accès |
| Messaging | OK | `commerce-messaging-access-bridge.ts`, `resolveConversationGovernance` + pont |
| BFF | OK | `commerce-access-middleware`, `commerce-access-endpoint-guard`, routes protégées |
| Core | OK | `CommerceAccessGuardService`, controller foundation |
| Offline | OK | `guardOfflineReplay`, route `/api/offline/bootstrap` gardée |
| Erreurs UX | OK | `commerce-access-control-errors.ts` uniquement |
| Feature flags | OK | seed Prisma + hooks apps (20.83 base) |
| Tests | OK | ≥70 cas (83a + bridges + BFF + core) |

## Philosophie respectée

- Relationship-first, pas de catalogue global
- Wallet propriétaire uniquement
- Terrain vs formel (messaging / mail)
- Pas de RBAC enterprise, pas d’IAM bancaire

## Limitations restantes

- Les enveloppes actor (`grossiste-b`, etc.) sans `relationshipId` en query restent bloquées côté BFF pour `catalog` — comportement voulu.
- Le core foundation utilise des gardes simplifiées sur certaines routes demo (pas de chargement relation depuis DB sur chaque GET).
- Les apps mobiles doivent transmettre `relationshipId` / `x-organization-id` pour un contrôle optimal.

## Git

**Aucun commit** (instruction explicite).
