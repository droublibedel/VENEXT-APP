# Relational Nomenclature Audit (Instruction 20.44)

## Convention cible (figée niveau 5)

| Élément | Convention |
|---------|------------|
| Module dossier | `relational-{domain}` kebab-case |
| Prisma | `Relational{Domain}{Entity}` PascalCase, tables `relational_{domain}_*` |
| Feature flags | `relational_{domain}_enabled`, `relational_{domain}_realtime_enabled` |
| Realtime | `relational.{namespace_snake}.*` |
| API controller | `@Controller("relational-{domain}")` |
| Routes métier | `{domain}-{artifact}/:relationshipId` |

## Incohérences détectées (documentées — pas de renommage massif)

| Item | Issue | Action 20.44 |
|------|-------|--------------|
| `relational_sector_realtime_enabled` vs `relational_sector_intelligence_*` | Flag frontend nommé `sector_realtime` | Documenté ; alignement futur 20.45+ |
| `relational.monitoring.*` vs module `economic-monitoring` | Namespace court vs dossier long | Conservé (breaking change évité) |
| `relational.governance.*` vs `economic-governance` | Même pattern | Conservé |
| Alias `StrategicObservatoryOverviewSchema` | Doublon export | Conservé pour rétrocompat |
| `RELATIONAL_STRATEGIC_OBSERVATORY_AI_CONTEXT` dans macro-governance ai-context | Copie 20.42 | Corrigé si présent (nom export) |

## Doublons fonctionnels (intentionnels)

- **Supervision vs observatory vs macro-governance** : scopes distincts (20.41 / 20.42 / 20.43), noms proches mais non redondants métier.
- **Grid vs matrix** : observatory = grilles, macro-governance = matrices (terminologie figée).

## Corrections critiques appliquées

- Registre central ingestion + realtime.
- Politique readonly unique.
- Pas de rename Prisma / routes (stabilité niveau 5).
