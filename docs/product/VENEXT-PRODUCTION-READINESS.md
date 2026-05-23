# VENEXT — Production readiness (V1)

## Package `venext-v1-readiness`

Fonctions d’audit final :

- `auditFinalFeatureFlags(flags, context?)` — cohérence flags DEV/PROD, dépendances croisées
- `buildVenextProductionReadiness(input)` — score global + checks critiques

## Critères de passage préproduction

| Domaine | Critère |
|---------|---------|
| Philosophie | Wording commerce-first, exclusions V1 respectées |
| Mobile terrain | Grossiste B + Détaillant, offline léger, wallet sécurisé |
| Web formel | Producteur + Grossiste A, workspaces sans ERP |
| BFF / backend | Fallbacks, payloads trim, guards relationnels |
| Performance | Pas de polling, pas de websocket, listes fenêtrées |
| i18n | FR, EN, AR RTL, ZH — pas de clés brutes en PROD |
| Feature flags | Cohérence modules foundation |

## Score readiness

`buildVenextProductionReadiness` retourne :

- `ready: true` si checks critiques OK et score ≥ 85
- `v1Frozen: true` (gel fonctionnel actif)

## Commandes de vérification

```bash
pnpm db:generate
pnpm --filter venext-v1-readiness build
pnpm --filter venext-v1-readiness test
# + build matrix apps (voir INSTRUCTION-20-86-validation.md)
```

## Limitations connues V1

- Profiling 60fps sur devices réels hors CI
- Certaines listes messaging non virtualisées (caps mémoire appliqués)
- Pôles industrial avancés = lecture intelligence, pas exécution ERP
