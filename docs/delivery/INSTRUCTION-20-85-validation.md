# Instruction 20.85 — Optimisation performance finale & stabilité V1

## Livrable

Passe performance/stabilité via **`commerce-performance-foundation`** + intégrations ciblées (sans nouvelle architecture, sans websocket, sans polling).

## Package `commerce-performance-foundation`

- **Virtualisation légère** : `paginateLight`, `sliceVisibleWindow`, `batchSlice`
- **Cleanup** : `cleanupOfflineCache`, `cleanupNotificationCache`, `cleanupContextHistory`, `runCommerceStorageCleanup`
- **Réseau** : `assertManualRefreshOnly`, `assertNoWebsocketInStack`, `dedupeFetch`
- **Payload** : `trimPayload`, `lightweightEnvelope`
- **Feature flags** : `auditFeatureFlagConsistency`, `isCommercePerformanceEnabled`
- **i18n** : cache domaines chargés (`markDomainLoaded`, `memoTranslationKey`)
- **Images** : `lazyImageProps`, `catalogThumbnailSize`
- **React** : `shallowEqualProps`, `stableListKey`
- **Tests** : `commerce-performance.spec.ts` (65+ cas)

## Intégrations

| Zone | Changement |
|------|------------|
| `commerce-notifications` | `CommerceNotificationList` memo + fenêtre 40 ; cache trim à l'écriture ; `cleanupNotificationCache` |
| `commercial-activity-feed` | `useCommercialActivityFeed` slice 50 items ; cache trim |
| `commercial-context-routing` | `trimCommercialContextHistory` |
| `commerce-bff` | `lightweight-response.ts` ; listes activity/notifications trim 50/40 |
| Apps ×4 | `*PerformanceBridge` — cleanup storage au mount |

## Feature flag

- `commerce_performance_foundation_enabled` (seed + hooks, défaut `true` en dev)

## Confirmations

- Pas de websocket / polling agressif (`POLLING_MS = 0` conservé)
- Fallbacks conservés
- Pas de nouveau module métier
- **Aucun commit git**

## Build matrix

```bash
pnpm db:generate
pnpm --filter commerce-foundation-guardrails build
pnpm --filter commerce-notifications build
pnpm --filter commercial-activity-feed build
pnpm --filter commerce-offline-foundation build
pnpm --filter commerce-access-control build
pnpm --filter commercial-context-routing build
pnpm --filter venext-i18n build
pnpm --filter venext-auth-foundation build
pnpm --filter commerce-performance-foundation build
pnpm --filter core-domain-service build
pnpm --filter commerce-bff build
# apps: npm install && npm run build (×4)
```

## Limitations restantes

- Virtualisation fenêtre simple (pas react-window) — suffisant V1 low-end
- Catalogues / messaging : caps cache ; rendu liste messaging non virtualisé partout
- Profiling 60fps réel sur device non automatisé en CI
