# Relational Executive Strategic Synthesis & Global Oversight Consolidation (Instruction 20.40)

## Rôle

Couche de **consolidation exécutive ultime** au-dessus de la control room (20.39) :

- synthèse stratégique consolidée multi-corridors ;
- supervision globale et signaux critiques ;
- priorités exécutives centralisées ;
- pressions systémiques consolidées ;
- digests institutionnels déterministes ;
- résilience économique relationnelle (lecture seule).

**Non** : workflows, mutations métier, paiements, IA générative / LLM, GPS, wallet, social, scraping, tracking public, autopilot décisionnel.

## Modèle de données

- `RelationalExecutiveStrategicSynthesisNode` — `synthesisScore`, `executiveExposure`, `systemicPressure`, `resilienceStrength`, `strategicAlignmentScore`, pressions multi-couches (dont `controlRoomPressure`).
- `RelationalExecutiveStrategicSynthesisSignal`, `Digest`, `Snapshot`, `Event` (journal append-only).
- FK optionnelle vers `RelationalExecutiveControlRoomNode` + chaîne economic/executive/…

## Moteurs

- **Engine** : `computeExecutiveStrategicSynthesisState()`, scores bornés [0–100], détections `executiveInstability`, `systemicEscalation`, `strategicCollapseRisk`.
- **Digest** : 7 types (`EXECUTIVE_SYNTHESIS_DIGEST` … `EXECUTIVE_BALANCE_DIGEST`), templates + seuils uniquement.

## Sources réelles

Lecture corridor : control-room, operations, strategic-command/intelligence, institutional-reporting, orchestration, monitoring, stabilization, governance, arbitration, recovery, sovereignty, continuity, macro, supply-flow, geo-economic, sector, pressure graph, strategic memory, predictive risk, incidents, fulfillment, dependencies, scenario review.

## Ingestion

Chaîne : … → executive-control-room → **executive-strategic-synthesis** (`syncExecutiveStrategicSynthesisState` dans le `finally` de l’ingestion 20.39, `forwardRef`, anti-loop, journal `executive_strategic_synthesis_chain_failed`).

## API

Préfixe `/v1/relational-executive-strategic-synthesis/` — overview, digests, priorities, balance, critical-corridors, systemic-pressure, history, archive-snapshot.

## Realtime

`relational.executive_strategic_synthesis.*` validé **avant** `relational.executive_control_room.*` (gateway + WebSocket).

## Feature flags

- `relational_executive_strategic_synthesis_enabled` — DEV `true`, PROD `false`
- `relational_executive_strategic_synthesis_realtime_enabled` — idem

## Limites V1

- Digests template uniquement (pas export PDF, pas planification différée).
- Agrégation multi-corridor limitée aux endpoints balance/critical-corridors/systemic-pressure.
- Activation production manuelle via flags.
