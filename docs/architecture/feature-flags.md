# Feature flag strategy

- **Authoritative rows**: `feature_flags` table (`flag_key`, `scope_type`, `scope_value`, `enabled`, `priority`).
- **Evaluation engine**: `@venext/shared-business-rules` `evaluateFeatureFlag` merges scopes present on a principal (global ∪ country ∪ region ∪ role facets ∪ company ∪ user) and picks the highest `priority` rule.
- **Dimensions**: global, country (`iso3166`), region (`code`), role facet, company (`organizationId`), user (`userId`).
- **Remote activation**: services load rules from Postgres on interval + ETag; clients receive compact bitmask via gateway after auth.
- **Example HTTP**: `wallet-service` `GET /v1/wallet/feature-flags/sample` demonstrates stacking global enable + targeted user disable.
