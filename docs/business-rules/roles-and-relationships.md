# Roles & relationships

## Composable facets

Facets live in `@venext/shared-types` as `VENEXT_ROLE_FACETS`. Users hold `facets[]` per organization (`user_organization_facets` table). There is **no rigid isolation**: the same principal can be upstream wholesaler and downstream supplier simultaneously.

## Relationship engine

- Invitations + OTP onboarding (`auth-service` `/v1/identity/otp/challenge` foundation).
- Graph visibility enforced through `relationships` + `product_visibility` (see SQL migration).
- Contact-sync driven suggestions are modeled as `relationship_requests.channel` values (`CONTACT_SYNC`, `MANUAL`, `REFERRAL`).
