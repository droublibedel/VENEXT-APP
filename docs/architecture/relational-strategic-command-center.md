# Relational Strategic Economic Command Center (Instruction 20.37)

## Rôle

Couche de **supervision exécutive consolidée** au-dessus de l’intelligence stratégique (20.36) :

- visualisation systémique des corridors ;
- grilles de supervision multi-couches (7 types déterministes) ;
- centralisation des pressions critiques et concentrations exécutives ;
- lecture territoriale / sectorielle consolidée ;
- équilibre stratégique et résilience globale.

**Non** : ERP, workflows opérationnels, paiements, IA générative, GPS/wallet/social/tracking public.

## Modèle de données

- `RelationalStrategicCommandNode` — `commandScore`, `systemicPressure`, `executiveConcentration`, `resilienceStrength`, pressions multi-couches (governance, arbitration, stabilization, monitoring, orchestration, institutional, intelligence).
- `RelationalStrategicCommandSignal`, `Grid`, `Snapshot`, `Event` (journal append-only).
- FK optionnelle vers `RelationalStrategicIntelligenceNode` + chaîne economic/executive/…

## Moteurs

- **Engine** : `computeStrategicCommandState()`, détections `systemicEscalation`, `executiveOverload`, `strategicCollapseRisk`.
- **Grid** : `EXECUTIVE_COMMAND_GRID`, `STRATEGIC_SUPERVISION_GRID`, `SYSTEMIC_PRESSURE_GRID`, `TERRITORIAL_GRID`, `SECTOR_GRID`, `RESILIENCE_GRID`, `GOVERNANCE_GRID` — templates uniquement.

## Ingestion

Chaîne : … → strategic-intelligence → **strategic-command** (`syncStrategicCommandState` dans le `finally` de l’ingestion 20.36).

## API

Préfixe `/v1/relational-strategic-command/` — overview, grids, priorities, balance, critical-corridors, systemic-pressure, history, archive-snapshot.

## Realtime

`relational.strategic_command.*` validé **avant** `relational.strategic_intelligence.*` (gateway + WebSocket).

## Feature flags

- `relational_strategic_command_enabled` — DEV `true`, PROD `false`
- `relational_strategic_command_realtime_enabled` — idem

## Limites V1

- Grilles template uniquement (pas export PDF, pas planification différée).
- Agrégation multi-corridor limitée aux endpoints balance/critical-corridors/systemic-pressure.
- Activation production manuelle via flags.
