import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalEconomicGovernanceModule } from "../relational-economic-governance/relational-economic-governance.module";
import { RelationalEconomicSovereigntyModule } from "../relational-economic-sovereignty/relational-economic-sovereignty.module";
import { RelationalEconomicRecoveryController } from "./relational-economic-recovery.controller";
import { RelationalEconomicRecoveryCorridorContextService } from "./relational-economic-recovery-corridor-context.service";
import { RelationalEconomicRecoveryDependencyService } from "./relational-economic-recovery-dependency.service";
import { RelationalEconomicRecoveryGuard } from "./relational-economic-recovery.guard";
import { RelationalEconomicRecoveryIngestionService } from "./relational-economic-recovery-ingestion.service";
import { RelationalEconomicRecoveryPlanningService } from "./relational-economic-recovery-planning.service";
import { RelationalEconomicRecoveryPolicyService } from "./relational-economic-recovery-policy.service";
import { RelationalEconomicRecoveryPriorityService } from "./relational-economic-recovery-priority.service";
import { RelationalEconomicRecoveryRealtimeService } from "./relational-economic-recovery-realtime.service";
import { RelationalEconomicRecoveryRiskService } from "./relational-economic-recovery-risk.service";
import { RelationalEconomicRecoveryStepService } from "./relational-economic-recovery-step.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalEconomicSovereigntyModule),
    forwardRef(() => RelationalEconomicGovernanceModule),
  ],
  controllers: [RelationalEconomicRecoveryController],
  providers: [
    RelationalEconomicRecoveryPolicyService,
    RelationalEconomicRecoveryCorridorContextService,
    RelationalEconomicRecoveryPlanningService,
    RelationalEconomicRecoveryStepService,
    RelationalEconomicRecoveryRiskService,
    RelationalEconomicRecoveryPriorityService,
    RelationalEconomicRecoveryDependencyService,
    RelationalEconomicRecoveryRealtimeService,
    RelationalEconomicRecoveryIngestionService,
    RelationalEconomicRecoveryGuard,
  ],
  exports: [
    RelationalEconomicRecoveryIngestionService,
    RelationalEconomicRecoveryCorridorContextService,
  ],
})
export class RelationalEconomicRecoveryModule {}
