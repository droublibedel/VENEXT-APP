import { Module } from "@nestjs/common";

import { CommerceAccessGuardModule } from "../commerce-access-guard/commerce-access-guard.module";
import { GrossisteAPoleGuardModule } from "../grossiste-a-pole-guard/grossiste-a-pole-guard.module";
import { CommerceFoundationApiController } from "./commerce-foundation-api.controller";
import { CommerceFoundationRepository } from "./commerce-foundation.repository";
import { CommerceFoundationService } from "./commerce-foundation.service";
import { CommerceFoundationEnvelopeMappers } from "./commerce-foundation-envelope.mappers";
import { ActorProfilePersistenceService } from "./services/actor-profile-persistence.service";
import { CommercialContextPersistenceService } from "./services/commercial-context-persistence.service";
import { CommerceActivityFeedPersistenceService } from "./services/commerce-activity-feed-persistence.service";
import { CommerceOfflinePersistenceService } from "./services/commerce-offline-persistence.service";
import { EnterpriseGovernancePersistenceService } from "./services/enterprise-governance-persistence.service";
import { CommerceNotificationPersistenceService } from "./services/commerce-notification-persistence.service";
import { CommercialDeliveryPersistenceService } from "./services/commercial-delivery-persistence.service";
import { CommercialOrderPersistenceService } from "./services/commercial-order-persistence.service";
import { CommercialRelationshipPersistenceService } from "./services/commercial-relationship-persistence.service";
import { CommercialSettlementPersistenceService } from "./services/commercial-settlement-persistence.service";
import { CommerceMessagingPersistenceService } from "./services/commerce-messaging-persistence.service";
import { ProfessionalMailPersistenceService } from "./services/professional-mail-persistence.service";
import { RelationalCatalogPersistenceService } from "./services/relational-catalog-persistence.service";

@Module({
  imports: [CommerceAccessGuardModule, GrossisteAPoleGuardModule],
  controllers: [CommerceFoundationApiController],
  providers: [
    CommerceFoundationRepository,
    ActorProfilePersistenceService,
    CommercialRelationshipPersistenceService,
    RelationalCatalogPersistenceService,
    CommercialOrderPersistenceService,
    CommercialDeliveryPersistenceService,
    CommercialSettlementPersistenceService,
    CommerceMessagingPersistenceService,
    ProfessionalMailPersistenceService,
    CommercialContextPersistenceService,
    CommerceNotificationPersistenceService,
    CommerceActivityFeedPersistenceService,
    CommerceOfflinePersistenceService,
    EnterpriseGovernancePersistenceService,
    CommerceFoundationService,
    CommerceFoundationEnvelopeMappers,
  ],
  exports: [CommerceFoundationService, CommerceFoundationRepository],
})
export class CommerceFoundationPersistenceModule {}
