# Database foundation preview

Source of truth: `infrastructure/docker/postgres/migrations/001_foundation_schema.sql`.

## Entity groups

| Group | Tables |
| --- | --- |
| Identity | `users`, `organizations`, `user_organization_facets` |
| Relationship graph | `relationships`, `relationship_requests` |
| Relational catalog | `catalogs`, `products`, `catalog_products`, `product_visibility` |
| Commerce | `orders`, `negotiations` |
| Messaging | `messages` |
| Wallet | `wallets`, `transactions` |
| Geo / industrial | `geo_signals`, `industrial_poles` |
| Control plane | `feature_flags` |
| Observability | `audit_events`, `sync_sessions` |

## Relationship visibility rule

`product_visibility` binds a `product_id` to a `relationship_id`, enforcing **no open catalog**: SKUs surface only on approved graph edges.
