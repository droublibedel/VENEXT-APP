# Instruction 20.86-A — Gouvernance grands comptes & activation supervisée

## Livrable

Gouvernance industrielle crédible pour **Producteur** et **Grossiste A** : onboarding supervisé, canaux entreprise, activation des **pôles VENEXT existants uniquement**, liens sécurisés éphémères, validation humaine, devices/IP de confiance, sessions formelles (distinctes du terrain).

## Package `enterprise-commercial-governance`

| Module | Rôle |
|--------|------|
| `venext-canonical-poles` | Liste des pôles plateforme — `rejectUnknownPoleCreation()` |
| `enterprise-account-segments` | `SMALL_ACCOUNTS` vs `LARGE_ACCOUNTS` |
| `enterprise-secure-links` | Liens/codes, URLs `venext.co/e/{enterprise}/{pole}/{slug}` |
| `enterprise-formal-password` | `buildFormalPasswordStrength`, `validateFormalPassword` |
| `enterprise-formal-session` | Session stricte, expiration, inactivité |
| `enterprise-trusted-device` | approve / revoke / suspend |
| `enterprise-governance-storage` | Canal, pôles, collaborateurs, invitations |
| `enterprise-invitation-template` | Template mail (envoi manuel boîte VENEXT) |
| UI back-office | Workspace, timeline, contrat, activation, sécurité |

## Backend

- **Core** : `EnterpriseGovernancePersistenceService` + routes `/commerce-foundation/enterprise/*`
- **BFF** : `/api/enterprise/channels`, `/api/enterprise/poles/canonical`, `/api/enterprise/activation-queue`, `/api/enterprise/collaborators`

## Back-office

- Route : `/governance/enterprise-governance`
- Écran : `EnterpriseGovernanceScreen`

## Feature flags (seed dev `true`, hooks prod `false`)

- `enterprise_governance_enabled`
- `enterprise_secure_channels_enabled`
- `enterprise_controlled_onboarding_enabled`

## Confirmations philosophie

- Pas de création libre de pôles
- Pas d'inscription publique industrielle
- Pas d'IAM lourd / Azure AD / Active Directory
- Pas de sécurité bancaire absurde
- Séparation terrain (WhatsApp-like) / formel (session stricte)
- **Aucun commit git**

## Tests

- `enterprise-commercial-governance.spec.ts` — 75+ cas (pôles, liens, mot de passe, session, UI, i18n, segments)

## Build matrix

```bash
pnpm db:generate
pnpm --filter venext-auth-foundation build
pnpm --filter commerce-access-control build
pnpm --filter commercial-context-routing build
pnpm --filter commerce-notifications build
pnpm --filter enterprise-commercial-governance build
pnpm --filter core-domain-service build
pnpm --filter commerce-bff build
cd apps/web-industrial-nextjs && npm run build
cd apps/web-grossiste-a && npm run build
cd apps/backoffice-web && npm install && npm run build
pnpm --filter enterprise-commercial-governance test
```

## Limitations restantes

- Envoi mail : template généré côté app ; envoi réel depuis boîte VENEXT (hors scope automatisation SMTP)
- Scan contrat : upload UI ; OCR non implémenté (aperçu fichier uniquement)
- OTP téléphone : flux décrit ; provider SMS non branché en V1
- Persistance core : générique `CommerceFoundationRecord` ; pas de schéma Prisma dédié par entité
- PROD : flags à `false` jusqu'à validation commerciale réelle
