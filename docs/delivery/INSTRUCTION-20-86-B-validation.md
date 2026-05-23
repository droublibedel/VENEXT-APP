# Instruction 20.86-B — Gouvernance sécurité interne & archivage supervisé

## Livrable (complète 20.86-A)

Gouvernance **humaine et traçable** des accès industriels : rien ne se supprime physiquement, tout est archivé/suspendu/historisé avec note obligatoire.

## Package `enterprise-commercial-governance` (extension)

| Module | Rôle |
|--------|------|
| `enterprise-delete-guard` | `preventHardDelete`, `archiveInsteadOfDelete` |
| `enterprise-security-governance` | Actions sécurité, suspension/reprise/remplacement, archivage entreprise |
| `enterprise-governance-history` | Historique immuable |
| `enterprise-security-alerts` | Alertes IP/machine/tentatives/invitation |
| `enterprise-security-sessions` | Invalidation sessions formelles |
| `enterprise-security-i18n` | FR / EN / AR / ZH — wording public sans note interne |

## UI

- `EnterpriseInternalSecurityWorkspace` — pôle sécurité partenaire (non super-admin)
- `EnterpriseArchiveWorkflow` — archivage canal (VENEXT Global uniquement)
- `GovernanceDocumentAttachment` — justificatif PDF/scan
- `EnterpriseSecurityAlertsPanel` — alertes locales
- `EnterpriseGovernanceHistoryPanel` — historique

## Niveaux gouvernance

| Niveau | Peut |
|--------|------|
| **PARTNER_SECURITY** | Suspendre/réactiver/archiver/remplacer utilisateurs, devices, sessions |
| **VENEXT_GLOBAL** | + archiver/réactiver entreprise entière |

## Feature flags (dev `true`, prod `false`)

- `enterprise_security_governance_enabled`
- `enterprise_archive_workflow_enabled`
- `enterprise_internal_security_enabled`

## Backend

- `POST /commerce-foundation/enterprise/security/actions`
- `GET /commerce-foundation/enterprise/security/history`
- `GET /commerce-foundation/enterprise/security/alerts`
- BFF : `/api/enterprise/security/*`

## Confirmations

- **Rien ne se supprime** — garde-fous `preventHardDelete`
- Actions **motivées** — note ≥ 8 caractères obligatoire
- Message suspendu **public** sans motif interne
- Remplacement = **nouvel** `internalEnterpriseUserId`
- Partenaire **ne peut pas** archiver l’entreprise
- **Aucun commit git**

## Tests

- `enterprise-security-governance.spec.tsx` — **85+** cas

## Limitations

- Documents : métadonnée/nom fichier — pas de GED
- Alertes : heuristiques locales, pas SOC enterprise
- Core : enregistrement historique générique (pas Prisma dédié)
