# Relational Economic Conflict Resolution & Strategic Arbitration Engine (20.31)

## Philosophie

Couche **déterministe** de résolution de conflits économiques relationnels et d’arbitrage stratégique multi-corridor : structuration des workflows d’arbitrage, priorisation des corridors, évaluation de scénarios, impacts systémiques, journalisation des décisions, coordination des validations humaines, stratégies de stabilisation réseau.

**Ce n’est pas un economic autonomous executor.** Aucune exécution automatique de commandes, paiements, wallet, livraisons, pricing, inventaire, mutations partenaires ou allocations commerciales.

## Pipeline d’ingestion

```
pressure → geo → sector → supply-flow → macro-economic → continuity → sovereignty → recovery → governance → arbitration
```

`syncEconomicArbitrationState(relationshipId)` — appelé en `finally` après `syncEconomicGovernanceState`, avec `forwardRef`, garde anti-boucle et journalisation.

## Moteurs

| Moteur | Rôle |
|--------|------|
| **Conflict** | `detectArbitrationCandidates`, pressions (dependency, continuity, sovereignty, propagation, coordination), `arbitrationScore`, `systemicImpact`, `resolutionComplexity`, `resolutionProbability`, `resolutionRisk` |
| **Scenario** | 10 types déterministes (STABILIZATION_FIRST … MINIMAL_INTERVENTION), impacts estimés, `confidenceLevel` |
| **Decision** | `createDecision`, `validateDecision`, `rejectDecision`, `archiveDecision`, `compareScenarios`, `computeDecisionConfidence` |
| **Priority** | corridors concurrents, `interventionUrgency` |
| **Risk** | risque systémique, propagation bornée |

Scores bornés [0–100].

## Scénarios déterministes

STABILIZATION_FIRST, DEPENDENCY_REDUCTION_FIRST, CONTINUITY_FIRST, SOVEREIGNTY_FIRST, PRESSURE_CONTAINMENT_FIRST, BALANCED_RECOVERY, SYSTEMIC_CONTAINMENT, TERRITORIAL_REBALANCING, SECTOR_REBALANCING, MINIMAL_INTERVENTION.

Aucune exécution automatique des scénarios.

## Double validation

Obligatoire pour : SYSTEMIC_CONTAINMENT, TERRITORIAL_REBALANCING, SECTOR_REBALANCING (`dualValidationRequired`).

## Gouvernance

- **Lecture** : `assertCorridorOperational(..., "operational_observation")`.
- **Mutation** : `assertEconomicArbitrationMutationAllowed()` — bloque TERMINATED / SUSPENDED / BLOCKED.
- Diagnostics : `mutationBlocked`, `arbitrationMutationRejected`, `corridorTerminated`, `governanceOperation`, `mutationSkippedReason`.

## Realtime

Événements `relational.arbitration.*` validés **avant** `relational.governance.*` :

- `relational.arbitration.conflict_detected`
- `relational.arbitration.scenario_generated`
- `relational.arbitration.decision_created`
- `relational.arbitration.priority_detected`
- `relational.arbitration.systemic_risk_detected`

Payload strict minimal ; `paymentExecutionDisabled` / `publicTrackingDisabled` sur tous les DTOs.

## API REST

Préfixe `/v1/relational-economic-arbitration/` — overview, conflicts, scenarios, priorities, history, critical-corridors, validate/reject decision, archive snapshot.

## Sources autorisées V1

Governance conflicts, recovery, sovereignty, continuity, macro-economic, supply-flow, pressure graph, geo-economic, sector, orchestration, simulations, scenario review, strategic memory, predictive risk, incidents, fulfillment metrics, dependency edges.

**Interdit** : GPS, wallet, marketing, scraping, social graph, tracking public.

## Limites V1

- Journal append-only — rétention à définir.
- Heuristiques de pondération (pas ML).
- Scénarios proposés sans application automatique.
- UI lecture + validation décisionnelle dans fulfillment (après governance).
