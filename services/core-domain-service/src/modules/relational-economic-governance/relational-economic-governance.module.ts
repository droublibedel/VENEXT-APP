import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalEconomicArbitrationModule } from "../relational-economic-arbitration/relational-economic-arbitration.module";
import { RelationalEconomicRecoveryModule } from "../relational-economic-recovery/relational-economic-recovery.module";
import { RelationalEconomicGovernanceController } from "./relational-economic-governance.controller";
import { RelationalEconomicGovernanceBalanceService } from "./relational-economic-governance-balance.service";
import { RelationalEconomicGovernanceConflictService } from "./relational-economic-governance-conflict.service";
import { RelationalEconomicGovernanceCoordinationService } from "./relational-economic-governance-coordination.service";
import { RelationalEconomicGovernanceCorridorContextService } from "./relational-economic-governance-corridor-context.service";
import { RelationalEconomicGovernanceGuard } from "./relational-economic-governance.guard";
import { RelationalEconomicGovernanceIngestionService } from "./relational-economic-governance-ingestion.service";
import { RelationalEconomicGovernancePolicyService } from "./relational-economic-governance-policy.service";
import { RelationalEconomicGovernancePriorityService } from "./relational-economic-governance-priority.service";
import { RelationalEconomicGovernanceRealtimeService } from "./relational-economic-governance-realtime.service";
import { RelationalEconomicGovernanceRiskService } from "./relational-economic-governance-risk.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalEconomicRecoveryModule),
    forwardRef(() => RelationalEconomicArbitrationModule),
  ],
  controllers: [RelationalEconomicGovernanceController],
  providers: [
    RelationalEconomicGovernancePolicyService,
    RelationalEconomicGovernanceCorridorContextService,
    RelationalEconomicGovernanceCoordinationService,
    RelationalEconomicGovernanceConflictService,
    RelationalEconomicGovernancePriorityService,
    RelationalEconomicGovernanceBalanceService,
    RelationalEconomicGovernanceRiskService,
    RelationalEconomicGovernanceRealtimeService,
    RelationalEconomicGovernanceIngestionService,
    RelationalEconomicGovernanceGuard,
  ],
  exports: [RelationalEconomicGovernanceIngestionService],
})
export class RelationalEconomicGovernanceModule {}
