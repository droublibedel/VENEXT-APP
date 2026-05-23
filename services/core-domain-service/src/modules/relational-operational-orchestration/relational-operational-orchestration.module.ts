import { Module, forwardRef } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalOperationalOrchestrationController } from "./relational-operational-orchestration.controller";
import { RelationalOperationalOrchestrationIngestionService } from "./relational-operational-orchestration-ingestion.service";
import { RelationalOperationalOrchestrationParticipantGuard } from "./relational-operational-orchestration-participant.guard";
import { RelationalOperationalOrchestrationPolicyService } from "./relational-operational-orchestration-policy.service";
import { RelationalOperationalOrchestrationRealtimeService } from "./relational-operational-orchestration-realtime.service";
import { RelationalOperationalOrchestrationService } from "./relational-operational-orchestration.service";
import { RelationalOperationalSimulationModule } from "../relational-operational-simulation/relational-operational-simulation.module";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalOperationalSimulationModule),
  ],
  controllers: [RelationalOperationalOrchestrationController],
  providers: [
    RelationalOperationalOrchestrationPolicyService,
    RelationalOperationalOrchestrationService,
    RelationalOperationalOrchestrationRealtimeService,
    RelationalOperationalOrchestrationIngestionService,
    RelationalOperationalOrchestrationParticipantGuard,
  ],
  exports: [RelationalOperationalOrchestrationService, RelationalOperationalOrchestrationIngestionService],
})
export class RelationalOperationalOrchestrationModule {}
