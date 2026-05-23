# Sponsored commercial discovery (Instruction 20.2 / 20.2A)

## Principes

- Un **thread** `SPONSORED_DISCOVERY_THREAD` **n’est pas** une `Relationship` **ACCEPTED** : corridor temporaire, produit et campagne bornés.
- Une **négociation sponsorisée** **sans** relation **ACCEPTED** ne doit **jamais** recevoir `NegotiationStatus.ACCEPTED` : alignement de principe uniquement (`negotiationDraftMetadata` + statut restant sur la voie « proposé »).
- **Relation toujours requise** pour commandes relationnelles normales et conversion panier : `NegotiationToCartConverterService` appelle `assertConvertToCartAllowed`.
- **Surface catalogue** : `GET /v1/sponsored-discovery/campaign-product-surface/:campaignId` renvoie un **slice** produit + sponsor minimal **sans** passer par le bundle catalogue relationnel complet (pas de bump analytics).

## Fenêtre & unicité

- Réouverture (`open`) : si une fenêtre active existe **avec** au moins un fil, **réutilisation** (`existingWindowReused`) — anti double ouverture côté métier.
- Expiration **active** : `SponsoredConversationExpirationService.expireDueWindows` → état `SPONSORED_WINDOW_EXPIRED`, `temporaryConversationAllowed = false`, événement **`sponsored.window.expired`**, agrégat analytics `WINDOW_EXPIRED` (compteur via bucket `impressions` incrémenté).
- Route interne : `POST /v1/internal/v1/sponsored-discovery/maintenance/expire-due-windows` (clé `x-venext-internal-key`, voir section orchestration).

## Éligibilité

- Relations **BLOCKED**, **REJECTED**, **SUSPENDED** entre acteur et sponsor → refus (`prior_relationship_blocked` / `prior_relationship_rejected`).

## Demande de relation & synchro

- `SponsoredRelationshipRequest` : état terminal de synchro **`RELATIONSHIP_ACCEPTED_SYNCED`** lorsque la `Relationship` liée est déjà **ACCEPTED** (pas d’auto-accept : appel interne `POST .../sync-relationship` après décision humaine / gouvernance).
- Rejet / suspension / blocage relation → fenêtre `RELATIONSHIP_REJECTED`, requêtes `REJECTED_COMMERCIAL`.

## Analytics

- Clé stable `aggregationKey` + `eventType` + `updatedAt` : **upsert** par jour UTC et dimensions (campagne, sponsor, geo, catégorie acteur, type d’événement) pour limiter le bruit.

## Operational maintenance / orchestration (Instruction 20.2B)

- **Expiration** : `POST /v1/internal/v1/sponsored-discovery/maintenance/expire-due-windows`  
  - En-tête : `x-venext-internal-key` = `VENEXT_INTERNAL_SPONSORED_MAINTENANCE_KEY` **ou** à défaut `VENEXT_INTERNAL_REALTIME_KEY`.  
  - Appelle `SponsoredConversationExpirationService.expireDueWindows` (logs JSON `job: sponsored_expire_due_windows`).  
  - **Idempotence** : `updateMany` avec `state != SPONSORED_WINDOW_EXPIRED` — second passage : 0 ligne → pas d’analytics, pas d’événement WS.

- **Synchro relation (post-décision humaine)** : `POST /v1/internal/v1/sponsored-discovery/maintenance/sync-relationship` body `{ "relationshipId": "…" }`  
  - Même clé interne.  
  - Passe par **`SponsoredRelationshipModerationHookService.handleRelationshipModerationDecision`** : refuse si la relation est encore **PENDING** (aucune auto-acceptation).  
  - Puis `SponsoredRelationshipSyncService.syncFromRelationshipId` (fenêtre liée `relationshipId`, analytics upsert `RELATIONSHIP_ACCEPTED_SYNCED` / `RELATIONSHIP_REJECTED_SYNCED`, WS minimal `windowId` + `campaignId` + orgs + flags).

- **Pourquoi ce n’est pas automatique** : VENEXT ne doit pas accepter ni expirer « en silence » sans contrôle infra ; le cron ou le back-office **décide** quand lancer la maintenance.

- **Risque si cron absent** : fenêtres restent cohérentes côté **policy** lecture/écriture (`expiresAt`), mais l’état DB / WS / agrégats analytics ne convergent qu’à l’appel maintenance.

- **Garanties anti-marketplace** : routes **internes uniquement** ; payloads WS **sans** catalogue ni messages ; pas de mutation `Relationship` dans ces handlers.

## Risques résiduels

- La synchro relation dépend toujours d’un **appelant** (cron / back-office) invoquant la route **maintenance** (plus d’anciennes routes racine `…/sponsored-discovery/expire-due-windows` sans `/maintenance/`).
- Garde-fous **hors** `negotiation-engine` / `convert-to-cart` (autres créateurs d’`Order`) doivent être audités si de nouveaux chemins apparaissent.
