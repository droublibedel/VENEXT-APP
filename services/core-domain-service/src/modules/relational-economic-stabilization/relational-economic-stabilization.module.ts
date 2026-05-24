import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalEconomicArbitrationModule } from "../relational-economic-arbitration/relational-economic-arbitration.module";
import { RelationalEconomicMonitoringModule } from "../relational-economic-monitoring/relational-economic-monitoring.module";
import { RelationalEconomicStabilizationController } from "./relational-economic-stabilization.controller";
import { RelationalEconomicStabilizationCorridorContextService } from "./relational-economic-stabilization-corridor-context.service";
import { RelationalEconomicStabilizationDependencyService } from "./relational-economic-stabilization-dependency.service";
import { RelationalEconomicStabilizationEngineService } from "./relational-economic-stabilization-engine.service";
import { RelationalEconomicStabilizationGuard } from "./relational-economic-stabilization.guard";
import { RelationalEconomicStabilizationIngestionService } from "./relational-economic-stabilization-ingestion.service";
import { RelationalEconomicStabilizationBalanceService } from "./relational-economic-stabilization-balance.service";
import { RelationalEconomicStabilizationPolicyService } from "./relational-economic-stabilization-policy.service";
import { RelationalEconomicStabilizationPressureService } from "./relational-economic-stabilization-pressure.service";
import { RelationalEconomicStabilizationRealtimeService } from "./relational-economic-stabilization-realtime.service";
import { RelationalEconomicStabilizationResilienceService } from "./relational-economic-stabilization-resilience.service";
import { RelationalEconomicStabilizationRiskService } from "./relational-economic-stabilization-risk.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalEconomicArbitrationModule),
    forwardRef(() => RelationalEconomicMonitoringModule),
  ],
  controllers: [RelationalEconomicStabilizationController],
  providers: [
    RelationalEconomicStabilizationPolicyService,
    RelationalEconomicStabilizationCorridorContextService,
    RelationalEconomicStabilizationEngineService,
    RelationalEconomicStabilizationPressureService,
    RelationalEconomicStabilizationRiskService,
    RelationalEconomicStabilizationDependencyService,
    RelationalEconomicStabilizationResilienceService,
    RelationalEconomicStabilizationBalanceService,
    RelationalEconomicStabilizationRealtimeService,
    RelationalEconomicStabilizationIngestionService,
    RelationalEconomicStabilizationGuard,
  ],
  exports: [
    RelationalEconomicStabilizationIngestionService,
    RelationalEconomicStabilizationCorridorContextService,
  ],
})
export class RelationalEconomicStabilizationModule {}
