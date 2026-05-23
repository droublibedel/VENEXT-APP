# Relational Strategic Economic Stability & Corridor Continuity Intelligence (20.26)

## Philosophie

Couche **déterministe** de continuité économique relationnelle : stabilité structurelle, instabilité longue durée, récupération corridor, dépendances persistantes. Référence : Palantir × continuité macro-économique × intelligence corridor industrielle.

**Interdit** : LLM, autopilot, ERP, wallet, GPS, tracking public, marketplace, mutations commandes/fulfillment automatiques.

## Pipeline d’ingestion

```
pressure → geo → sector → supply-flow → macro-economic → continuity
```

`syncEconomicContinuityState(relationshipId)` — appelé en `finally` après `syncMacroEconomicState`, avec garde anti-boucle et `forwardRef`.

## Moteurs

| Moteur | Sorties |
|--------|---------|
| **Stability** | `continuityScore`, `corridorDurability`, `economicStability`, `instabilityRisk`, `continuityPressure`, `dependencyDurability`, `economicSurvivalProbability`, `recoveryProbability`, `systemicContinuityRisk` |
| **Dependency** | Durabilité depuis macro, mémoire stratégique, historique propagation, tendance snapshots |
| **Recovery** | DFS borné (`VENEXT_CONTINUITY_MAX_DEPTH`), `recoveryChains`, `recoveryDurationEstimate`, `continuityExposure` |
| **History** | Agrégat snapshots append-only pour `resilience-history` |

Tous les scores sont bornés 0–100 (probabilités 0.05–0.95) avec `diagnostics` JSON auditables.

## Sources autorisées

Macro-economic (nœuds + snapshots + événements propagation), supply-flow, geo-economic, sector intelligence, strategic memory, predictive risk, command center, orchestration, coordination, incidents, fulfillment, simulations, operational intelligence, scenario review, pressure graph.

## Gouvernance

- **Lecture** : `assertCorridorOperational(..., "operational_observation")` — TERMINATED reste lisible historiquement.
- **Mutation** : `assertEconomicContinuityMutationAllowed()` — bloque TERMINATED / SUSPENDED / BLOCKED.
- Diagnostics : `mutationBlocked`, `continuityMutationRejected`, `corridorTerminated`, `governanceOperation`, `mutationSkippedReason`.

## Realtime

Événements `relational.continuity.*` validés **avant** `relational.macro.*` à la gateway. Payload minimal Zod (`paymentExecutionDisabled`, `publicTrackingDisabled`).

## API REST

Préfixe `/v1/relational-economic-continuity/` — overview, instability-map, recovery-map, critical-corridors, systemic-pressure, resilience-history, archive-snapshot.

## Limites V1

- Snapshot créé à chaque sync (`CONTINUITY_SNAP:…:${Date.now()}`) — croissance table ; politique de rétention à définir.
- Pondérations heuristiques dans le moteur stability (coefficients documentés, pas ML).
- Propagation recovery limitée aux edges continuity persistés sur le corridor.
- UI : panel command-center compact (pas graphe interactif recovery).

## Heuristiques restantes

Coefficients de pondération macro / mémoire / tendance snapshot — calibrables en 20.26A sans changer le contrat API.
