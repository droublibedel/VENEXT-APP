# Relational Economic Governance & Multi-Corridor Strategic Coordination Intelligence (20.30)

## Philosophie

Couche **déterministe** de gouvernance économique relationnelle multi-corridor : observation des tensions systémiques, coordination des priorités, détection des conflits, équilibre analytique du réseau.

**Ce n’est pas un autopilot économique.** Aucune mutation commerciale ou logistique automatique.

## Pipeline d’ingestion

```
pressure → geo → sector → supply-flow → macro-economic → continuity → sovereignty → recovery → governance
```

`syncEconomicGovernanceState(relationshipId)` — appelé en `finally` après `syncEconomicRecoveryState`, avec `forwardRef`, garde anti-boucle et journalisation.

## Moteurs

| Moteur | Rôle |
|--------|------|
| **Coordination** | `governanceScore`, `coordinationScore`, corridors stratégiques, surcharge coordination, tensions systémiques |
| **Conflict** | recovery, dependency, pressure, propagation, territorial, sector, sovereignty, continuity |
| **Priority** | `governancePriorityScore`, `interventionUrgency`, `corridorCriticality`, `interventionWindow` |
| **Balance** | `balanceScore`, `coordinationPressure`, `corridorWeight`, `strategicImportance` |
| **Risk** | `systemicRisk`, `propagationPressure`, `governanceStability` |

Scores bornés [0–100]. DFS/BFS borné via `VENEXT_GOVERNANCE_MAX_DEPTH`.

## Gouvernance

- **Lecture** : `assertCorridorOperational(..., "operational_observation")`.
- **Mutation** : `assertEconomicGovernanceMutationAllowed()` — bloque TERMINATED / SUSPENDED / BLOCKED.

## Realtime

Événements `relational.governance.*` validés **avant** `relational.recovery.*` :

- `relational.governance.coordination_detected`
- `relational.governance.conflict_detected`
- `relational.governance.priority_detected`
- `relational.governance.systemic_risk_detected`
- `relational.governance.balance_updated`

## API REST

Préfixe `/v1/relational-economic-governance/` — overview, conflicts, priorities, balance, critical-corridors, systemic-pressure, history, archive-snapshot.

## Limites V1

- Snapshots append-only — rétention à définir.
- Heuristiques de pondération (pas ML).
- Conflits détectés sans résolution automatique.
- UI lecture seule dans fulfillment (après recovery).
