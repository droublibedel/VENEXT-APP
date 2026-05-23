# Instruction 20.78-B — validation livrable

Sécurité wallet terrain ultra stricte (complément 20.78-A).

**Aucun commit git.**

## Changements principaux

| Sujet | Avant (20.78-A) | Après (20.78-B) |
| --- | --- | --- |
| Inactivité terrain sécurisé | 20 minutes | **20 secondes** (`SECURED_WALLET_IDLE_TIMEOUT_MS = 20000`) |
| Arrière-plan / sortie app | Lock sur `visibilitychange` | **Lock immédiat** (`lockSecuredWalletSessionImmediately`) |
| Producteur / Grossiste A | 20 min | **Inchangé** (`SECURED_WALLET_INACTIVITY_TIMEOUT_MS`) |
| Mode léger (&lt; 1000 FCFA) | Illimité | **Inchangé** |

## Constantes

- `SECURED_WALLET_IDLE_TIMEOUT_MS` — terrain, session wallet sécurisée
- `SECURED_WALLET_INACTIVITY_TIMEOUT_MS` — formel uniquement

## Nouveaux modules

| Fichier | Rôle |
| --- | --- |
| `useSecuredWalletTerrainLifecycle.ts` | Timer 20 s + lock blur/visibility/pagehide |
| `venext-wallet-security-reentry.ts` | `resolveWalletReentryMethod()` → `BIOMETRIC` \| `PIN_ONLY` |
| `venext-wallet-security-ux.ts` | Labels « Session sécurisée », sanitization guardrails |
| `WalletAdaptiveSecurityShell.tsx` | Inchangé structurellement ; lifecycle via provider |

## Flags

- `wallet_instant_background_lock_enabled` (DEV true / PROD false)
- `wallet_ultra_short_timeout_enabled` (DEV true / PROD false)

Synchronisés : `prisma/seed.ts`, hooks Grossiste B, Détaillant, Grossiste A, Industrial.

## Tests ajoutés

`venext-wallet-security-strict.spec.ts` — **13** tests 20.78-B (minimum 10 requis).

Total `venext-auth-foundation` : **107+** tests.

## Build matrix

```bash
pnpm db:generate
pnpm --filter venext-auth-foundation build && pnpm --filter venext-auth-foundation test
pnpm --filter commerce-wallet build && pnpm --filter commerce-wallet test
cd apps/mobile-grossiste-b && npm run build && npm test
cd apps/mobile-detaillant && npm run build && npm test
```

## Limitations

- Biométrie web simulée (user-agent) ; pas WebAuthn natif
- Lifecycle `pagehide` / `blur` couvre PWA et navigateur mobile ; pas de bridge React Native `AppState` dédié dans ce repo
- En PROD, flags à `false` rétablissent timeout 20 min et désactivent le lock instantané arrière-plan

## Confirmations

- Timeout terrain sécurisé = 20 s exactes (flag DEV)
- Lock immédiat à la sortie / arrière-plan (flag DEV)
- Retour app → PIN ou biométrie selon `resolveWalletReentryMethod`
- Mode commerce léger et acteurs formels non dégradés
- Aucun commit git
