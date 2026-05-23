# Instruction 3 — validation checklist

## 1. ORM schema / entities

- **ORM:** Prisma 6 (`prisma/schema.prisma`)
- **Entities:** `User`, `Organization`, `OrganizationMember`, `Relationship`, `ContactSuggestion`, `NetworkCode`, `Catalog`, `Product`, `ProductVisibility`, `Order`, `OrderItem`, `Negotiation`, `MessageThread`, `Message`, `Wallet`, `Transaction`, `FeatureFlag`, `EconomicSignal`, `IndustrialPoleConfig`

## 2. Migrations generated

- Folder: `prisma/migrations/20260510180000_init_domain/migration.sql` (~597 statements)
- Lock: `prisma/migrations/migration_lock.toml`

## 3. Seed file

- `prisma/seed.ts` — deterministic UUIDs, Senegal demo graph (producer, WA, 2× WB, 3× retailers), products, visibility rows, orders, negotiation, threads/messages, economic signals, feature flags, wallets, transaction, industrial pole config.

## 4. Seed execution

```bash
export DATABASE_URL="postgresql://venext:venext@localhost:5432/venext"
cd "/Users/macbook/VENEXT APP"
pnpm db:migrate          # prisma migrate deploy
pnpm db:seed             # prisma db seed → tsx prisma/seed.ts
```

Requires Postgres reachable (e.g. `docker compose -f infrastructure/docker/docker-compose.yml up -d postgres`).

## 5. API service

- **Package:** `services/core-domain-service`
- **Port:** `3200` (override `PORT`)
- **Global prefix:** `/v1`

### Routes (read-mostly foundations)

| Area | Method | Path |
|------|--------|------|
| Health | GET | `/v1/health` |
| Users | GET | `/v1/users`, `/v1/users/:id` |
| Organizations | GET | `/v1/organizations`, `/v1/organizations/:id` |
| Relationships | GET | `/v1/relationships`, `/v1/relationships/:id` |
| Network codes | GET | `/v1/network-codes`, `/v1/network-codes/by-code/:code` |
| Catalogs | GET | `/v1/catalogs`, `/v1/catalogs/:id` |
| Products | GET | `/v1/products` (`organizationId`, `catalogId`, `relationshipId`), `/v1/products/:id` |
| Orders | GET | `/v1/orders`, `/v1/orders/:id` |
| Negotiations | GET | `/v1/negotiations`, `/v1/negotiations/:id` |
| Messages | GET | `/v1/messages/threads`, `/v1/messages/threads/:threadId/items` |
| Wallets | GET | `/v1/wallets`, `/v1/wallets/:id`, `/v1/wallets/:id/transactions` |
| Feature flags | GET | `/v1/feature-flags`, `/v1/feature-flags/:id` |
| Economic signals | GET | `/v1/economic-signals`, POST `/v1/economic-signals/capture` |
| Industrial poles | GET | `/v1/industrial-poles`, `/v1/industrial-poles/:id` |

## 6. Shared contracts

- `packages/shared-contracts/src/domain/enums.ts` — language + domain feature-flag keys
- `packages/shared-contracts/src/domain/api-shapes.ts` — Zod schemas (`UserPublicSchema`, `OrganizationPublicSchema`, `RelationshipEdgeSchema`, `FeatureFlagRowSchema`)

## 7. Legacy / superseded

- Raw SQL init scripts moved to `infrastructure/docker/postgres/_legacy/` (superseded by Prisma).
- Docker Postgres **no longer** auto-mounts SQL init scripts — apply schema with `pnpm db:migrate`.

## 8. Known gaps (explicit)

- Other Nest microservices (`catalog-service`, `wallet-service`, …) **still exist** as thin stubs; **`core-domain-service` is the canonical Prisma-backed domain API** for Instruction 3.
- No Nest **REST CRUD write** endpoints for users/orgs yet (read foundations + economic signal capture POST only).
- **Redis / Kafka** not wired to domain layer.
- **ContactSuggestion** model present; **no HTTP module** (not in required route list).
