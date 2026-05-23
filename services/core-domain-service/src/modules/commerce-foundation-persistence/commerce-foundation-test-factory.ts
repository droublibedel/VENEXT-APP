import type { CommerceFoundationRepository } from "./commerce-foundation.repository";
import { CommerceFoundationService } from "./commerce-foundation.service";
import { ActorProfilePersistenceService } from "./services/actor-profile-persistence.service";
import { CommercialContextPersistenceService } from "./services/commercial-context-persistence.service";
import { CommerceActivityFeedPersistenceService } from "./services/commerce-activity-feed-persistence.service";
import { CommerceNotificationPersistenceService } from "./services/commerce-notification-persistence.service";
import { CommercialDeliveryPersistenceService } from "./services/commercial-delivery-persistence.service";
import { CommercialOrderPersistenceService } from "./services/commercial-order-persistence.service";
import { CommercialRelationshipPersistenceService } from "./services/commercial-relationship-persistence.service";
import { CommercialSettlementPersistenceService } from "./services/commercial-settlement-persistence.service";
import { CommerceMessagingPersistenceService } from "./services/commerce-messaging-persistence.service";
import { ProfessionalMailPersistenceService } from "./services/professional-mail-persistence.service";
import { RelationalCatalogPersistenceService } from "./services/relational-catalog-persistence.service";

export function createCommerceFoundationService(repo: CommerceFoundationRepository) {
  return new CommerceFoundationService(
    repo,
    new ActorProfilePersistenceService(repo),
    new CommercialRelationshipPersistenceService(repo),
    new RelationalCatalogPersistenceService(repo),
    new CommercialOrderPersistenceService(repo),
    new CommercialDeliveryPersistenceService(repo),
    new CommercialSettlementPersistenceService(repo),
    new CommerceMessagingPersistenceService(repo),
    new ProfessionalMailPersistenceService(repo),
    new CommercialContextPersistenceService(repo),
    new CommerceNotificationPersistenceService(repo),
    new CommerceActivityFeedPersistenceService(repo),
  );
}
