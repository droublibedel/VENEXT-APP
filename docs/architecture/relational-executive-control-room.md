# Relational Executive Economic Control Room & Strategic Decision Board (Instruction 20.39)

## Rôle

Couche de **supervision exécutive institutionnelle finale** au-dessus des opérations exécutives (20.38) :

- centralisation des signaux exécutifs critiques ;
- supervision consolidée multi-corridors ;
- visualisation des déséquilibres systémiques ;
- consolidation des priorités stratégiques ;
- **Executive Decision Board** VENEXT (templates déterministes) ;
- surveillance des concentrations critiques ;
- matrices/boards exécutifs consolidés.

**Non** : ERP, workflows métier, paiements, IA générative, GPS/wallet/social/tracking public, autopilot.

## Modèle de données

- `RelationalExecutiveControlRoomNode` — `controlRoomScore`, `executivePressure`, `systemicConcentration`, `resilienceStrength`, pressions multi-couches (dont `operationsPressure`, `commandPressure`).
- `RelationalExecutiveControlRoomSignal`, `Board`, `Snapshot`, `Event` (journal append-only).
- FK optionnelle vers `RelationalExecutiveOperationsNode` + chaîne economic/executive/…

## Moteurs

- **Engine** : `computeExecutiveControlRoomState()`, détections `executiveEscalation`, `strategicCoordinationFailure`, `systemicCollapseRisk`.
- **Board** : 7 types (`EXECUTIVE_DECISION_BOARD` … `EXECUTIVE_BALANCE_BOARD`), aucun LLM.

## Ingestion

Chaîne : … → executive-operations → **executive-control-room** (`syncExecutiveControlRoomState` dans le `finally` de l’ingestion 20.38).

## API

Préfixe `/v1/relational-executive-control-room/` — overview, boards, priorities, balance, critical-corridors, systemic-pressure, history, archive-snapshot.

## Realtime

`relational.executive_control_room.*` validé **avant** `relational.executive_operations.*` (gateway + WebSocket).

## Feature flags

- `relational_executive_control_room_enabled` — DEV `true`, PROD `false`
- `relational_executive_control_room_realtime_enabled` — idem

## Limites V1

- Boards template uniquement (pas export PDF, pas planification différée).
- Agrégation multi-corridor limitée aux endpoints balance/critical-corridors/systemic-pressure.
- Activation production manuelle via flags.
