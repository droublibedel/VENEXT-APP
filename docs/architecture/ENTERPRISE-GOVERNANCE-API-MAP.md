# Cartographie API — Gouvernance enterprise VENEXT

## Familles

| Famille | Statut | Source de vérité | Usage |
|---------|--------|------------------|--------|
| **Enterprise Governance LIVE** | SOURCE OF TRUTH V1+ | Prisma + `core-domain-service` | Panels React, BFF pilotage, sync back-office |
| **Legacy CommerceFoundation** | LEGACY / COMPATIBILITY | Mémoire DEV / JSON historique | Compatibilité BFF ancien, à éviter pour nouveau code |

## A. Enterprise Governance LIVE (recommandé)

Base : `/v1/commerce-foundation/enterprise`

| Route | Rôle | Panels / consommateurs |
|-------|------|------------------------|
| `GET /channels` | Liste canaux | `EnterpriseGlobalGovernanceControlPanel`, pilotage entreprises |
| `GET /channels/:id` | Détail canal | `EnterpriseChannelWorkspaceLive` |
| `GET /channels/:id/poles` | Pôles activés | `EnterprisePoleActivationPanel` (via hooks) |
| `GET /channels/:id/invitations` | Invitations | Workspace sécurité interne |
| `GET /channels/:id/collaborators` | Collaborateurs | `EnterpriseInternalSecurityWorkspaceLive` |
| `GET /channels/:id/security-alerts` | Alertes | `EnterpriseSecurityAlertsPanel` |
| `GET /channels/:id/timeline` | Historique gouvernance | `EnterpriseGovernanceHistoryPanel` |
| `PATCH /channels/:id/status` | Archive / réactivation | Actions panel global |
| `GET /integrity/audit` | Audit intégrité live | Contrôle global |

Enveloppe réponse :

```json
{
  "payload": [],
  "dataSource": "LIVE",
  "fallbackUsed": false,
  "persistenceMode": "LIVE",
  "lastSyncAt": "ISO-8601"
}
```

## B. Legacy / CommerceFoundation (compatibilité)

| Route | Statut | Migration |
|-------|--------|-----------|
| `GET /commerce-foundation/enterprise/activation-queue` | LEGACY | Remplacer par file d’activation live |
| `POST /commerce-foundation/enterprise/security/actions` | LEGACY | Remplacer par `PATCH /channels/:id/status` + actions ciblées live |
| `GET /commerce-foundation/enterprise/security/history?enterpriseId=` | LEGACY | Remplacer par `/channels/:id/timeline` |
| `GET /commerce-foundation/enterprise/security/alerts?enterpriseId=` | LEGACY | Remplacer par `/channels/:id/security-alerts` |

**Log DEV** (uniquement) si un nouveau code appelle legacy :

`Enterprise governance legacy API used. Prefer enterprise-governance-live routes.`

## C. Package React `enterprise-commercial-governance`

| Module | Rôle |
|--------|------|
| `enterprise-governance-live-ui-client.ts` | Fetch LIVE + fallback mémoire explicite |
| `enterprise-governance-live-hooks.tsx` | Hooks panels avec badge source |
| `enterprise-governance-memory-fallback-adapter.ts` | **Seul** pont vers store mémoire pour UI |
| `enterprise-governance-api-contract.ts` | Résolution routes + statut LIVE/legacy |

**Interdit** : `import` direct de `enterprise-governance-storage` dans les fichiers `Enterprise*.tsx`.

## D. BFF back-office pilotage

Proxy : `/api/bff` → `commerce-bff` → core live.

Endpoints pilotage entreprises normalisés avec `payload` (voir PRIORITÉ-02).

## Migration prévue

1. Retirer les proxies legacy du BFF une fois tous les écrans sur hooks LIVE.
2. Conserver le store mémoire uniquement pour tests unitaires et seed DEV (`ENTERPRISE_GOVERNANCE_UI_FORCE_FALLBACK=1`).
