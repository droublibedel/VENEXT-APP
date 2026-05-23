# Relational Global Executive Supervision & Strategic Master Coordination Layer (Instruction 20.41)

## Rôle

Couche de **supervision exécutive globale ultime** au-dessus de la synthèse stratégique (20.40) :

- supervision consolidée multi-corridors ;
- coordination exécutive institutionnelle ;
- matrices déterministes de coordination maître ;
- exposition systémique et pression exécutive consolidées ;
- résilience et alignement stratégique réseau.

**Non** : workflows, mutations métier, paiements, IA générative / LLM, GPS, wallet, social, scraping, tracking public.

## Modèle de données

- `RelationalGlobalExecutiveSupervisionNode` — `supervisionScore`, `executivePressure`, `systemicExposure`, `resilienceStrength`, pressions multi-couches (dont `synthesisPressure`, `controlRoomPressure`).
- `RelationalGlobalExecutiveSupervisionSignal`, `Matrix`, `Snapshot`, `Event` (journal append-only).
- FK optionnelle vers `RelationalExecutiveStrategicSynthesisNode` + chaîne executive/economic.

## Moteurs

- **Engine** : `computeGlobalExecutiveSupervisionState()`, scores [0–100], détections `executiveEscalation`, `systemicConcentration`, `globalCollapseRisk`.
- **Matrix** : 7 types (`GLOBAL_EXECUTIVE_SUPERVISION_MATRIX` … `EXECUTIVE_BALANCE_MATRIX`), templates uniquement.

## Ingestion

Chaîne : … → executive-strategic-synthesis → **global-executive-supervision** (`syncGlobalExecutiveSupervisionState` dans le `finally` de l’ingestion 20.40).

## API

Préfixe `/v1/relational-global-executive-supervision/` — overview, matrices, priorities, balance, critical-corridors, systemic-pressure, history, archive-snapshot.

## Realtime

`relational.global_executive_supervision.*` validé **avant** `relational.executive_strategic_synthesis.*`.

## Feature flags

- `relational_global_executive_supervision_enabled` — DEV `true`, PROD `false`
- `relational_global_executive_supervision_realtime_enabled` — idem

## Limites V1

- Matrices template uniquement (pas export PDF).
- Agrégation multi-corridor limitée aux endpoints balance / critical-corridors / systemic-pressure.
- Activation production manuelle via flags.
