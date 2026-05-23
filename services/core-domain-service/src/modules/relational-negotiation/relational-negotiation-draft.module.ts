import { Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { CommercialTrustModule } from "../commercial-trust/commercial-trust.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalNegotiationDraftController } from "./relational-negotiation-draft.controller";
import { RelationalNegotiationDraftRealtimePublishService } from "./relational-negotiation-draft-realtime-publish.service";
import { RelationalNegotiationDraftService } from "./relational-negotiation-draft.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    DomainRealtimeModule,
    PlatformAuthzModule,
    CommerceThreadAccessModule,
    CommercialTrustModule,
    RelationshipGovernanceModule,
  ],
  controllers: [RelationalNegotiationDraftController],
  providers: [RelationalNegotiationDraftService, RelationalNegotiationDraftRealtimePublishService],
  exports: [RelationalNegotiationDraftService, RelationalNegotiationDraftRealtimePublishService],
})
export class RelationalNegotiationDraftModule {}
