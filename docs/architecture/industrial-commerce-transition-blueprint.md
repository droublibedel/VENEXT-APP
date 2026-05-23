# Industrial Commerce Transition Blueprint (Instruction 18.9)

**Status:** architecture / cartographie / audit — not an implementation spec for a new mega-module.  
**Scope:** préparer la transition entre le **noyau analytique industriel** (instructions 18.5 → 18.8) et les **blocs métier du commerce réel** VENEXT (producteurs, grossistes, détaillants, graphe relationnel, commandes, identité, messagerie, logistique, wallet, réputation).

**Principes directeurs:**

- Graphe commercial **fermé** (déjà affirmé en Prisma : « not ERP, not open marketplace »).
- **Audit-first** : distinguer schéma réel, code branché, UI démo, et heuristique symbolique.
- **Pas de duplication** de vérité : `Organization`, `Relationship`, `Order`, `Product` restent la colonne vertébrale transactionnelle ; les bundles analytiques sont des **projections** et des **registres** (preuve consultative 18.8), pas des ERP parallèles.

---

## 1. Synthèse exécutive

Le dépôt contient déjà une **ossature commerce relationnelle riche en Prisma** (organisations typées, relations dirigées, catalogues avec visibilité par relation, commandes, négociations, messagerie contextualisée, wallet/transactions, réservations, achats groupés, injections sponsorisées contrôlées, logistique `Shipment`, signaux `EconomicSignal`, états `ProductEconomicState`, mémoire analytique 18.2, etc.).

Le **noyau analytique industriel** vit principalement dans `services/core-domain-service` sous forme de **moteurs de compose** (propagation → coordination → command → situation room → continuité opérationnelle → evidence) et d’**applications web** :

- `apps/web-industrial-nextjs` — cockpit multi-pôles (symbolique / heuristique, disclaimers explicites).
- `apps/backoffice-web` — gouvernance limitée (routes sous `governance`).
- `apps/desktop-edge-sync` — **squelette Tauri** (health `sync_health`), pas encore une surface commerce offline.

**Il n’existe pas** d’application mobile dédiée (pas de `expo` / `react-native` dans les apps du monorepo). Toute stratégie « mobile-first » est donc **à construire** sur des contrats API et auth déjà partiellement centralisés.

**Lacune structurelle majeure pour « rendre l’analytique puissant » :** densifier et **qualifier** les données transactionnelles réelles (relations acceptées, commandes récentes, flux paiement/livraison, SKUs actifs avec visibilité relationnelle) **là où** les moteurs économiques lisent déjà Prisma (agrégats orders/negotiations/shipments/wallets/relationships). Sans ce socle, les cartes restent **cohérentes mais sous-alimentées** en volume réel.

---

## 2. Inventaire global (A → T)

Légende utilisée dans les tableaux : **R** = réel (persisté + services), **P** = partiel, **M** = mock / démo / symbolique dominant, **U** = peu ou pas branché UI, **X** = risque d’incohérence.

