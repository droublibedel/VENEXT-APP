# Instruction 20.84-A — Validation

## Livrable

Package `packages/commerce-humanized-errors/` :

- Catalogue FR + i18n EN/AR/ZH (partiel étendu sur clés critiques)
- Mappers techniques → clés métier
- `humanizeCommerceError`, sanitization visible, safe runtime
- UI : `VenextHumanizedErrorCard`, `VenextInlineError`, `VenextRecoverableErrorState`
- Boundaries : Global / Mobile / Industrial
- Logger interne `logInternalCommerceError`
- Audit `auditHumanizedErrorsCoverage`
- Handlers globaux `installCommerceHumanizedGlobalHandlers`

## Intégration

- Apps : boundaries `main.tsx` / `layout.tsx`, bridges par surface, flag `commerce_humanized_errors_enabled` (DEV true, PROD false)
- BFF : `toHumanizedBffUserMessage` sur réponses 403 access middleware
- Seed Prisma : flag activé

## Tests

`commerce-humanized-errors-84a.spec.ts` — couverture 404/500/network/timeout/runtime/wallet/OTP/offline/i18n/safe runtime/boundary/audit (80+ cas).

## Build matrix (à exécuter localement)

```bash
pnpm db:generate
pnpm --filter commerce-humanized-errors build
# … autres filtres instruction §20
pnpm vitest run
```

## Confirmations UX

- Aucune stack trace, code HTTP, JSON brut ou ligne de code affichés à l’utilisateur final
- Messages calmes, FR par défaut, actions de reprise (réessayer, retour, etc.)
- Détails techniques uniquement dans le journal interne (console dev)

## Limitations restantes

- Couverture i18n complète AR/ZH : clés secondaires retombent sur FR
- L’audit statique `auditHumanizedErrorsCoverage` nécessite des sources passées en paramètre (pas de scan repo automatique)
- Écrans legacy hors commerce peuvent encore afficher du texte brut tant qu’ils n’utilisent pas `humanizeCommerceError` / `VenextInlineError`

## Git

**Aucun commit** demandé pour cette instruction.
