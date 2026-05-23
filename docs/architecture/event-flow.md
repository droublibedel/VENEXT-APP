# Event flow (Kafka-ready)

1. Domain services emit `DomainEventEnvelope` (`@venext/shared-contracts`) into Kafka topics (naming convention: `venext.<bounded_context>.v1`).
2. `notification-service` exposes an HTTP ingest bridge (`POST /v1/events/ingest`) for sidecars during early rollout; later replaced by native consumers.
3. Downstream processors (push, email, partner webhooks) subscribe with idempotent handlers keyed by `eventId`.
4. `audit_events` captures governance actions in parallel for backoffice queries.

```mermaid
sequenceDiagram
  participant S as Service
  participant K as Kafka topic
  participant N as notification-service
  participant C as Consumer fleet
  S->>K: DomainEventEnvelope
  K->>N: (optional bridge/fan-in)
  N->>C: filtered fan-out
  S->>N: HTTP ingest (bootstrap)
```
