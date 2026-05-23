# Instruction 20.86-E — Validation

## Objectif

Verrouillage métier des 7 pôles Grossiste A, contenus réels, intelligence croisée VENEXT, gouvernance hiérarchique des liens d’activation (entreprise → pôle → utilisateur).

## Livrables

### Pôles officiels (7)

`PILOTAGE_COMMERCIAL`, `RESEAU_DISTRIBUTION`, `COMMANDES_ADV`, `LIVRAISON_RECEPTION`, `FINANCE_REGLEMENTS`, `RELATIONS_PARTENAIRES`, `SECURITE_GOUVERNANCE`

- Définition : `packages/enterprise-commercial-governance/src/grossiste-a-canonical-poles.ts`
- Alias legacy : `DIRECTION_COMMERCIALE` → `PILOTAGE_COMMERCIAL`, etc.

### Contenu métier par pôle

- `grossiste-a-pole-content.ts` — signaux, actions, seuils minimum
- `grossiste-a-commerce-signals.ts` — signaux partagés (commande retardée visible ADV + Livraison + Pilotage)
- `GrossisteAPoleBusinessSurface.tsx` — surface UI
- `auditEnterprisePoleContentIntegrity()` — détection pôles vides / KPI décoratifs

### Gouvernance des liens

- `buildEnterpriseRootLink()`, `buildPoleActivationLink()`, `buildCollaboratorInvitationLink()`
- `assertEnterpriseLinkIntegrity()`, `assertPoleLinkIntegrity()`, `assertInvitationHierarchy()`
- `assertInvitationActorConsistency()` — cohérence acteur / entreprise
- `revokeActivationLinkCascade()` — révocation descendante (archive entreprise)
- URL : `https://venext.co/e/{enterpriseSlug}/{poleSlug}/{secureToken}`
- Intégration : `activateEnterprisePole()` enregistre la hiérarchie pour `grossiste_a`

### Application Grossiste A

- `GrossisteAPoleBusinessBridge` — intelligence sur la vue d’ensemble
- Workspace `governance` + `GrossisteAGovernanceWorkspace`
- `CANONICAL.md` mis à jour (7 pôles)

### i18n (FR / EN / AR / ZH)

- `grossiste-a-pole-i18n.ts`
- `packages/venext-i18n/src/locales/*/navigation.json` — clés `PILOTAGE_COMMERCIAL`, etc.

### Tests

| Fichier | Tests |
|---------|-------|
| `grossiste-a-pole-86e.spec.tsx` | 93 |
| `grossiste-a-producer-separation-86c.spec.ts` | 74 (7 pôles) |
| Package `enterprise-commercial-governance` total | **428** exit 0 |

## Confirmations

- Aucun pôle vide (audit + `poleContentMeetsMinimum`)
- Aucun dashboard faux décoratif (`isDecorativeKpi`)
- Contenu métier réel par pôle
- Intelligence VENEXT visible (signaux partagés)
- Hiérarchie liens entreprise → pôle → utilisateur
- Séparation Producteur / Grossiste A respectée
- **Aucun commit git**

## Limitations restantes

- Données terrain encore partiellement simulées côté hooks BFF (`useGrossisteAOverviewData`) — les signaux métier sont structurés mais les valeurs live dépendent des APIs commerce.
- Tokens de lien : signature légère locale (`signLinkPayload`) — à renforcer côté infra (JWT/HMAC serveur) en production.
- Workspace `intelligence` reste distinct de `PILOTAGE_COMMERCIAL` dans la nav (même pôle métier) — fusion UX possible ultérieurement.

## Build

- `enterprise-commercial-governance` : `npm run build` + `npm test` ✓
- `commercial-context-routing` : type `governance` ajouté à `GrossisteAWorkspaceDestination`
- `web-grossiste-a` : build à valider localement après `npm install`
