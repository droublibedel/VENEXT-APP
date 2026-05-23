# Instruction 20.84-B — Validation

## Objectif

Verrouillage global anti-erreurs brutes et migration legacy critique (complète 20.84 / 20.84-A).

## Livrables package `commerce-humanized-errors`

| Module | Rôle |
|--------|------|
| `auditGlobalHumanizedErrorsCoverage()` | Audit obligatoire (404, 500, stack, alert brut, etc.) |
| `auditVisibleUiErrorPatterns()` | Détection UI agressive (fond rouge, dumps dev) |
| `commerce-safe-domain-actions.ts` | `safeWalletAction`, `safeMessagingAction`, `safeCatalogAction`, `safeNotificationAction`, `safeEnterpriseGovernanceAction` |
| `VenextGlobalRecoverableFallback.tsx` | Fallback global doux + retry / retour |
| `commerce-error-i18n-critical.ts` | AR / ZH complets sur clés critiques (plus de fallback FR) |

## Apps migrées

- **web-industrial-nextjs** : suppression `alert()` / messages HTTP visibles ; hooks messaging/catalog/AI/wallet humanisés ; `readHumanizedHttpFailure` / `humanizeIndustrialCaught` ; boundaries module (`commerce-messaging`, `wallet`, `poles`)
- **backoffice-web** : `BackofficeHumanizedRoot` + boundary + handlers globaux
- **mobile-grossiste-b**, **mobile-detaillant**, **web-grossiste-a** : déjà protégés (20.84-A) — audit scan sans régression UI

## Audit obligatoire (non opt-in)

- `auditGlobalHumanizedErrorsCoverage()` — scan apps + BFF/core (spec 84b)
- `auditVisibleUiErrorPatterns()` — UI agressive
- Règle ajoutée : `setError(e.message)` / `setNote(e.message)` interdit sans humanisation

## Tests

- `commerce-humanized-errors-84a.spec.tsx` — 142 tests
- `commerce-humanized-errors-84b.spec.tsx` — 44 tests (audit global obligatoire, scan 5 apps, BFF/core guards, boundaries module, `humanizeCaughtError`)
- **Total : 186 tests — exit 0**

## Confirmations

- Aucun texte technique brut imposé à l’utilisateur final sur les surfaces migrées
- Wallet : wording « action non finalisée » (pas fraud/rejected)
- **Aucun commit git**

## Limitations

- Routes serveur `app/api/**` exclues du scan UI (non visibles utilisateur)
- Pages industrielles de démo (`pre` JSON debug) conservées pour opérateurs techniques — hors parcours commerce standard
- Couverture AR/ZH : catalogue complet sur clés critiques ; EN partiel sur clés secondaires (héritage FR)
