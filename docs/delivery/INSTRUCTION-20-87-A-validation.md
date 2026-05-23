# Instruction 20.87-A — Validation

## Résumé

Finalisation UX/UI premium : loaders texte supprimés des Suspense/fallbacks apps, auth enterprise enrichie, audits fatigue/polish, façades design system, **140 tests** dédiés 87-A.

**Aucun commit git.**

## Package `commerce-ux-harmony`

| Ajout | Rôle |
|-------|------|
| `auditVisualFatigueRisk()` | KPI 6+, contraste, densité, répétition cartes |
| `auditVenextUiPolish()` | Overflow, alignement, loaders texte, z-index |
| `VenextUnifiedDesignSystem` | Façade tokens officielle |
| `VenextSkeletonSystem` | Façade skeletons + `Screen` |
| `EnterpriseAuthVisual` | SVG premium (distribution, industrie, terrain, logistique) |
| `EnterpriseAuthExperience` | 55% visuel / 45% formulaire finalisé |
| CSS auth + table comfort + icon containers | Responsive auth, respiration tableaux |

## Migrations loaders (5 apps)

- **mobile-grossiste-b** / **mobile-detaillant** : catalogues, commandes, livraisons, réseau, onboarding, wallet → `VenextScreenLoader`
- **web-grossiste-a** : catalogues, commandes, livraisons, réseau → `VenextWorkspaceLoader`
- **web-industrial-nextjs** : ~25 surfaces → `VenextInlineSkeleton` + script migration
- **backoffice-web** : gouvernance → `VenextSkeletonScreen`

## Loaders texte restants (hors scope UI)

Libellés métier fulfillment : « Chargement confirmé », « Chargement partiel des vues » — statuts terrain, pas spinners Suspense.

## Tests

| Suite | Tests |
|-------|-------|
| `commerce-ux-harmony-87a.spec.tsx` | **140** |
| `commerce-ux-harmony-87.spec.tsx` + `commerce-ux-harmony.spec.tsx` | 338 total package |

## Build matrix (exit 0)

| Commande | Statut |
|----------|--------|
| `pnpm db:generate` | ✅ |
| `pnpm --filter commerce-ux-harmony build` | ✅ |
| `pnpm --filter commerce-performance-foundation build` | ✅ |
| `pnpm --filter commerce-humanized-errors build` | ✅ |
| `pnpm --filter core-domain-service build` | ✅ |
| `pnpm --filter commerce-bff build` | ✅ |
| `cd apps/mobile-grossiste-b && npm run build` | ✅ |
| `cd apps/mobile-detaillant && npm run build` | ✅ |
| `cd apps/web-grossiste-a && npm run build` | ✅ |
| `cd apps/web-industrial-nextjs && npm run build` | ✅ |
| `cd apps/backoffice-web && npm run build` | ✅ |
| `pnpm --filter commerce-ux-harmony test` (vitest) | ✅ 338 |

> `pnpm vitest run` racine non configuré — tests via filtres package.

## Limitations restantes

- Auth `EnterpriseAuthExperience` non branchée comme shell login unique sur toutes les apps (composant prêt, intégration auth-foundation à généraliser).
- Packages relationnels (`relational-commerce-catalog`, etc.) : loaders internes shell si `loading` prop — hors Suspense apps ; migration package optionnelle.
- ESLint warnings préexistants industrial (unused vars) — non bloquants build.

## Confirmation livrable

- ✅ Zéro loader texte Suspense/fallback visible dans les 5 apps cibles
- ✅ Auth premium 55/45 + visuels SVG crédibles
- ✅ Audits cohérence, fatigue, polish exportés
- ✅ 140+ tests 87-A
- ✅ Build matrix complète
- ✅ **Aucun commit git**
