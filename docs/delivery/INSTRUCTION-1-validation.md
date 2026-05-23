# Instruction 1 — implementation validation

| Area | Evidence in repo |
| --- | --- |
| Monorepo layout | `/apps`, `/services`, `/packages`, `/infrastructure`, `/docs` |
| Core stacks | Flutter `pubspec` + `lib/` (run `flutter create .` on a supported SDK host to materialize `android/`/`ios/`); Next.js apps; NestJS services; Tauri+Vite+Rust edge |
| Bounded domains | Controllers/modules per service map to the 14 contexts |
| Role system | `@venext/shared-types` facets + SQL `user_organization_facets` |
| Relationship engine | `relationship-service` graph module + SQL visibility tables |
| Feature flags | SQL `feature_flags` + `@venext/shared-business-rules` evaluator + wallet sample route |
| AI simulation | `ai-gateway-service` provider pattern + mock provider |
| Multilingual foundation | `@venext/shared-i18n` bundles (`fr`, `en`, `ar`, `zh`) with commerce namespaces |
| Offline-first | Mobile SQLite queue + edge Rust sync tables + shared conflict types |
| Observability | Correlation interceptor, `audit_events`, `sync_sessions`, Prometheus stub |
| Database entities | `001_foundation_schema.sql` |
| API modules | `/v1/*` controllers across services |
| Realtime | `api-gateway` websocket gateway |
| Sync engine | Mobile `ResilientSyncEngine` + desktop `SyncEngine` |
| AI mock gateway | `MockAiProvider` registered via Nest DI token `AI_PROVIDER` |

## Build verification

- `pnpm install` (root) — workspace installs all Nest + packages + desktop Vite bundle.
- `pnpm run build` — `turbo` builds all TypeScript packages and services; desktop runs `vite build` (Rust `tauri build` available separately when `cargo` is installed).
