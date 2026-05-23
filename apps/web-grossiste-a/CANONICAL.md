# Grossiste A — Identité métier VENEXT (Instructions 20.86-C / 20.86-E)

## Rôle

Le **Grossiste A** est un **distributeur structuré** :

- orchestrateur territorial
- superviseur réseau
- pont industriel ↔ terrain

Ce n’est **pas** un producteur, une usine, ni un cockpit d’intelligence macro-économique.

## Pôles officiels (7 — Instruction 20.86-E)

| Pôle | Mission |
|------|---------|
| `PILOTAGE_COMMERCIAL` | Pilotage activité, tendances, alertes terrain |
| `RESEAU_DISTRIBUTION` | Grossistes B, détaillants, circulation produits |
| `COMMANDES_ADV` | Validation, suivi et litiges légers commandes |
| `LIVRAISON_RECEPTION` | Livraisons terrain, réceptions, livreurs |
| `FINANCE_REGLEMENTS` | Règlements relationnels (pas banque) |
| `RELATIONS_PARTENAIRES` | Gouvernance relationnelle partenaires |
| `SECURITE_GOUVERNANCE` | Accès internes, devices — pas VENEXT global |

## Pôles interdits (Producteur uniquement)

`PRODUCTION`, `USINE`, `SECURITE_INDUSTRIELLE`, `DATA_INTELLIGENCE_GLOBALE`, `PILOTAGE_INDUSTRIEL`, `PREVISION_INDUSTRIELLE`, `ANALYSE_MACRO_ECONOMIQUE`

## Gouvernance des liens d’activation

Hiérarchie obligatoire : **ENTREPRISE → PÔLE → UTILISATEUR**

- `buildEnterpriseRootLink()` — racine entreprise
- `buildPoleActivationLink()` — dérivé entreprise
- `buildCollaboratorInvitationLink()` — dérivé pôle
- URL : `venext.co/e/{enterpriseSlug}/{poleSlug}/{secureToken}`
- Révocation cascade : `revokeActivationLinkCascade()`

## Contenu métier

Package `enterprise-commercial-governance` :

- `grossiste-a-pole-content` — signaux et actions par pôle
- `grossiste-a-commerce-signals` — intelligence croisée VENEXT
- `auditEnterprisePoleContentIntegrity()` — pas de dashboard vide ni KPI décoratif
- `GrossisteAPoleBusinessSurface` — surface UI métier
