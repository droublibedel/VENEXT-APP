import { Module, forwardRef } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalScenarioReviewModule } from "../relational-scenario-review/relational-scenario-review.module";
import { RelationalOperationalSimulationController } from "./relational-operational-simulation.controller";
import { RelationalOperationalSimulationIngestionService } from "./relational-operational-simulation-ingestion.service";
import { RelationalOperationalSimulationParticipantGuard } from "./relational-operational-simulation-participant.guard";
import { RelationalOperationalSimulationPolicyService } from "./relational-operational-simulation-policy.service";
import { RelationalOperationalSimulationRealtimeService } from "./relational-operational-simulation-realtime.service";
import { RelationalOperationalSimulationService } from "./relational-operational-simulation.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalScenarioReviewModule),
  ],
  controllers: [RelationalOperationalSimulationController],
  providers: [
    RelationalOperationalSimulationPolicyService,
    RelationalOperationalSimulationService,
    RelationalOperationalSimulationRealtimeService,
    RelationalOperationalSimulationIngestionService,
    RelationalOperationalSimulationParticipantGuard,
  ],
  exports: [RelationalOperationalSimulationService, RelationalOperationalSimulationIngestionService],
})
export class RelationalOperationalSimulationModule {}
