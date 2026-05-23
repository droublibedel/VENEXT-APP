# Relational Strategic Economic Intelligence Consolidation (Instruction 20.36)

## Rôle

Couche de **consolidation stratégique supérieure** au reporting institutionnel (20.35) :

- unifie les lectures institutionnelles ;
- agrège les signaux exécutifs multi-corridors ;
- produit des **synthèses exécutives déterministes** (templates, seuils, scores) ;
- supervise cohérence réseau, concentrations critiques, déséquilibres structurels.

**Non** : IA conversationnelle, texte libre, ERP, workflows/paiements, GPS/wallet/social/tracking public.

## Modèle de données

- `RelationalStrategicIntelligenceNode` — scores `strategicIntelligenceScore`, `executiveExposure`, `systemicConcentration`, `resilienceStrength`, pressions (dont `institutionalPressure`).
- `RelationalStrategicIntelligenceSignal`, `Synthesis`, `Snapshot`, `Event` (journal append-only).
- FK optionnelle vers `RelationalInstitutionalReportingNode` + chaîne executive/monitoring/…

## Moteurs

- **Engine** : `computeStrategicIntelligenceState()`, détections `systemicPressure`, `executiveExposure`, priorité, résilience.
- **Synthesis** : 7 types (`EXECUTIVE_SYNTHESIS` … `GOVERNANCE_SYNTHESIS`), aucun LLM.

## Ingestion

Chaîne : … → institutional-reporting → **strategic-intelligence** (`syncStrategicIntelligenceState` dans le `finally` de l’ingestion 20.35).

## API

Préfixe `/v1/relational-strategic-intelligence/` — overview, syntheses, priorities, balance, critical-corridors, systemic-pressure, history, archive-snapshot.

## Realtime

`relational.strategic_intelligence.*` validé **avant** `relational.institutional_reporting.*` (gateway + WebSocket).

## Feature flags

- `relational_strategic_intelligence_enabled` — DEV `true`, PROD `false`
- `relational_strategic_intelligence_realtime_enabled` — idem

## Limites V1

- Synthèses template uniquement (pas export PDF, pas planification différée).
- Agrégation multi-corridor limitée aux endpoints balance/critical-corridors/systemic-pressure.
- Activation production manuelle via flags.
