# Instruction 20.86-E1 — Stabilisation déterministe guard « messaging suspended »

## Livrable

- **Guard prioritaire** : `evaluateMessagingGuardPriority()` dans `packages/commerce-access-control/src/messaging-access-priority.ts`
- **Ordre verrouillé** : suspension participant → révocation runtime (offline/routing) → relation inactive → permissions/visibilité (via guards existants)
- **Contexte immutable** : `buildSafeMessagingAccessContext()`, `freezeMessagingAccessContext()`
- **Cleanup tests** : `resetCommerceAccessTestState()` + `beforeEach`/`afterEach` dans les specs concernées
- **Invalidation runtime** : `invalidateMessagingAccessRuntime()`
- **Log interne** : `MESSAGING_ACCESS_BLOCKED_SUSPENDED` via `logMessagingAccessBlockedSuspended()`
- **Message UX** : « Cet accès n’est pas disponible actuellement. Veuillez contacter le service compétent si nécessaire. »
- **Core** : `messaging-access-guard.ts` + délégation depuis `CommerceAccessGuardService`
- **BFF** : `participantStatus` depuis query/header + blocage avant bypass flags
- **Suites** : `messaging-suspended-deterministic.spec.ts` (commerce-access-control + core-domain-service)
- **Aucun commit git**

## Cause racine corrigée

`guardMessagingAction()` et `guardBackendRoute()` autorisaient le passage lorsque les flags désactivaient le contrôle **avant** la vérification `SUSPENDED`, provoquant des intermittences selon l’ordre/état des tests.

## Confirmation cible

| Critère | Statut |
|--------|--------|
| SUSPENDED toujours bloqué | Oui (même flags off) |
| Zéro bypass suspension | Oui |
| Zéro dépendance timing/ordre | Isolation `resetCommerceAccessTestState` |
| Message humanisé | Oui |
| Backend/BFF | Oui |

## Build matrix (§16)

```bash
pnpm db:generate
pnpm --filter commerce-access-control build
pnpm --filter enterprise-commercial-governance build
pnpm --filter commerce-messaging build
pnpm --filter core-domain-service build
pnpm --filter commerce-bff build
pnpm vitest run commerce-access-guard.spec.ts
pnpm vitest run messaging-suspended-deterministic.spec.ts
pnpm vitest run
```

## Limitations restantes

- L’état runtime `invalidateMessagingAccessRuntime()` est un singleton module (réinitialisé en tests via `resetCommerceAccessTestState`). En production, l’invalidation doit être déclenchée par les couches gouvernance/offline lors des événements métier correspondants.
- Le statut participant BFF dépend des en-têtes/query `x-participant-status` / `participantStatus` ; le core-domain doit recevoir le statut depuis la couche persistance/gouvernance en amont.
