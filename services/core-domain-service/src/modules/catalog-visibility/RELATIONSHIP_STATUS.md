# Relationship status — canonical mapping (Instruction 9A)

## Persistent DB enum (`RelationshipStatus`)

| Prisma value   | Meaning |
|----------------|---------|
| `PENDING`      | Invitation not decided — **catalog denied** |
| `ACCEPTED`   | Active commercial edge — **catalog allowed** (subject to visibility rows + party checks) |
| `REJECTED`   | Invitation declined — **catalog denied** |
| `BLOCKED`    | Hard stop — **catalog denied** |
| `SUSPENDED`  | Paused / risk — **catalog denied** |

## UI wording

Do **not** persist UI labels in the database. If the product surface needs the word “active”, map **`ACCEPTED` → `active`** only in presentation layers (e.g. `relationshipStatusUi: rel.status === 'ACCEPTED' ? 'active' : rel.status.toLowerCase()`).

There is **no** `ACTIVE` enum member; `ACCEPTED` is the only canonical “live edge” state.

## Gates

All catalog / living-catalog paths must call `CatalogVisibilityEngineService.assertRelationshipAcceptedForCatalog()` (or equivalent) so non-`ACCEPTED` edges never load `product_visibility` rows.
