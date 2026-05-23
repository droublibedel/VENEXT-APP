# Instruction 20.79-A — Stabilisation backend/BFF & branchements live formels

## Statut

Stabilisation complétée. **Aucun commit git.**

## Corrections livrées

### 1. Hooks Producteur / Grossiste A
- `useProducerLiveData.ts` — catalog, orders, deliveries, mail, relationships → `/api/producer/*`
- `useGrossisteALiveData.ts` — gate `venext_bff_routes_enabled` + fallback silencieux
- Endpoints formels Grossiste A : `settlements`, `messaging`
- Proxy Next.js (industrial) + Vite (grossiste A)

### 2. Split services légers
- 9 `*PersistenceService` + `CommerceFoundationService` façade
- `CommerceFoundationEnvelopeMappers` pour mappers terrain/formels

### 3. Prisma industrialisé
- Migration `20260519120000_instruction_20_79_commerce_foundation`
- Scripts : `commerce:seed`, `commerce:reset`, `commerce:bootstrap`
- Doc : `docs/setup/commerce-foundation-local.md`

### 4. Fallback intelligent
- `resolveCommerceFallbackMode()` — LIVE | FALLBACK | HYBRID
- `resolvePersistenceAvailability()`
- `envelopeForMode()` — badge DEV, pas d’erreur brute

### 5. Contexte commercial
- `CommercialContextPersistenceService` — historique max 5 entrées, workspace, sous-onglet

## Confirmations

- Backend consolidé, BFF stabilisé
- Producteur + Grossiste A branchés sur commerce-bff
- Mocks fallback conservés
- Gouvernance relationnelle intacte (catalog `relationship_only`)
- Pas de marketplace globale, websocket, ERP, microservices lourds
