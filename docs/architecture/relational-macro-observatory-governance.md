# Relational Macro Strategic Observatory Governance (Instruction 20.43)

Couche analytique déterministe branchée après `relational-strategic-observatory` (20.42).

## Chaîne d'ingestion

`… → global-executive-supervision → strategic-observatory → macro-observatory-governance`

Hook : `relational-strategic-observatory-ingestion.service.ts` (`finally` → `syncMacroObservatoryGovernanceState`).

## API

Préfixe : `/v1/relational-macro-observatory-governance/`

## Realtime

Préfixe : `relational.macro_observatory_governance.*` — validé **avant** `relational.strategic_observatory.*` dans le gateway.

## Flags

- `relational_macro_observatory_governance_enabled` (DEV true, PROD false)
- `relational_macro_observatory_governance_realtime_enabled` (DEV true, PROD false)
