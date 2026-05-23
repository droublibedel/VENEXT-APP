# Instruction 20.82 — Offline léger, cache terrain & sync commerce-first

## Livrable

Fondation offline **légère** pour continuer le commerce sur réseau faible — sans moteur enterprise ni sync temps réel.

**Aucun commit git.**

## Package `packages/commerce-offline-foundation/`

| Module | Rôle |
|--------|------|
| `commerce-offline.types.ts` | Types connectivité, cache, queue, sync, conflits |
| `commerce-offline-storage.ts` | Namespaces localStorage |
| `commerce-offline-cache.ts` | Cache TTL par domaine |
| `commerce-offline-queue.ts` | `enqueueOfflineAction`, `replayOfflineQueue`, `discardOfflineAction` |
| `commerce-offline-connectivity.ts` | `useCommerceConnectivity`, `resolveConnectivityMode` |
| `commerce-offline-sync.ts` | `syncCommercialData`, `syncPendingActions`, `resolveSyncState` |
| `commerce-offline-conflict.ts` | `resolveCommercialConflict`, `buildConflictLabel` |
| `commerce-offline-governance.ts` | CRG + blocage wallet financier offline |
| `useCommerceOffline.ts` | Hook refresh / sync manuel |
| `commerce-offline.spec.ts` | **52 tests** |
| UI | Banner, SyncStatus, Queue, Empty, Shell |

## Cache autorisé (TTL)

| Domaine | TTL |
|---------|-----|
| Activité / commandes / livraisons / catalogue | 30 j |
| Notifications | 14 j |
| Messages récents | 7 j |

Namespaces : `venext_offline_cache_v1`, `venext_offline_queue_v1`, `venext_sync_state_v1`.

## Queue offline (pas de finance réel)

`SEND_MESSAGE`, `CONFIRM_ORDER`, `CONFIRM_DELIVERY`, `MARK_NOTIFICATION_READ`, `ACTIVATE_RELATION`, `WALLET_LIGHT_ACTION` (non financier uniquement).

## Connectivité

`ONLINE` | `DEGRADED` | `OFFLINE` — détection navigateur + probe `/api/health` (timeout 8s). **Pas de polling agressif** (`COMMERCE_OFFLINE_SYNC_POLLING_MS = 0`).

## Backend / BFF

- `GET /api/offline/bootstrap`
- `POST /api/offline/sync`
- `POST /api/offline/replay`
- Core : `CommerceOfflinePersistenceService` + entité `CommerceOfflineSnapshot`

## Feature flags

`commerce_offline_foundation_enabled`, `commerce_offline_sync_enabled`, `commerce_offline_queue_enabled` — DEV true / PROD false.

## Apps

Bridges : Grossiste B, Détaillant, Grossiste A, Producteur (shells).

## Limitations

- Pas d’IndexedDB massif (localStorage léger pour V1).
- Bootstrap core agrège notifications + activité ; commandes/livraisons vides jusqu’à enrichissement seed.
- Sync uniquement au refresh / retour ONLINE utilisateur.

## Confirmation VENEXT

- Offline léger, mobile-first, terrain-first
- Pas d’ERP offline, pas de websocket, pas de sync temps réel
- Wallet : lecture cache OK, **paiement/règlement réel interdit** hors ligne
- Gouvernance relationnelle respectée
- Backend = source of truth sur conflits
