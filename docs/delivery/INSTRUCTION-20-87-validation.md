# Instruction 20.87 — Validation UX/UI, Skeleton & Design Excellence

## Livrable

### VenextSkeletonSystem (`commerce-ux-harmony`)

| Composant | Rôle |
|-----------|------|
| `VenextSkeletonBase` | Bloc atomique (pulse doux, GPU-safe) |
| `VenextSkeletonText` / `Card` / `List` / `Table` / `Chart` | Layouts fidèles au contenu |
| `VenextSkeletonMessage` / `Dashboard` / `Form` / `Product` / `Order` | Domaines métier |
| `VenextSkeletonPole` / `Wallet` / `Notification` | Pôles & wallet |
| `VenextSkeletonScreen` | Sélecteur contextuel par écran |

CSS : `commerce-ux-harmony/skeleton.css` — pas de shimmer agressif, `prefers-reduced-motion` respecté.

### VenextUnifiedDesignSystem

Tokens : `VENEXT_SPACING`, `VENEXT_RADIUS`, `VENEXT_TYPOGRAPHY`, `VENEXT_FORM`, `VENEXT_ELEVATION`, `venextUnifiedDesignCssVariables()`.

### Audit

`auditVenextVisualConsistency()` — spinners seuls, formulaires denses, dashboards surchargés, shimmer agressif, etc.

### EnterpriseAuthExperience

Layout **55 % visuel / 45 % formulaire**, skeleton auth en chargement.

## Intégration apps

| App | Intégration |
|-----|-------------|
| mobile-grossiste-b | `VenextScreenLoader` (wallet, messaging, dashboard) + `skeleton.css` |
| mobile-detaillant | `VenextScreenLoader` + `skeleton.css` |
| web-grossiste-a | `VenextWorkspaceLoader` + `skeleton.css` |
| web-industrial-nextjs | `VenextPanelSkeleton` sur 8 pôles + layouts messaging/wallet/poles + `skeleton.css` |
| backoffice-web | Héritage `commerce-ux-harmony/styles.css` (boundary existant) |

## Tests

- `commerce-ux-harmony-87.spec.tsx` — **125 tests**
- `commerce-ux-harmony.spec.tsx` — 73 tests
- **Total package : 198 tests — exit 0**

## Build

```bash
pnpm --filter commerce-ux-harmony build
pnpm --filter commerce-ux-harmony test
```

## Confirmations

- Skeleton officiel (plus de « Chargement… » seul sur shells migrés)
- Layout skeleton fidèle au contenu final par domaine
- Tokens spacing/radius/typography unifiés
- Respiration globale (padding, gaps formulaires)
- **Aucun commit git**

## Limitations restantes

- Migration progressive des sous-composants lazy restants (catalog/orders hints texte dans mobile-detaillant / grossiste-a)
- `EnterpriseAuthExperience` prêt à brancher sur `venext-auth-foundation` (écran auth dédié par app)
- Images auth premium : structure CSS/layout livrée ; assets visuels à intégrer par direction artistique
- Build complet apps (next/vite) non relancé intégralement dans cette passe — package `commerce-ux-harmony` validé
