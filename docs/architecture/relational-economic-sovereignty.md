# Relational Economic Sovereignty & Strategic Corridor Autonomy (20.27)

## Philosophie

Couche **déterministe** de souveraineté économique relationnelle : autonomie corridor, concentration des dépendances, risque de captivité, auto-récupération. Référence : Palantir × economic sovereignty × industrial dependency intelligence.

**Interdit** : ERP, wallet, GPS, scoring public, IA générative, système bancaire fictif, mutations commandes/fulfillment.

## Pipeline d’ingestion

```
pressure → geo → sector → supply-flow → macro-economic → continuity → sovereignty
```

`syncEconomicSovereigntyState(relationshipId)` — `finally` après `syncEconomicContinuityState`, garde anti-boucle, `forwardRef`.

## Moteurs

| Moteur | Sorties |
|--------|---------|
| **Autonomy** | `sovereigntyScore`, `autonomyScore`, `dependencyConcentration`, `externalDependencyExposure`, `resilienceAutonomy`, `recoveryAutonomy`, `strategicCaptivityRisk`, `corridorSelfRecoveryProbability`, `dependencyCriticality`, `systemicAutonomyRisk` |
| **Dependency** | Concentration depuis macro deps, supply edges, mémoire, continuité |
| **Recovery** | DFS borné `VENEXT_SOVEREIGNTY_MAX_DEPTH`, `recoveryChains`, `recoveryComplexity` |
| **Captivity** | Corridors à `strategicCaptivityRisk` élevé |
| **Exposure** | Signaux `SYSTEMIC_EXPOSURE`, niveaux `RelationalEconomicDependencyExposure` |

## Sources autorisées

Continuity nodes/snapshots, macro-economic, supply-flow edges, geo, sector, strategic memory, pressure graph, orchestration, incidents, predictive risk, command center, fulfillment, simulations, scenario review.

## Gouvernance

- Lecture : `assertCorridorOperational(..., "operational_observation")`
- Mutation : `assertEconomicSovereigntyMutationAllowed()` — TERMINATED / SUSPENDED / BLOCKED
- Diagnostics : `mutationBlocked`, `sovereigntyMutationRejected`, `corridorTerminated`, `mutationSkippedReason`

## Realtime

`relational.sovereignty.*` validés **avant** `relational.continuity.*` à la gateway.

## API REST

`/v1/relational-economic-sovereignty/` — sovereignty-overview, dependency-map, captivity-map, autonomy-map, resilience-autonomy, critical-corridors, archive-snapshot.

## 20.28 — Sovereignty Retention & Calibration Hardening

### Politique de rétention

`RelationalEconomicSovereigntyRetentionService` — après chaque sync :

- Conserver les **N** derniers snapshots actifs par corridor (`VENEXT_SOVEREIGNTY_MAX_SNAPSHOTS_PER_CORRIDOR`, défaut 24).
- Archiver (`archivedAt`) les snapshots au-delà de l’âge (`VENEXT_SOVEREIGNTY_RETENTION_DAYS`, défaut 90).
- **Ne jamais archiver** les snapshots critiques si `VENEXT_SOVEREIGNTY_PRESERVE_CRITICAL=true` : sévérité HIGH/CRITICAL, captivité, `SYSTEMIC_EXPOSURE`, récupération faible.

Diagnostics : `retentionApplied`, `archivedSnapshotsCount`, `preservedCriticalSnapshotsCount`, `retentionPolicy`, `retentionReason`.

### Calibration centralisée

`RelationalEconomicSovereigntyCalibrationService` — version `SOVEREIGNTY_CALIBRATION_V1`.

Profils ENV `VENEXT_SOVEREIGNTY_CALIBRATION_PROFILE` : `CONSERVATIVE` | `BALANCED` (défaut) | `AGGRESSIVE`.

Chaque score autonomy expose : `weightsUsed`, `calibrationVersion`, `scoreContributors`, `confidenceLevel`.

### Enrichissement multi-corridor

`enrichSovereigntyEdgesForRelationship()` — sources : supply-flow, macro, continuity, pressure graph, strategic memory, secteur/geo partagés.

Bornes : `VENEXT_SOVEREIGNTY_EDGE_SCAN_LIMIT`, `VENEXT_SOVEREIGNTY_EDGE_MAX_DEPTH`.

### Dashboard agrégé (interne)

| Route | Usage |
|-------|--------|
| `GET sovereignty-dashboard` | Top captivité / autonomie / dépendance |
| `GET systemic-captivity` | Captivité par territoire & secteur |
| `GET autonomy-distribution` | Distribution scores & fallback |
| `GET dependency-concentration` | Concentration & exposition systémique |

Aucun scoring public partenaire.

### Realtime 20.28

`relational.sovereignty.retention_applied`, `calibration_updated`, `edge_enriched`, `dashboard_refreshed`.

### Gouvernance 20.28

Retention / enrichment / archive respectent `assertEconomicSovereigntyMutationAllowed()`. Lecture dashboard & historique TERMINATED autorisées.

## Limites V1 (post-20.28)

- Enrichissement peer limité aux corridors partageant org/secteur/geo (pas graphe global).
- Calibration heuristique — pas ML terrain.
- Dashboard agrégé org-scope (pas multi-tenant fédéré).

## Heuristiques restantes

Coefficients dans `RelationalEconomicSovereigntyCalibrationService` uniquement — pas de constantes dispersées.
