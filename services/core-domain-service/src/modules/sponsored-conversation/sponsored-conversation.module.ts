import { Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { SponsoredCommercialFlowService } from "./sponsored-commercial-flow.service";
import { SponsoredConversationEligibilityService } from "./sponsored-conversation-eligibility.service";
import { SponsoredConversationExpirationService } from "./sponsored-conversation-expiration.service";
import { SponsoredConversationRealtimePublishService } from "./sponsored-conversation-realtime-publish.service";
import { SponsoredDiscoveryController } from "./sponsored-discovery.controller";
import { SponsoredExposureAnalyticsService } from "./sponsored-exposure-analytics.service";
import { InternalSponsoredDiscoveryMaintenanceController } from "./internal-sponsored-discovery-maintenance.controller";
import { SponsoredRelationshipModerationHookService } from "./sponsored-relationship-moderation-hook.service";
import { SponsoredRelationshipSyncService } from "./sponsored-relationship-sync.service";
import { CommercialTrustModule } from "../commercial-trust/commercial-trust.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, DomainRealtimeModule, PlatformAuthzModule, CommerceThreadAccessModule, CommercialTrustModule, RelationshipGovernanceModule],
  controllers: [SponsoredDiscoveryController, InternalSponsoredDiscoveryMaintenanceController],
  providers: [
    SponsoredConversationEligibilityService,
    SponsoredCommercialFlowService,
    SponsoredConversationRealtimePublishService,
    SponsoredExposureAnalyticsService,
    SponsoredConversationExpirationService,
    SponsoredRelationshipSyncService,
    SponsoredRelationshipModerationHookService,
  ],
  exports: [
    SponsoredCommercialFlowService,
    SponsoredConversationEligibilityService,
    SponsoredExposureAnalyticsService,
    SponsoredConversationExpirationService,
    SponsoredRelationshipSyncService,
    SponsoredRelationshipModerationHookService,
  ],
})
export class SponsoredConversationModule {}
