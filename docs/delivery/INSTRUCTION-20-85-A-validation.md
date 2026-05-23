# Instruction 20.85-A — Validation

## Objectif

Corrections finales performance terrain, cleanup session et verrouillage wallet sécurisé réel.

## Livrables

| Domaine | Statut |
|---------|--------|
| Virtualisation messaging (40 max, lazy append) | OK |
| Virtualisation catalogues (30 max, append progressif) | OK |
| `runFullCommerceSessionCleanup` | OK |
| `invalidateRuntimeCommerceState` | OK |
| `secureWalletNavigationReset` + blocage retour | OK |
| Wallet lock démonte écrans sensibles | OK |
| Offline replay invalidé après suspension | OK |
| Feature flags seed + hooks | OK |
| Tests ≥ 55 | OK (`commerce-performance-85a.spec.ts` + spec existant) |

## Feature flags

- `commerce_secure_cleanup_enabled` — DEV true / PROD false (hooks apps)
- `commerce_light_virtualization_enabled` — DEV true / PROD false
- `commerce_secure_wallet_navigation_enabled` — DEV true / PROD false

## Fichiers clés

- `packages/commerce-performance-foundation/src/commerce-performance-messaging-window.ts`
- `packages/commerce-performance-foundation/src/commerce-performance-catalog-window.ts`
- `packages/commerce-performance-foundation/src/commerce-performance-cleanup.ts`
- `packages/commerce-performance-foundation/src/commerce-performance-wallet-navigation.ts`
- `packages/commerce-messaging/src/messages/CommerceMessageThread.tsx`
- `packages/relational-commerce-catalog/src/RelationalCatalogSection.tsx`
- `packages/venext-auth-foundation/src/WalletAdaptiveSecurityShell.tsx`

## Limitations

- Virtualisation sans react-window : fenêtre + bouton « charger plus » (pas de scroll virtuel natif).
- Blocage retour Android via `popstate` + sessionStorage (apps web/mobile hybrides).
- Cleanup déclenché par événements DOM (`venext:commerce-session-cleanup`, `venext:wallet-secured-lock`).

## Git

**Aucun commit** (instruction explicite).
