import { Module, forwardRef } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationalOperationalCollapseService } from "./relational-operational-collapse.service";
import { RelationalPredictiveRiskController } from "./relational-predictive-risk.controller";
import { RelationalPredictiveRiskIngestionService } from "./relational-predictive-risk-ingestion.service";
import { RelationalPredictiveRiskParticipantGuard } from "./relational-predictive-risk-participant.guard";
import { RelationalPredictiveRiskPolicyService } from "./relational-predictive-risk-policy.service";
import { RelationalPredictiveRiskRealtimeService } from "./relational-predictive-risk-realtime.service";
import { RelationalPredictiveRiskService } from "./relational-predictive-risk.service";
import { RelationalOperationalRecommendationModule } from "../relational-operational-recommendation/relational-operational-recommendation.module";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    forwardRef(() => RelationalOperationalRecommendationModule),
  ],
  controllers: [RelationalPredictiveRiskController],
  providers: [
    RelationalPredictiveRiskPolicyService,
    RelationalOperationalCollapseService,
    RelationalPredictiveRiskService,
    RelationalPredictiveRiskRealtimeService,
    RelationalPredictiveRiskIngestionService,
    RelationalPredictiveRiskParticipantGuard,
  ],
  exports: [
    RelationalPredictiveRiskService,
    RelationalPredictiveRiskIngestionService,
    RelationalOperationalCollapseService,
  ],
})
export class RelationalPredictiveRiskModule {}
