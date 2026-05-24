import { Module, forwardRef } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationalPredictiveRiskModule } from "../relational-predictive-risk/relational-predictive-risk.module";
import { RelationalOperationalIntelligenceController } from "./relational-operational-intelligence.controller";
import { RelationalOperationalIntelligenceIngestionService } from "./relational-operational-intelligence-ingestion.service";
import { RelationalOperationalIntelligenceParticipantGuard } from "./relational-operational-intelligence-participant.guard";
import { RelationalOperationalIntelligencePolicyService } from "./relational-operational-intelligence-policy.service";
import { RelationalOperationalIntelligenceRealtimeService } from "./relational-operational-intelligence-realtime.service";
import { RelationalOperationalIntelligenceService } from "./relational-operational-intelligence.service";
import { RelationalOperationalSlaService } from "./relational-operational-sla.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    forwardRef(() => RelationalPredictiveRiskModule),
  ],
  controllers: [RelationalOperationalIntelligenceController],
  providers: [
    RelationalOperationalIntelligencePolicyService,
    RelationalOperationalIntelligenceService,
    RelationalOperationalSlaService,
    RelationalOperationalIntelligenceRealtimeService,
    RelationalOperationalIntelligenceIngestionService,
    RelationalOperationalIntelligenceParticipantGuard,
  ],
  exports: [
    RelationalOperationalIntelligenceService,
    RelationalOperationalSlaService,
    RelationalOperationalIntelligenceIngestionService,
  ],
})
export class RelationalOperationalIntelligenceModule {}
