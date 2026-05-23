import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalEconomicStabilizationModule } from "../relational-economic-stabilization/relational-economic-stabilization.module";
import { RelationalExecutiveOrchestrationModule } from "../relational-executive-orchestration/relational-executive-orchestration.module";
import { RelationalEconomicMonitoringController } from "./relational-economic-monitoring.controller";
import { RelationalEconomicMonitoringAlertService } from "./relational-economic-monitoring-alert.service";
import { RelationalEconomicMonitoringBalanceService } from "./relational-economic-monitoring-balance.service";
import { RelationalEconomicMonitoringCorridorContextService } from "./relational-economic-monitoring-corridor-context.service";
import { RelationalEconomicMonitoringEngineService } from "./relational-economic-monitoring-engine.service";
import { RelationalEconomicMonitoringGuard } from "./relational-economic-monitoring.guard";
import { RelationalEconomicMonitoringIngestionService } from "./relational-economic-monitoring-ingestion.service";
import { RelationalEconomicMonitoringPolicyService } from "./relational-economic-monitoring-policy.service";
import { RelationalEconomicMonitoringPriorityService } from "./relational-economic-monitoring-priority.service";
import { RelationalEconomicMonitoringRealtimeService } from "./relational-economic-monitoring-realtime.service";
import { RelationalEconomicMonitoringRiskService } from "./relational-economic-monitoring-risk.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalEconomicStabilizationModule),
    forwardRef(() => RelationalExecutiveOrchestrationModule),
  ],
  controllers: [RelationalEconomicMonitoringController],
  providers: [
    RelationalEconomicMonitoringPolicyService,
    RelationalEconomicMonitoringCorridorContextService,
    RelationalEconomicMonitoringEngineService,
    RelationalEconomicMonitoringAlertService,
    RelationalEconomicMonitoringPriorityService,
    RelationalEconomicMonitoringRiskService,
    RelationalEconomicMonitoringBalanceService,
    RelationalEconomicMonitoringRealtimeService,
    RelationalEconomicMonitoringIngestionService,
    RelationalEconomicMonitoringGuard,
  ],
  exports: [RelationalEconomicMonitoringIngestionService],
})
export class RelationalEconomicMonitoringModule {}
