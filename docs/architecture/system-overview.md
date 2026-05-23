# VENEXT system overview

## Topology

```mermaid
flowchart LR
  subgraph clients
    M[Flutter mobile\nretailer/wholesaler]
    W[Next.js industrial]
    B[Next.js backoffice]
    D[Tauri edge desktop]
  end
  subgraph edge
    GW[API Gateway\nHTTP + WS]
  end
  subgraph services
    AUTH[auth-service]
    REL[relationship-service]
    CAT[catalog-service]
    ORD[order-service]
    MSG[messaging-service]
    WAL[wallet-service]
    GEO[geo-intelligence-service]
    ANA[analytics-service]
    AI[ai-gateway-service]
    NOT[notification-service]
    SUP[supply-monitoring-service]
    SP[sponsored-visibility-service]
  end
  subgraph data
    PG[(PostgreSQL)]
    RD[(Redis)]
    KF[Kafka-ready\nenvelopes]
    S3[S3-compatible\nobjects]
  end
  M --> GW
  W --> GW
  B --> GW
  D --> GW
  GW --> AUTH
  GW --> REL
  GW --> CAT
  GW --> ORD
  GW --> MSG
  GW --> WAL
  GW --> GEO
  GW --> ANA
  GW --> AI
  GW --> NOT
  GW --> SUP
  GW --> SP
  AUTH --> PG
  REL --> PG
  CAT --> PG
  ORD --> PG
  MSG --> PG
  WAL --> PG
  GEO --> PG
  NOT --> KF
  SUP --> KF
  ANA --> PG
```

## Principles encoded in this repo

- **Simplicity outside**: thin HTTP/WS edges, predictable health endpoints.
- **Sophistication inside**: composable roles, relationship-gated visibility, feature-flag dimensions, event envelopes.
- **African network reality**: mobile client uses aggressive retries; gateway records correlation + optional network hints; SQL schema supports lightweight geo signals without mandatory PostGIS in dev.
