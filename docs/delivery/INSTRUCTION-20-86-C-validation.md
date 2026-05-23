# Instruction 20.86-C — Validation

## Livrable

Clarification métier définitive **Grossiste A ≠ Producteur** :

| Zone | Fichiers |
|------|----------|
| Pôles officiels (8) | `grossiste-a-canonical-poles.ts` |
| Séparation & gardes | `grossiste-a-producer-separation.ts` |
| i18n pôles / identité | `grossiste-a-pole-i18n.ts`, `venext-i18n` navigation FR/EN/AR/ZH |
| Doc canonique | `apps/web-grossiste-a/CANONICAL.md` |
| UI | wording dashboards, « Activité réseau », `GrossisteASeparationBridge` |
| Core | `GrossisteAPoleGuardService` sur routes `grossiste-a` / `producer` |
| BFF | `createGrossisteASeparationMiddleware` sur `/api/grossiste-a` et `/api/producer` |

## Fonctions exposées

- `compareActorPoleAccess(actor, pole)`
- `rejectProducerOnlyPoleAccess(actor, pole)`
- `assertGrossisteASeparation(actor, pole)`
- `rejectGrossisteAOnProducerApiRoute(actor, path)`

## Tests

`grossiste-a-producer-separation-86c.spec.ts` — 60+ cas (pôles autorisés/interdits, routes, workspaces, i18n, métriques dashboard).

## Confirmations

- Grossiste A = distributeur structuré, pas producteur
- Pôles industriels / macro réservés Producteur
- Gouvernance grands comptes inchangée (sécurité formelle)
- **Aucun commit git**

## Limitations

- Workspaces UI historiques (`intelligence`) conservés comme alias vers `DIRECTION_COMMERCIALE`
- Filtrage complet de tous les libellés legacy dans l’app non exhaustif hors écrans principaux
- Activation pôles enterprise back-office : filtrer par `actorKind` grossiste_a à brancher sur écran gouvernance dédié
