# Offline synchronization strategy

## Retailer / wholesaler mobile (`apps/mobile-retailer-wholesaler-flutter`)

- **SQLite cache** via `sqflite` tables `cache_entries` + `outbound_queue` (Drift migration path documented in code comments).
- **Dio** with `dio_smart_retry` exponential backoff tuned for unstable RTT.
- **Failed mutation capture**: interceptor enqueues idempotent-safe requests when `enqueue_on_fail` extra is set on requests.
- **Background sync**: `ResilientSyncEngine` coordinates warm-cache + future delta pulls scoped to relationship edges (not implemented yet by design).

## Industrial edge desktop (`apps/desktop-edge-sync`)

- **Rust + rusqlite** local `sync_queue` with serialized payloads + JSON `vector_clock` column for future CRDT/LWW merges.
- **Conflict resolver** (`src-tauri/src/conflict.rs`) picks strategy per `entity_kind`, aligned with `@venext/shared-business-rules` `ConflictResolutionStrategy`.
- **Resumable uploads**: `upload_checkpoints` table stores opaque cursors for multipart resumes.
