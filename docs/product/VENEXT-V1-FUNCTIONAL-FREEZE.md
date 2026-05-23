# VENEXT — Gel fonctionnel V1

**Date de gel :** instruction 20.86  
**Statut :** V1 fonctionnelle figée — aucune nouvelle fonctionnalité métier après ce document.

## Ce qui fait partie de V1

### Surfaces acteurs

| Acteur | Plateforme | Rôle |
|--------|------------|------|
| Producteur | Web industriel | Formel — intelligence & réseau B2B |
| Grossiste A | Web | Formel — distribution & réseau producteurs |
| Grossiste B | Mobile | Terrain — flux commercial structuré |
| Détaillant | Mobile | Terrain — boutique & commandes partenaires |

### Modules livrés

- Catalogues relationnels (`relational-commerce-catalog`)
- Commandes (`relational-order-orchestration`)
- Livraisons légères (`commercial-delivery-flow`)
- Règlements / wallet commerce (`commerce-wallet`, `venext-auth-foundation`)
- Notifications (`commerce-notifications`)
- Fil d’activité (`commercial-activity-feed`)
- Messagerie commerce terrain (`commerce-messaging`)
- Mail professionnel formel (producteur / grossiste A)
- Réseau commercial fermé (`professional-commercial-network`, discovery)
- Routing contextuel (`commercial-context-routing`)
- Offline léger (`commerce-offline-foundation`)
- Contrôle d’accès relationnel (`commerce-access-control`)
- i18n FR / EN / AR / ZH (`venext-i18n`)
- Guardrails & harmonisation UX / performance

### Philosophie produit finale

- **Commerce-first** — pas de jargon ERP, supply chain enterprise, ni social.
- **Relationship-first** — visibilité et accès par relation active.
- **Simplicité externe, sophistication interne** — terrain lisible en 3 secondes.
- **Réseau fermé** — pas de marketplace publique.
- **Refresh manuel** — pas de websocket ni polling agressif.

## Volontairement exclu de V1

- Marketplace publique ouverte
- Réseau social / feed engagement
- Cockpit ERP / dashboard analytics massif
- Application fintech autonome
- Super-app multi-vertical
- Websocket / temps réel agressif
- Orchestration logistique enterprise (WMS/TMS)
- Scoring crédit bancaire automatisé

## Prévu plus tard (post-V1)

- Expansion réseau ouverte (si stratégie validée)
- Analytics corridor avancés (hors cockpit froid)
- Intégrations bancaires profondes (hors wallet commerce léger)
- Optimisations device profiling terrain

## Règle après 20.86

**Interdit :** nouvelle fonctionnalité métier, nouvelle architecture lourde.  
**Autorisé :** correctifs, performance, sécurité, i18n, préproduction, déploiement.
