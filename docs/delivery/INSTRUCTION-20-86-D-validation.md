# Instruction 20.86-D — Validation

## Livrable

Verrouillage final gouvernance grands comptes (20.86-A / 20.86-B / 20.86-C) :

| Module | Rôle |
|--------|------|
| `enterprise-runtime-security.ts` | `runEnterpriseSecurityCleanup`, `reactivateEnterpriseUserAccess` |
| `enterprise-navigation-lock.ts` | `invalidateEnterpriseNavigation`, historique effacé |
| `enterprise-private-routes.ts` | Routes privées non publiques |
| `enterprise-access-state.ts` | `resolveEnterpriseAccessState` (PENDING…REVOKED) |
| `enterprise-invitation-governance.ts` | Révocation, anti-réutilisation |
| `enterprise-trusted-device-governance.ts` | Historique, rotation, limite devices |
| `enterprise-pole-compatibility.ts` | `assertEnterprisePoleCompatibility` (20.86-C) |
| `enterprise-governance-audit.ts` | `auditEnterpriseGovernanceIntegrity` |
| `EnterpriseGlobalGovernanceControlPanel.tsx` | Contrôle VENEXT Global |
| Historique | `appendGovernanceHistoryEvent`, update/delete interdits |

## Feature flags (seed dev `true`)

- `enterprise_runtime_security_enabled`
- `enterprise_invitation_revocation_enabled`
- `enterprise_navigation_lock_enabled`
- `enterprise_append_only_history_enabled`

## Tests

`enterprise-runtime-security-86d.spec.ts` — **100** cas (cleanup, navigation, invitations, devices, sessions, history, séparation, audit).

## Confirmations

- Cleanup runtime sur suspension/archivage/remplacement
- Invitations non réutilisables
- Navigation verrouillée (sessionStorage)
- Historique append-only
- Messages sécurité humains (pas cyber-panique)
- **Aucun commit git**

## Limitations

- Cleanup commerce dépend de `commerce-performance-foundation` (localStorage en navigateur)
- Core `recordSecurityAction` persiste l’historique ; logique runtime complète côté package + back-office
- Flags PROD à `false` dans hooks apps tant que non synchronisés manuellement
