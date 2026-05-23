import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalMacroEconomicModule } from "../relational-macro-economic/relational-macro-economic.module";
import { RelationalEconomicSovereigntyModule } from "../relational-economic-sovereignty/relational-economic-sovereignty.module";
import { RelationalEconomicContinuityController } from "./relational-economic-continuity.controller";
import { RelationalEconomicContinuityCorridorContextService } from "./relational-economic-continuity-corridor-context.service";
import { RelationalEconomicContinuityDependencyService } from "./relational-economic-continuity-dependency.service";
import { RelationalEconomicContinuityGuard } from "./relational-economic-continuity.guard";
import { RelationalEconomicContinuityHistoryService } from "./relational-economic-continuity-history.service";
import { RelationalEconomicContinuityIngestionService } from "./relational-economic-continuity-ingestion.service";
import { RelationalEconomicContinuityNodeService } from "./relational-economic-continuity-node.service";
import { RelationalEconomicContinuityPolicyService } from "./relational-economic-continuity-policy.service";
import { RelationalEconomicContinuityPressureService } from "./relational-economic-continuity-pressure.service";
import { RelationalEconomicContinuityRealtimeService } from "./relational-economic-continuity-realtime.service";
import { RelationalEconomicContinuityRecoveryService } from "./relational-economic-continuity-recovery.service";
import { RelationalEconomicContinuityRiskService } from "./relational-economic-continuity-risk.service";
import { RelationalEconomicContinuityStabilityService } from "./relational-economic-continuity-stability.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalMacroEconomicModule),
  ],
  controllers: [RelationalEconomicContinuityController],
  providers: [
    RelationalEconomicContinuityPolicyService,
    RelationalEconomicContinuityCorridorContextService,
    RelationalEconomicContinuityStabilityService,
    RelationalEconomicContinuityPressureService,
    RelationalEconomicContinuityRiskService,
    RelationalEconomicContinuityDependencyService,
    RelationalEconomicContinuityRecoveryService,
    RelationalEconomicContinuityHistoryService,
    RelationalEconomicContinuityNodeService,
    RelationalEconomicContinuityRealtimeService,
    RelationalEconomicContinuityIngestionService,
    RelationalEconomicContinuityGuard,
  ],
  exports: [RelationalEconomicContinuityIngestionService, RelationalEconomicContinuityCorridorContextService],
})
export class RelationalEconomicContinuityModule {}
