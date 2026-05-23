# Relational Strategic Executive Operations Intelligence (Instruction 20.38)

## Rôle

Couche de **supervision exécutive opérationnelle consolidée** au-dessus du command center stratégique (20.37) :

- supervision des tensions stratégiques globales ;
- signaux critiques multi-corridors ;
- matrices de supervision décisionnelle déterministes ;
- lecture exécutive consolidée, concentrations systémiques, priorités institutionnelles.

**Non** : ERP, workflows, paiements, IA générative, GPS/wallet/social/tracking public.

## Modèle de données

- `RelationalExecutiveOperationsNode` — `executiveOperationsScore`, `executivePressure`, `systemicConcentration`, `resilienceStrength`, pressions multi-couches (dont `commandPressure`).
- `RelationalExecutiveOperationsSignal`, `Matrix`, `Snapshot`, `Event` (journal append-only).
- FK optionnelle vers `RelationalStrategicCommandNode` + chaîne economic/executive/…

## Moteurs

- **Engine** : `computeExecutiveOperationsState()`, détections `executiveEscalation`, `coordinationCollapse`, `operationalInstability`.
- **Matrix** : 7 types (`EXECUTIVE_OPERATIONS_MATRIX` … `EXECUTIVE_BALANCE_MATRIX`), aucun LLM.

## Ingestion

Chaîne : … → strategic-command → **executive-operations** (`syncExecutiveOperationsState` dans le `finally` de l’ingestion 20.37).

## API

Préfixe `/v1/relational-executive-operations/` — overview, matrices, priorities, balance, critical-corridors, systemic-pressure, history, archive-snapshot.

## Realtime

`relational.executive_operations.*` validé **avant** `relational.strategic_command.*` (gateway + WebSocket).

## Feature flags

- `relational_executive_operations_enabled` — DEV `true`, PROD `false`
- `relational_executive_operations_realtime_enabled` — idem

## Limites V1

- Matrices template uniquement (pas export PDF, pas planification différée).
- Agrégation multi-corridor limitée aux endpoints balance/critical-corridors/systemic-pressure.
- Activation production manuelle via flags.