| ID | Domaine | Existe | Partiel / mock | Branché UI | Notes |
|----|---------|--------|------------------|------------|--------|
| **A** | Producteurs / industriels | **R** | P | P | `OrganizationCategory.PRODUCER` + `INDUSTRIAL_PRODUCER` ; preuve industrielle réservée producteur (18.8). |
| **B** | Grossistes A | **R** | P | P | `WHOLESALER_A` ; matrice de compatibilité graphe (`compatibility-matrix`). |
| **C** | Grossistes B | **R** | P | P | `WHOLESALER_B` ; même mécanisme d’arête dirigée. |
| **D** | Détaillants | **R** | P | P | `RETAILER` ; downstream des arêtes typiques. |
| **E** | Relations commerciales | **R** | P | P | `Relationship` + `RelationshipStatus` (+ SUSPENDED 9) + `trustLevel` float + `visibilityPermissions` JSON. **19.1A** : bundle officiel `CommercialRelationshipGraphEngineService` (`modules/commercial-relationship-graph/`) ; traversée HTTP / partners pack = `RelationalCommerceNetworkTraverserService` (`relational-commerce/`). `RelationshipService`. |
| **F** | Catalogues | **R** | P | P | `Catalog` + `CatalogType` + `CatalogVisibilityMode` ; visibilité produit `ProductVisibility`. |
| **G** | Commandes | **R** | P | P | `Order` / `OrderItem` liés à `relationshipId` — modèle **relationnel-first** solide. |
| **H** | Négociation | **R** | P | U | `Negotiation` avec modes de paiement ; threads possibles. |
| **I** | Wallet / paiements | **R** | P | U | `Wallet`, `Transaction` (statuts, idempotency, metadata) ; pas PSP réel documenté ici. |
| **J** | Logistique | **R** | P | U | `Shipment` (15A) : statuts santé, `EDGE_SYNC` mode — pont desktop/edge **prévu**. |
| **K** | Identité commerciale | **R** | P | P | `commercialId` 10 chiffres immuable ; badges `commercialBadges` ; vérif `verificationStatus`. |
| **L** | Réputation / scoring | **P** | **M** | U | `credibilityScore` org + `trustLevel` relation + scores `ProductEconomicState` — **heuristiques** ; calibrage métier non prouvé. |
| **M** | Messaging | **R** | P | U | `MessageThread` / `Message` / `PendingOutboundMessage` — commerce-contextuel, pas réseau social ouvert. |
| **N** | Notifications | **P** | **M** | U | Pas de modèle `Notification` Prisma dédié repéré ; signaux temps réel domaine côté gateway/core. |
| **O** | Realtime | **R** | P | P | `DomainRealtimeModule` + contrôleurs `internal-*-domain` dans `api-gateway` ; publications par pôle (economic command, evidence, etc.). |
| **P** | Mobile | **—** | **M** | **—** | **Aucune app mobile** dans le repo ; seulement web + desktop squelette. |
| **Q** | Web | **R** | P | P | `web-industrial-nextjs` (industriel) + `backoffice-web` (gouvernance). |
| **R** | Desktop edge / offline | **P** | **M** | U | Tauri + `sync_health` ; pas de sync commerce documentée dans le code analysé. |
| **S** | Feature flags | **R** | P | P | Table `FeatureFlag` + `CanonicalFeatureFlagEvaluator` — garde-fous par org/pôle. |
| **T** | Sécurité / permissions | **R** | P | P | `VenextAuthzGuard`, scopes producteur pour evidence, catégories Prisma pour contrôleurs data-intelligence / propagation. |

---

## 3. Cartographie des acteurs (données & code)

### 3.1 Modèle Prisma (extrait conceptuel)

- **`User`** — téléphone unique, statut, langue ; propriétaire d’orgs.
- **`Organization`** — cœur identité : `commercialId`, `actorType`, `category`, scores/badges, gouvernance.
- **`OrganizationMember`** — `OrgMemberRole`, `OrgMemberPole`, rattachement utilisateur ↔ org.
- **`Relationship`** — arête commerciale **invitée puis acceptée** avec direction `upstream` / `downstream` optionnelle jusqu’à acceptation.
- **Commerce** — `Catalog`, `Product`, `ProductVisibility`, `Order`, `OrderItem`, `Negotiation`, `ReservationIntent`, `GroupBuyingSession`, `SponsoredProductInjection`.
- **Messagerie** — `MessageThread` (types liés produit / commande / négociation), `Message`, file `PendingOutboundMessage`.
- **Wallet** — `Wallet`, `Transaction`.
- **Logistique** — `Shipment` liée `Order` et/ou `Relationship`.
- **Intelligence produit** — `ProductEconomicState`, `EconomicSignal`, `ProductTraceability`, `RecallEvent`.
- **Analytique 18.2** — `EconomicEventMemory`, `EconomicPropagationMemory`, `EconomicCrisisSignature`, `EconomicTemporalSnapshot`.
- **Contrôle** — `FeatureFlag`, `IndustrialPoleConfig`, `BackofficeAuditLog`.

### 3.2 Rôles métier vs artefacts système

| Acteur métier | Support Prisma / code | Commentaire |
|---------------|------------------------|-------------|
| Producteur industriel | `PRODUCER` + `INDUSTRIAL_PRODUCER` | Accès preuve industrielle ; bundles industrial. |
| Grossiste A / B | `WHOLESALER_A` / `WHOLESALER_B` | Distinction catégorielle pour graphe dirigé. |
| Détaillant | `RETAILER` | Downstream ; visibilité catalogue relationnelle. |
| Administrateur | `INTERNAL_ADMIN` / `BACKOFFICE` | Backoffice + audit logs. |
| Analyste / opérateur | `OrgMemberRole` + `OrgMemberPole` | Pôles métiers (COMMERCIAL_NETWORK, ORDERS_ADV, …) — **capacité** RBAC, à aligner UI mobile/web. |
| Opérateur logistique | `Shipment`, supply pole | Supervision 15A ; edge sync **prévu**. |
| Cellule exécutive | Economic Command + Situation Room | **Lecture** transverse symbolique/heuristique ; pas d’exécution. |

