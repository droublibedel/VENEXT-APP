import { Module, forwardRef } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationalOperationalOrchestrationModule } from "../relational-operational-orchestration/relational-operational-orchestration.module";
import { RelationalStrategicMemoryModule } from "../relational-strategic-memory/relational-strategic-memory.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalScenarioReviewController } from "./relational-scenario-review.controller";
import { RelationalScenarioReviewIngestionService } from "./relational-scenario-review-ingestion.service";
import { RelationalScenarioReviewParticipantGuard } from "./relational-scenario-review-participant.guard";
import { RelationalScenarioReviewPolicyService } from "./relational-scenario-review-policy.service";
import { RelationalScenarioReviewRealtimeService } from "./relational-scenario-review-realtime.service";
import { RelationalScenarioReviewService } from "./relational-scenario-review.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalOperationalOrchestrationModule),
    forwardRef(() => RelationalStrategicMemoryModule),
  ],
  controllers: [RelationalScenarioReviewController],
  providers: [
    RelationalScenarioReviewPolicyService,
    RelationalScenarioReviewService,
    RelationalScenarioReviewRealtimeService,
    RelationalScenarioReviewIngestionService,
    RelationalScenarioReviewParticipantGuard,
  ],
  exports: [RelationalScenarioReviewService, RelationalScenarioReviewIngestionService],
})
export class RelationalScenarioReviewModule {}
