# Instruction 20.86-E2 — Validation

## Cause exacte

1. **Sous-chemin `./separation` non résolu** : `core-domain-service` utilise `moduleResolution: "node"`, qui n’honore pas toujours le champ `exports` de `package.json` pour `enterprise-commercial-governance/separation`.
2. **`export *` invisible pour TypeScript (NodeNext)** : dans `commerce-bff` (`moduleResolution: "NodeNext"`), les `.d.ts` générés avec seulement `export * from "./grossiste-a-producer-separation"` ne exposaient pas les membres nommés via `enterprise-commercial-governance/separation` ni via le barrel racine.
3. **Barrel manquant** : le module public `separation` n’existait pas en source avant E2 ; la logique vivait uniquement dans `grossiste-a-producer-separation.ts`.

## Correction appliquée

| Zone | Action |
|------|--------|
| `packages/enterprise-commercial-governance/src/separation.ts` | Barrel officiel avec **exports nommés explicites** |
| `packages/enterprise-commercial-governance/src/index.ts` | Réexport explicite des symboles séparation + `export *` conservé |
| `packages/enterprise-commercial-governance/package.json` | `exports["./separation"]` → `dist/separation.js` + `typesVersions` |
| `services/core-domain-service` | Import depuis `enterprise-commercial-governance` (entrée principale) |
| `services/commerce-bff` | Import depuis `enterprise-commercial-governance/separation` (sous-chemin stable après barrel explicite) |

**Pas de chemin relatif profond** (`../../packages/...`) dans les services.

## Export public corrigé

```json
"./separation": {
  "types": "./dist/separation.d.ts",
  "import": "./dist/separation.js",
  "require": "./dist/separation.js",
  "default": "./dist/separation.js"
}
```

Symboles exportés : `compareActorPoleAccess`, `assertGrossisteASeparation`, `rejectGrossisteAOnProducerApiRoute`, `grossisteASeparationUserMessage`, etc.

## Fichiers modifiés (E2 + déblocage matrice build)

- `packages/enterprise-commercial-governance/src/separation.ts`
- `packages/enterprise-commercial-governance/src/index.ts`
- `packages/enterprise-commercial-governance/package.json` (session précédente)
- `services/commerce-bff/src/grossiste-a-pole-guard.ts`
- `services/core-domain-service/src/modules/grossiste-a-pole-guard/grossiste-a-pole-guard.service.ts`
- `apps/web-grossiste-a/src/main.tsx` (imports CSS cassés — hors séparation, bloquait la matrice)
- `apps/web-industrial-nextjs/src/app/*/layout.tsx` (`"use client"` pour boundaries)
- `apps/web-industrial-nextjs/next.config.ts` (`transpilePackages`)
- `packages/commerce-humanized-errors/src/index.ts` (exports explicites — build industrial)

## Build matrix (exit 0)

| Commande | Résultat |
|----------|----------|
| `pnpm --filter enterprise-commercial-governance build` | ✅ |
| `pnpm --filter core-domain-service build` | ✅ |
| `pnpm --filter commerce-bff build` | ✅ |
| `cd apps/web-grossiste-a && npm run build` | ✅ |
| `cd apps/web-industrial-nextjs && npm run build` | ✅ |
| `cd apps/backoffice-web && npm run build` | ✅ |
| Tests ciblés (governance, access-control, bff, humanized-errors) | ✅ 830+ tests |

> Note : `pnpm vitest run` à la racine n’est pas configuré (pas de script racine). Les packages concernés ont été exécutés via `pnpm --filter <pkg> test`.

## Git

**Aucun commit git** — conformément à l’instruction.
