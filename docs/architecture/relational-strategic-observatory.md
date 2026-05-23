# Relational Strategic Economic Observatory & Macro Coordination Consolidation (Instruction 20.42)

## Rôle

Couche d’**observation macro multi-corridors** au-dessus de la supervision globale (20.41) :

- observation macro consolidée ;
- coordination économique globale ;
- grilles déterministes de coordination ;
- concentrations systémiques et tensions territoriales/sectorielles ;
- résilience et diagnostics stratégiques réseau.

**Non** : autopilot, workflows, mutations métier, paiements, IA générative / LLM, GPS, wallet, social, scraping, tracking public.

## Modèle de données

- `RelationalStrategicObservatoryNode` — `observatoryScore`, `executiveExposure`, `systemicPressure`, `strategicCoordinationPressure`, …
- `RelationalStrategicObservatorySignal`, `Grid`, `Snapshot`, `Event` (journal append-only).
- FK principale : `globalExecutiveSupervisionNodeId` + chaîne executive/economic.

## Moteurs

- **Engine** : `computeStrategicObservatoryState()`, détections `executiveInstability`, `systemicConcentration`, `globalCoordinationStress`, `strategicCollapseRisk`.
- **Grid** : 7 types (`GLOBAL_STRATEGIC_OBSERVATORY_GRID` … `EXECUTIVE_ALIGNMENT_GRID`), templates uniquement.

## Ingestion

Chaîne : … → global-executive-supervision → **strategic-observatory** (`syncStrategicObservatoryState` dans le `finally` de l’ingestion 20.41).

## API

Préfixe `/v1/relational-strategic-observatory/` — overview, grids, priorities, balance, critical-corridors, systemic-pressure, history, archive-snapshot.

## Realtime

`relational.strategic_observatory.*` validé **avant** `relational.global_executive_supervision.*`.

## Feature flags

- `relational_strategic_observatory_enabled` — DEV `true`, PROD `false`
- `relational_strategic_observatory_realtime_enabled` — idem

## Limites V1

- Grilles template uniquement (pas export PDF).
- Agrégation multi-corridor limitée aux endpoints balance/critical-corridors/systemic-pressure.
- Activation production manuelle via flags.
