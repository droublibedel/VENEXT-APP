# Relational Institutional Economic Reporting & Strategic Intelligence Briefing (20.35)

## Philosophie

Couche **institutionnelle** de reporting stratégique : transformation des signaux exécutifs en rapports structurés, briefs corridor/institution/direction, snapshots consolidés, agrégation des risques systémiques.

**Non générative** : aucun LLM, aucun texte libre, aucun chatbot. Briefs produits par **templates déterministes** à partir de scores, seuils et diagnostics.

**Ce n’est pas un ERP.** Aucune modification de commandes, paiements, stocks ou workflows opérationnels.

## Pipeline d’ingestion

```
pressure → geo → sector → supply-flow → macro → continuity → sovereignty
→ recovery → governance → arbitration → stabilization → monitoring
→ executive-orchestration → institutional-reporting
```

`syncInstitutionalReportingState(relationshipId)` — appelé en `finally` après `syncExecutiveOrchestrationState`.

## Moteurs

| Moteur | Rôle |
|--------|------|
| **Engine** | `institutionalScore`, `executiveRisk`, `strategicResilience`, `systemicExposure`, pressions multi-couches, `strategicAlignmentScore` |
| **Brief** | EXECUTIVE_BRIEF, STRATEGIC_BRIEF, TERRITORIAL_BRIEF, SECTOR_BRIEF, SYSTEMIC_RISK_BRIEF, RESILIENCE_BRIEF, GOVERNANCE_BRIEF — templates uniquement |

## Realtime

Événements `relational.institutional_reporting.*` validés **avant** `relational.executive_orchestration.*`.

## Feature flags

- `relational_institutional_reporting_enabled`
- `relational_institutional_reporting_realtime_enabled`

DEV : true. PROD : false.

## Limites V1

- Templates textuels bornés (pas multilingue avancé).
- Journal append-only — rétention à définir.
- UI lecture seule dans fulfillment (après executive-orchestration).