### 3.3 Routes & surfaces (vue macro)

- **`core-domain-service`** — modules Nest listés dans `app.module.ts` : commerce de base (users, orgs, graph, catalogs, products, orders, negotiations, messages, wallets) + **intelligence** par pôle + **moteurs économiques** + industrial evidence.
- **`api-gateway`** — contrôleurs `internal-*-domain` pour fan-out temps réel vers bundles industriels (non exhaustif des routes commerce HTTP publiques — vérifier gateway public pour mobile futur).
- **`web-industrial-nextjs`** — BFF sous `src/app/api`, pôles dans `src/poles/*` alignés sur `POLE_REGISTRY`.
- **`backoffice-web`** — gouvernance (pause sponsors, etc. selon instructions 10).
- **`desktop-edge-sync`** — placeholder Tauri.

---

## 4. Analyse des plateformes

| Plateforme | État | Rôle cible | Contraintes |
|------------|------|-------------|-------------|
| **Web industriel** | Réalisé (Next 15) | Cockpit cartographique multi-pôles | Reste **naturel** pour cartes denses, disclaimers, preuve 18.8. |
| **Mobile commerce** | **Absent** | Scan QR relation, messagerie terrain, preuve légère | Exiger **contrats** stables (`commercialId`, threads, orders summary) ; **ne pas** porter toute la géométrie symbolique. |
| **Desktop edge** | Squelette | Sync logistique / preuve locale / offline | `ShipmentTrackingMode.EDGE_SYNC` préfigure ; implémenter **filet de sécurité** anti-double-écriture avec core. |
| **APIs realtime** | Partiel | Signaux `live.*` / `demo.*` | Risque **faux temps réel** si démo mélangée sans classification UI (déjà traité sur certains pôles). |
| **Sync offline** | Non implémenté | Queue messages + états logistiques | Dépend messagerie + `PendingOutboundMessage` + politique conflit. |
| **Upload média** | Schéma (`mediaUrls`, `voiceUrl`) | Preuves conversationnelles | Besoin stockage objet + antivirus + quotas — hors scope actuel documenté. |
| **Cache local** | TTL côté serveur (bundles) | Mobile doit cache **read models** | Ne pas dupliquer la vérité commande. |
| **WebSocket** | Présent via gateway/domain | Abonnements par org | Sensibilité auth basse consommation (mobile low-end). |
| **Feature flags multi-plateformes** | DB + evaluateur | Même clés org-scoped | Mobile devra appeler **même** sémantique de flags ou recevoir snapshot signé. |

**Règles de placement (recommandation) :**

- **Web-only** : visualisations symboliques lourdes, evidence bundle complet, coordination multi-pôle dense.
- **Mobile-first** : invitation/acceptation relation, file d’ordres et paiements **résumés**, scan `commercialId`, alertes logistiques.
- **Offline-first** : preuve de livraison, capture statut chargement, file messages — **pas** le compose economic-command complet.
- **Jamais sur mobile** (sans garde-fous) : compose nested propagation+scenarios coûteux ; projection full audit.

---

## 5. Modules métier — maturité & dépendances

