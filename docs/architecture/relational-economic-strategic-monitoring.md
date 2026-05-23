# Relational Economic Strategic Monitoring & Executive Control Layer (20.33)

## Philosophie

Couche **exécutive** de supervision stratégique relationnelle : agrégation des signaux critiques multi-corridors, évaluation de la stabilité systémique, centralisation des alertes stratégiques, lecture directionnelle consolidée.

**Ce n’est pas un ERP, un cockpit logistique, ni une IA autonome.** Aucune exécution de workflows opérationnels, modification de commandes, paiements ou déclenchement automatique d’actions.

## Pipeline d’ingestion

```
pressure → geo → sector → supply-flow → macro → continuity → sovereignty
→ recovery → governance → arbitration → stabilization → monitoring
```

`syncEconomicMonitoringState(relationshipId)` — appelé en `finally` après `syncEconomicStabilizationState`, avec `forwardRef`, garde anti-boucle et journalisation.

## Moteurs

| Moteur | Rôle |
|--------|------|
| **Engine** | `monitoringScore`, `executivePressure`, `systemicRisk`, `resilienceLevel`, pressions multi-couches, `executiveUrgency` |
| **Alert** | EXECUTIVE_PRESSURE, SYSTEMIC_ESCALATION, CRITICAL_CORRIDOR, STABILIZATION_FAILURE, GOVERNANCE_OVERLOAD, DEPENDENCY_COLLAPSE, TERRITORIAL_IMBALANCE, RECOVERY_DEGRADATION |
| **Priority / Risk / Balance** | priorités corridor, risque exécutif, déséquilibres structurels |

Scores bornés [0–100]. Détection uniquement — pas d’exécution automatique.

## Sources réelles

Stabilization, governance, arbitration, recovery, sovereignty, continuity, macro-economic, supply-flow, geo-economic, sector intelligence, pressure graph, strategic memory, orchestration, scenario review, predictive risk, incidents, fulfillment, dependency edges.

**Interdit** : GPS, wallet, social graph, marketing, scraping, tracking public.

## Gouvernance

- **Lecture** : `assertCorridorOperational(..., "operational_observation")`.
- **Mutation** : `assertEconomicMonitoringMutationAllowed()` — bloque TERMINATED / SUSPENDED / BLOCKED.
- Diagnostics : `mutationBlocked`, `monitoringMutationRejected`, `corridorTerminated`, `governanceOperation`, `mutationSkippedReason`.

## Realtime

Événements `relational.monitoring.*` validés **avant** `relational.stabilization.*` :

- `relational.monitoring.executive_alert_detected`
- `relational.monitoring.systemic_risk_detected`
- `relational.monitoring.critical_corridor_detected`
- `relational.monitoring.priority_detected`
- `relational.monitoring.escalation_detected`

## API REST

Préfixe `/v1/relational-economic-monitoring/` — overview, alerts, systemic-pressure, critical-corridors, priorities, balance, history, archive-snapshot.

## Feature flags

- `relational_economic_monitoring_enabled`
- `relational_economic_monitoring_realtime_enabled`

DEV : true (seed aligné). PROD : false (defaults frontend).

## Limites V1

- Heuristiques déterministes (pas ML).
- Journal append-only — rétention à définir.
- UI lecture seule dans fulfillment (après stabilization).
- Un nœud actif par sync corridor.
