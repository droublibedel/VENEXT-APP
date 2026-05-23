# Relational Executive Economic Orchestration & Strategic Oversight Matrix (20.34)

## Philosophie

Couche **exécutive supérieure** de coordination stratégique multi-corridors : orchestration des lectures globales, agrégation des risques transversaux, supervision des corridors critiques, cohérence du réseau relationnel.

**Ce n’est pas un ERP, un automate opérationnel, ni un outil social.** Aucune modification de commandes, workflows, paiements ou tracking public.

## Pipeline d’ingestion

```
pressure → geo → sector → supply-flow → macro → continuity → sovereignty
→ recovery → governance → arbitration → stabilization → monitoring → executive-orchestration
```

`syncExecutiveOrchestrationState(relationshipId)` — appelé en `finally` après `syncEconomicMonitoringState`, avec `forwardRef`, garde anti-boucle et journalisation.

## Moteurs

| Moteur | Rôle |
|--------|------|
| **Engine** | `orchestrationScore`, `executiveCoordinationPressure`, `systemicExposure`, `executiveResilience`, `strategicAlignmentScore`, pressions multi-couches |
| **Dependency** | dépendances exécutives, exposition cross-corridor, concentration, stress coordination, BFS borné (`VENEXT_EXECUTIVE_ORCHESTRATION_MAX_DEPTH` = 6) |

Scores bornés [0–100]. Détection uniquement — pas d’exécution automatique.

## Realtime

Événements `relational.executive_orchestration.*` validés **avant** `relational.monitoring.*` :

- `relational.executive_orchestration.instability_detected`
- `relational.executive_orchestration.systemic_exposure_detected`
- `relational.executive_orchestration.priority_detected`
- `relational.executive_orchestration.coordination_breakdown_detected`
- `relational.executive_orchestration.resilience_detected`

## API REST

Préfixe `/v1/relational-executive-orchestration/` — overview, dependencies, priorities, balance, critical-corridors, systemic-pressure, history, archive-snapshot.

## Feature flags

- `relational_executive_orchestration_enabled`
- `relational_executive_orchestration_realtime_enabled`

DEV : true (seed aligné). PROD : false (defaults frontend).

## Limites V1

- Heuristiques déterministes (pas ML).
- Journal append-only — rétention à définir.
- UI lecture seule dans fulfillment (après monitoring).
- Dépendances self-node pour trace analytique corridor.
