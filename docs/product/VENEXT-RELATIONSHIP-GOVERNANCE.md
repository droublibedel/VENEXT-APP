# VENEXT — Relationship governance (V1)

## Principe

Toute visibilité et action commerce passe par une **relation active** entre partenaires — pas d’accès catalogue ou commande sans lien relationnel validé.

## Mécanismes V1

### `commerce-access-control`

- Permissions relationnelles (lecture catalogue, commande, wallet, notifications…)
- Guards frontend + middleware BFF
- Messages d’erreur humains (« Accès réservé à ce partenaire »)

### `commercial-relationship-governance`

- États relation : invitation, active, suspendue…
- Pas de réseau ouvert type marketplace

### `commercial-context-routing`

- Contexte actif unique (commande, conversation, livraison…)
- Historique limité (5 entrées)
- Retour au flux commercial précédent

### Réseau professionnel

- Producteur ↔ Grossiste A : invitations, validation
- Terrain : discovery contacts, pas annuaire public

## Anti-patterns interdits

- Catalogue visible sans `relationshipId`
- Bypass guard « admin voit tout » en PROD terrain
- Partage type réseau social (followers, ranking public)

## Wording

- « Partenaire », « relation », « corridor », « réseau commercial fermé »
- Éviter : supply chain, ERP workflow, engagement social

## Audit

`auditFinalFeatureFlags` + `commerce-access-control` guards — voir `venext-v1-readiness`.