| Module | Maturité schéma | Maturité service | UI industrielle | Dépendances clés | Risque |
|--------|-----------------|------------------|-----------------|------------------|--------|
| Commandes | **Élevée** | **Moyenne** | Via pôle orders-adv / data cross-cut | `Relationship` actif | Commandes orphelines de relation (détecté en DI graph). |
| Catalogues | **Élevée** | **Moyenne** | Marketing / data | Visibilité relationnelle | JSON `visibilityPermissions` peu audité côté UI. |
| Stock | **Moyenne** | **Moyenne** | `stockStatus` / `stockQuantity` | Produit | Peut diverger de logistique réelle sans `Shipment`. |
| Wallet | **Élevée** | **Inconnue PSP** | Finance pole | Transactions | Crédibilité si pas de rails paiement réels. |
| Paiements | Enum + statuts order | **Partiel** | — | Wallet | Mode cash/POD ≠ intégration acquéreur. |
| Réseau commercial | **Élevée** | **Moyenne** | Pôle commercial-network | Graphe + suggestions | Suggestions = heuristique (`ContactSuggestion`). |
| Invitations | **Élevée** | **Moyenne** | — | `NetworkCode`, QR flow | Bon modèle fermé. |
| Scoring | **Moyenne** | **Heuristique** | Data-intelligence | Multiples floats | **Sur-interprétation** commerciale / industrielle. |
| QR | **R** (policy join) | **Moyenne** | — | Relationship | Bon pivot mobile futur. |
| Messaging | **Élevée** | **Moyenne** | — | Threads | Queue unstable — bon pour mobile flaky. |
| Livraison | **R** (Shipment) | **Partielle** | Supply pole | Order | Edge sync à câbler. |
| Supply | **R** | **Moyenne** | Pôle supply | Shipments, stock | Cohérence avec orders. |
| Notifications | **Faible** | **M** | Realtime events | WS | Pas de table dédiée ; push mobile à définir. |
| Analytics métier | **R** bundles | **Élevée** lecture | Tous pôles | Prisma agrégats | **Sous-alimentation** si peu de transactions. |

---

## 6. Relation noyau analytique ↔ commerce

### 6.1 Chaîne de compose (rappel)

`EconomicCommand` → consomme `EconomicPropagationEngineService.compose` puis `EconomicCoordinationEngineService` (+ mémoire, data-intelligence embarqués selon flags).  
`IndustrialSituationRoom` / `IndustrialOperationalContinuity` → digest des bundles upstream.  
`IndustrialEvidence` → **registre** agrégat (18.8A) sur bundles existants, **pas** nouvelle vérité transactionnelle.

### 6.2 Où les « vraies » données commerce entrent

Les services de propagation / data-intelligence / scores utilisent des **types Prisma** (`PaymentStatus`, `DeliveryStatus`, `NegotiationStatus`, `ShipmentStatus`, `WalletStatus`, `RelationshipStatus`, etc.) — donc la **télémétrie économique** est conçue pour **refléter** le graphe et les flux réels **quand** ces tables sont peuplées.

### 6.3 Symbolique vs heuristique vs réel

| Couche | Nature des données | Exemple |
|--------|-------------------|---------|
| **Réel** | Lignes Prisma transactionnelles | Orders payés, relations `ACCEPTED`, wallets, shipments créés. |
| **Heuristique** | Agrégats / scores / bundles | `ProductEconomicState`, pressions economic-command, graph-intelligence. |
| **Symbolique** | Géométrie carte / scénarios | Scenarios, coordination, situation room cells — **non MES**. |
| **Démo** | Temps réel classé `demo.*` | Ticks synthétiques si activés. |
| **Manquant** | Mobile, notifications persistées, PSP, offline sync | Bloque « puissance » perçue sur le terrain. |

### 6.4 Ce qu’il faut construire pour « rendre l’analytique puissant »

1. **Alimenter** le cycle relation → catalogue visible → commande → paiement/livraison avec **données réelles** (même modestes) sur orgs producteurs pilotes.  
2. **Contrats read models** stables pour mobile (JSON réduits, pas bundles industriels complets).  
3. **Ligne directe** entre `Shipment` / `Order` et signaux affichés (éviter décalage conceptuel stock vs mouvement).  
4. **Gouvernance** des scores (`credibilityScore`, `trustLevel`) — documentation métier + plafonds UI (déjà philosophie 18.8A pour preuve).

---

## 7. Priorisation — prochain bloc métier recommandé

**Recommandation : consolider le « Commercial Relationship Graph + identité commerciale » comme prochain socle**, avant d’industrialiser catalogues relationnels avancés ou wallet production.

**Arguments :**

- **Technique :** `Relationship` est déjà la **clé étrangère** de `Order`, visibilité produit, group buying, réservations, shipments optionnels — c’est le **joint** entre tout le reste.
- **Architectural :** évite doubles graphes ; data-intelligence et propagation **consomment** déjà ces arêtes.
- **Produit :** sans relations acceptées stables, catalogues et commandes restent **démonstratifs**.
- **Mobile / web :** `commercialId` + QR + invitation sont le **plus petit dénominateur** transportable mobile.
- **Performance :** agrégats actuels font des `take: N` (ex. 800 relations) — un produit « graph » explicite permettra d’optimiser **volontairement** (pagination, vues matérialisées) sans toucher aux moteurs 18.x.
- **Cohérence analytique :** economic-command / evidence deviennent **vérifiables** contre un graphe dense (non causaux mais **ancrés**).

