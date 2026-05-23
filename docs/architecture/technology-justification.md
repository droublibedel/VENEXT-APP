# Technology justification

| Layer | Choice | Why |
| --- | --- | --- |
| Mobile | Flutter + Riverpod + GoRouter + Dio | Single UI engine across low-end Android devices; predictable rebuild model; navigation + networking stacks are mature for offline-first commerce. |
| Local persistence | SQLite (`sqflite` now, Drift next) | Deterministic offline reads/writes; aligns with instruction to optimize for intermittent connectivity. |
| Web industrial | Next.js App Router + strict TS + Tailwind | Server components for data-heavy industrial dashboards; strict typing for contract-heavy domains. |
| Data fetching | TanStack Query | Cache + retry semantics complement gateway latency; avoids ad-hoc fetch layers. |
| Visualization | Mapbox GL + Recharts (+ D3 when needed) | Geo intelligence is first-class for logistics + industrial poles; Recharts covers standard telemetry, D3 reserved for bespoke overlays. |
| Edge desktop | Tauri + Rust + SQLite | Small runtime footprint vs Electron; Rust bridge for resumable uploads + conflict resolution close to metal. |
| Services | NestJS + PostgreSQL | Modular DI fits provider-swappable AI + event-driven growth; Postgres JSONB for commerce metadata without schema churn. |
| Events | Kafka (Docker) + Zod envelopes | Versioned payloads with correlation/causation IDs for auditability. |
| Cache / coordination | Redis | Session + rate limiting + feature flag snapshots (future). |
| Search | Elasticsearch-ready | Declared in supply/geo services as integration target without premature indexing code. |
| Object storage | S3-compatible | Attachments, manifests, bulk exports — named in architecture docs for industrial document exchange. |
