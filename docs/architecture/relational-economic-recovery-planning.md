# Relational Economic Recovery Planning & Strategic Intervention Engine (20.29)

## Philosophie

Couche **déterministe** de planification de reprise économique corridor : analyse, priorisation, séquencement et proposition d’interventions relationnelles structurées.

**Ce n’est pas un autopilot économique.** Le moteur ne déclenche aucune mutation commerciale (wallet, paiement, commande, livraison, partenaire, inventaire, pricing, stock réel).

## Pipeline d’ingestion

```
pressure → geo → sector → supply-flow → macro-economic → continuity → sovereignty → recovery
```

`syncEconomicRecoveryState(relationshipId)` — appelé en `finally` après `syncEconomicSovereigntyState`, avec `forwardRef`, garde anti-boucle `Set` et journalisation `try/catch`.

## Moteurs

| Moteur | Sorties |
|--------|---------|
| **Planning** | `recoveryScore`, `instabilityScore`, `dependencyExposure`, `continuityPressure`, `sovereigntyPressure`, `corridorRecoveryProbability`, `estimatedRecoveryDuration`, `recoveryComplexity`, `interventionPriority`, `systemicImpactRisk` |
| **Priority** | `recoveryPriorityScore`, `interventionUrgency`, `corridorCriticality`, `recoveryWindowRisk` |
| **Dependency** | DFS/BFS borné (`VENEXT_RECOVERY_MAX_DEPTH`), `recovery chains`, bottlenecks, blockers |
| **Risk** | Instabilité, complexité, risque systémique |

Scores bornés 0–100 ; probabilités 0–1.

## Séquencement (étapes déterministes)

1. `PRIORITY_STABILIZATION`
2. `DEPENDENCY_REDUCTION`
3. `FLOW_REBALANCING`
4. `PRESSURE_CONTAINMENT`
5. `CONTINUITY_RECOVERY`
6. `SOVEREIGNTY_REINFORCEMENT`
7. `SECTOR_REBALANCING`
8. `TERRITORIAL_REALIGNMENT`
9. `SYSTEMIC_RISK_CONTAINMENT`
10. `RECOVERY_VALIDATION`

Chaque étape : `stepCode`, `stepOrder`, `blocking`, `estimatedDuration`, `dependencyLevel`, `recoveryImpactScore`, `recoveryRiskScore`, `confidenceLevel` — **sans exécution automatique**.

## Sources autorisées

Souveraineté, continuité, macro, supply-flow, pressure graph, geo-economic, sector intelligence, orchestration, simulations, scenario review, strategic memory, predictive risk, incidents, fulfillment, coordination, métriques opérationnelles, historique recovery, dependency edges.

**Interdit** : GPS, wallet, marketing, scraping, social graph, tracking public.

## Gouvernance

- **Lecture** : `assertCorridorOperational(..., "operational_observation")`.
- **Mutation** : `assertEconomicRecoveryMutationAllowed()` — bloque TERMINATED / SUSPENDED / BLOCKED.
- Diagnostics : `mutationBlocked`, `recoveryMutationRejected`, `corridorTerminated`, `governanceOperation`, `mutationSkippedReason`.

## Realtime

Événements `relational.recovery.*` validés **avant** `relational.sovereignty.*` à la gateway :

- `relational.recovery.plan_generated`
- `relational.recovery.priority_detected`
- `relational.recovery.instability_detected`
- `relational.recovery.systemic_risk_detected`
- `relational.recovery.recovery_updated`

Payload minimal Zod (`paymentExecutionDisabled`, `publicTrackingDisabled`).

## API REST

Préfixe `/v1/relational-economic-recovery/` — recovery-overview, recovery-map, recovery-dependencies, recovery-priorities, recovery-history, critical-recovery-corridors, archive-recovery-plan.

## Limites V1

- Plans et snapshots append-only — politique de rétention à définir.
- Pondérations heuristiques (pas ML).
- UI : surfaces de lecture dans fulfillment (après souveraineté) et pôle dédié.
- Archive plan = statut ARCHIVED uniquement, pas rollback opérationnel corridor.

## Heuristiques restantes

Coefficients priority / risk / dependency — calibrables en 20.29A sans changer le contrat API.
