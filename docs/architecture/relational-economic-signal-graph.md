# Relational economic signal graph (Instruction 20.19)

Deterministic cross-corridor economic signal graph — operational correlation, propagation, and clusters. No LLM, wallet, public tracking, or social graph.

## Philosophy

- B2B corridor stress signals as a graph (nodes = corridors/clusters, edges = dependencies)
- Rule-based correlation and cascade projection — not ML embeddings
- Observation layer on top of strategic memory ingestion chain

## Pipeline

Operational stack → scenario review → strategic memory → **economic signal graph**

`RelationalStrategicMemoryIngestionService.syncForRelationship` chains into `RelationalEconomicSignalGraphIngestionService.syncForRelationship`.

## Graph model

- **Nodes**: corridor anchors (`CORRIDOR:{relationshipId}`), severity, propagation risk, fragility scores
- **Edges**: systemic dependencies between peer corridors of shared organizations
- **Clusters**: BFS-connected components on active edges
- **Propagation**: bounded cascade depth and collapse probability

## Governance

- Reads: `assertCorridorOperational(relationshipId, "operational_observation")`
- Mutations blocked on `TERMINATED` corridor
- Archive via `metadata.archived` (soft archive, not delete)

## Realtime

`relational.economic.*` — `signal_created`, `signal_correlated`, `cluster_detected`, `propagation_detected`, `systemic_risk_detected`, `signal_archived`

Gateway branch order: `relational.economic.*` before `relational.memory.*`.

Archive publishes `relational.economic.signal_archived` with journal `eventType: SIGNAL_ARCHIVED` — never `signal_created` on archive.

## 20.19A — Hardening

### openTasks (real)

`gatherStressSnapshot()` counts `RelationalFulfillmentTask` on `relationshipId` with statuses:

`OPEN`, `IN_PROGRESS`, `WAITING_EXTERNAL_CONFIRMATION`, `WAITING_CORRIDOR_VALIDATION`, `BLOCKED`

Excluded: `COMPLETED`, `CANCELLED`

Diagnostics on snapshot: `openTasksComputed`, `openTasksSource: RELATIONAL_FULFILLMENT_TASK`, included/excluded status lists.

### signal_archived

Dedicated realtime channel; minimal payload (ids, `eventType`, `propagationRisk`, scores, governance literals).

### Peer scan honesty (V1)

- `peerScanLimit: 15`, `peerScanMode: BOUNDED_V1`
- When candidates exceed limit: `peerScanLimitApplied: true`, warning `PEER_SCAN_BOUNDED_V1`
- Exposed on node diagnostics and `graph-overview` `diagnostics` field
- Not a complete network analysis — bounded by design

### Wording

Pole copy must not imply social graph, marketplace ranking, delivery tracking, wallet, or generative AI. Vocabulary: economic signal graph, corridor dependency, propagation analysis, operational cluster, systemic risk.

### Non-goals (unchanged)

No LLM, no wallet, no public tracking, no social graph, no automatic commerce mutations.

## Feature flags

- `relational_economic_signal_graph_enabled`
- `relational_economic_signal_graph_realtime_enabled`

## V1 limits

- Peer scan capped at 15 peers per sync (`BOUNDED_V1`) — see diagnostics for completeness ratio
- No payment execution or wallet linkage
