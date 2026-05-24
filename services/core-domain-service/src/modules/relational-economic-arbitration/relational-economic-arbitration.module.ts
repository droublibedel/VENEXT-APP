import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalEconomicGovernanceModule } from "../relational-economic-governance/relational-economic-governance.module";
import { RelationalEconomicStabilizationModule } from "../relational-economic-stabilization/relational-economic-stabilization.module";
import { RelationalEconomicArbitrationController } from "./relational-economic-arbitration.controller";
import { RelationalEconomicArbitrationConflictService } from "./relational-economic-arbitration-conflict.service";
import { RelationalEconomicArbitrationCorridorContextService } from "./relational-economic-arbitration-corridor-context.service";
import { RelationalEconomicArbitrationDecisionService } from "./relational-economic-arbitration-decision.service";
import { RelationalEconomicArbitrationGuard } from "./relational-economic-arbitration.guard";
import { RelationalEconomicArbitrationIngestionService } from "./relational-economic-arbitration-ingestion.service";
import { RelationalEconomicArbitrationPolicyService } from "./relational-economic-arbitration-policy.service";
import { RelationalEconomicArbitrationPriorityService } from "./relational-economic-arbitration-priority.service";
import { RelationalEconomicArbitrationRealtimeService } from "./relational-economic-arbitration-realtime.service";
import { RelationalEconomicArbitrationRiskService } from "./relational-economic-arbitration-risk.service";
import { RelationalEconomicArbitrationScenarioService } from "./relational-economic-arbitration-scenario.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalEconomicGovernanceModule),
    forwardRef(() => RelationalEconomicStabilizationModule),
  ],
  controllers: [RelationalEconomicArbitrationController],
  providers: [
    RelationalEconomicArbitrationPolicyService,
    RelationalEconomicArbitrationCorridorContextService,
    RelationalEconomicArbitrationConflictService,
    RelationalEconomicArbitrationScenarioService,
    RelationalEconomicArbitrationDecisionService,
    RelationalEconomicArbitrationPriorityService,
    RelationalEconomicArbitrationRiskService,
    RelationalEconomicArbitrationRealtimeService,
    RelationalEconomicArbitrationIngestionService,
    RelationalEconomicArbitrationGuard,
  ],
  exports: [
    RelationalEconomicArbitrationIngestionService,
    RelationalEconomicArbitrationCorridorContextService,
  ],
})
export class RelationalEconomicArbitrationModule {}