**Secondaire ensuite :** « Catalogues relationnels » (visibilité + SKU + médias) puis « Commandes relationnelles » (états + réservation + logistique), puis wallet/PSP sous contrôle gouvernance.

---

## 8. Risques (architecture, performance, crédibilité)

| Risque | Manifestation | Mitigation |
|--------|---------------|------------|
| Duplication de vérité | Deux « order views » divergentes | Single write path Prisma ; bundles read-only. |
| Faux temps réel | Démo perçue comme production | Classification événements + flags (pattern déjà entamé). |
| Couches redondantes | Nouveau « intelligence » parallèle | Réutiliser data-intelligence + evidence. |
| Dette JSON | `visibilityPermissions`, `metadata` | Schémas Zod côté API + validation stricte progressive. |
| Prisma | Requêtes lourdes cross-join | Vues read, limites, index (déjà index sur relations/orders). |
| WebSocket | Auth + reconnect | Tokens subscribe déjà côté web industrial — généraliser. |
| Mobile low-end | Gros bundles | Endpoints summary dédiés (pattern bundle-first 18.8A). |
| Offline | Conflits double statut | Idempotency clés transactions + horodatage edge. |
| UX | Cockpit vide | Seuils « empty state » honnêtes (aligné 18.8A crédibilité). |
| Crédibilité industrielle | Scores interprétés comme preuve | Evidence layer + docs 18.8 / 18.9. |

---

## 9. Ordre d’implémentation suggéré (post-blueprint)

1. **Read API** « commerce core » versionnée : org self + partners + orders récents + threads actifs (pagination).  
2. **Durcissement** validation `visibilityPermissions` + audit trail minimal côté relation.  
3. **Mobile shell** (nouvelle app) consommant uniquement ces read APIs + QR join.  
4. **Catalogue relationnel** : parcours acheteur authentifié avec preuve de relation.  
5. **Commande** : états + réservation + message thread verrouillé.  
6. **Logistique** : liaison `Shipment` événements temps réel.  
7. **Wallet** : intégration PSP derrière feature flag + idempotency.  
8. **Réputation** : politique de calcul documentée + plafonds UI.

---

## 10. Corrections architecturales **avant** la phase massive commerce

1. **Inventaire officiel des flags** consommés par chaque moteur 18.x — éviter surprises à l’activation mobile.  
2. **Politique média** (stockage, PII, rétention) avant d’ouvrir upload massif sur messagerie.  
3. **Décision** sur table `Notification` vs événements WS-only — impact mobile.  
4. **Alignement** `credibilityScore` / `trustLevel` / scores produit : document unique « non preuve judiciaire ».  
5. **Gateway public** : cartographier toutes les routes exposées au client léger (pré-requis mobile).

---

## 11. Références code (ancrage)

- Schéma relationnel : `prisma/schema.prisma` (ligne d’ouverture + modèles `Organization`, `Relationship`, commerce, wallet, shipment, messaging, 18.2 memories).
- Noyau serveur : `services/core-domain-service/src/app.module.ts`.
- Graphe commercial : `modules/relational-commerce/commercial-relationship-graph-engine.service.ts`, `graph/relationship/relationship.service.ts`.
- Compose analytique : `modules/economic-command/economic-command-engine.service.ts` (dépendances propagation/coordination).
- Preuve industrielle : `modules/industrial-evidence/*` + `docs/architecture/industrial-evidence-layer-notes.md`.
- Apps : `apps/web-industrial-nextjs`, `apps/backoffice-web`, `apps/desktop-edge-sync`.

---

## 12. Conclusion

VENEXT dispose déjà d’un **modèle commerce relationnel crédible et rarement sur-dimensionné en schéma** ; le gap principal est **produit / plateforme** (mobile, offline, notifications, PSP) et **densité de données réelles** pour nourrir les moteurs 18.x sans trahir la promesse heuristique.

La transition industrielle → commerce réel doit **s’appuyer sur le graphe et l’identité commerciale**, puis enrichir catalogues et commandes, **sans** dupliquer la vérité dans les bundles analytiques.

---

*Document généré dans le cadre de l’instruction 18.9 — lecture / audit / cartographie. Aucun gros moteur métier ajouté.*
