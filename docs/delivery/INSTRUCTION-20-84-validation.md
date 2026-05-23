# Instruction 20.84 — Audit UX global mobile/web & harmonisation finale

## Livrable

Harmonisation UX légère (pas de refonte, pas de nouveau module métier) via le package **`commerce-ux-harmony`** et intégration dans les 4 applications.

## Package `commerce-ux-harmony`

- Messages vides / erreurs commerce-first (FR, EN, AR, ZH partiels)
- Audit wording anti-jargon (`workflow`, `pipeline`, `ERP`, `supply chain`, etc.)
- Règles navigation (profondeur max 2) et mobile (max 5 actions visibles)
- Composants : `VenextCommerceEmptyState`, `VenextCommerceErrorState`, `VenextCommerceScreenHeader`
- CSS partagé : `commerce-ux-harmony/styles.css`
- Tests package : `commerce-ux-harmony.spec.ts` (60+ cas)

## Applications

| App | Bridge | CSS | Profil terrain |
|-----|--------|-----|----------------|
| mobile-grossiste-b | `GrossisteBUxHarmonyBridge` | oui | `data-ux-harmony` sur paramètres |
| mobile-detaillant | `DetaillantUxHarmonyBridge` | oui | idem |
| web-grossiste-a | `GrossisteAUxHarmonyBridge` | oui | tokens web |
| web-industrial-nextjs | `IndustrialUxHarmonyBridge` | oui | audit formel |

## Feature flag

- `commerce_ux_harmony_enabled` (seed Prisma + hooks apps, défaut `true` en dev)

## Tests apps

- `apps/mobile-grossiste-b/src/tests/commerce-ux-harmony.spec.tsx`
- `apps/mobile-detaillant/src/tests/commerce-ux-harmony.spec.tsx`
- `apps/web-grossiste-a/src/tests/commerce-ux-harmony.spec.tsx`
- `apps/web-industrial-nextjs/src/tests/commerce-ux-harmony.spec.ts`

## Confirmations

- Pas de refonte lourde ni nouvelle lib UI
- Pas de nouveau module métier (package UX transversal uniquement)
- Philosophie commerce-first / anti-ERP respectée
- **Aucun commit git**

## Limitations restantes

- Empty states métier dans les écrans legacy non tous migrés vers `VenextCommerceEmptyState` (harmonisation progressive)
- Industrial poles conservent leurs empty states locaux (wording déjà commerce-first)
- Audit accessibilité WCAG complet hors périmètre

## Build matrix

Exécuter selon instruction §14 :

```bash
pnpm db:generate
pnpm --filter commerce-foundation-guardrails build
pnpm --filter venext-i18n build
pnpm --filter venext-auth-foundation build
pnpm --filter commerce-notifications build
pnpm --filter commercial-activity-feed build
pnpm --filter commerce-offline-foundation build
pnpm --filter commerce-access-control build
pnpm --filter commercial-context-routing build
pnpm --filter commerce-ux-harmony build
cd apps/mobile-grossiste-b && npm install && npm run build
cd apps/mobile-detaillant && npm install && npm run build
cd apps/web-grossiste-a && npm install && npm run build
cd apps/web-industrial-nextjs && npm install && npm run build
pnpm --filter commerce-ux-harmony test
# + tests par app selon scripts package.json
```
