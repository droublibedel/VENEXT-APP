import { Module, forwardRef } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationalOperationalIntelligenceModule } from "../relational-operational-intelligence/relational-operational-intelligence.module";
import { RelationalPredictiveRiskModule } from "../relational-predictive-risk/relational-predictive-risk.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalOperationalRecommendationController } from "./relational-operational-recommendation.controller";
import { RelationalOperationalRecommendationIngestionService } from "./relational-operational-recommendation-ingestion.service";
import { RelationalOperationalRecommendationParticipantGuard } from "./relational-operational-recommendation-participant.guard";
import { RelationalOperationalRecommendationPolicyService } from "./relational-operational-recommendation-policy.service";
import { RelationalOperationalRecommendationRealtimeService } from "./relational-operational-recommendation-realtime.service";
import { RelationalOperationalRecommendationService } from "./relational-operational-recommendation.service";
import { RelationalOperationalOrchestrationModule } from "../relational-operational-orchestration/relational-operational-orchestration.module";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalOperationalIntelligenceModule),
    forwardRef(() => RelationalPredictiveRiskModule),
    forwardRef(() => RelationalOperationalOrchestrationModule),
  ],
  controllers: [RelationalOperationalRecommendationController],
  providers: [
    RelationalOperationalRecommendationPolicyService,
    RelationalOperationalRecommendationService,
    RelationalOperationalRecommendationRealtimeService,
    RelationalOperationalRecommendationIngestionService,
    RelationalOperationalRecommendationParticipantGuard,
  ],
  exports: [RelationalOperationalRecommendationService, RelationalOperationalRecommendationIngestionService],
})
export class RelationalOperationalRecommendationModule {}
