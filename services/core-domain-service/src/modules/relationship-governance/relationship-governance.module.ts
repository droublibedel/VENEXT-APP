import { Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CorridorTrustInfluenceService } from "./corridor-trust-influence.service";
import { InternalRelationshipIntelligenceController } from "./internal-relationship-intelligence.controller";
import { RelationshipGovernancePolicyService } from "./relationship-governance-policy.service";
import { RelationshipGovernanceQueryService } from "./relationship-governance-query.service";
import { RelationshipGovernanceRealtimePublishService } from "./relationship-governance-realtime-publish.service";
import { RelationshipGovernanceService } from "./relationship-governance.service";
import { RelationshipIntelligenceAccessGuard } from "./relationship-intelligence-access.guard";
import { RelationshipIntelligenceController } from "./relationship-intelligence.controller";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, DomainRealtimeModule, PlatformAuthzModule],
  controllers: [RelationshipIntelligenceController, InternalRelationshipIntelligenceController],
  providers: [
    RelationshipGovernancePolicyService,
    RelationshipGovernanceService,
    RelationshipGovernanceQueryService,
    RelationshipGovernanceRealtimePublishService,
    CorridorTrustInfluenceService,
    RelationshipIntelligenceAccessGuard,
  ],
  exports: [
    RelationshipGovernanceService,
    RelationshipGovernancePolicyService,
    CorridorTrustInfluenceService,
    RelationshipGovernanceQueryService,
  ],
})
export class RelationshipGovernanceModule {}
