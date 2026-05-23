import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalEconomicMonitoringModule } from "../relational-economic-monitoring/relational-economic-monitoring.module";
import { RelationalInstitutionalReportingModule } from "../relational-institutional-reporting/relational-institutional-reporting.module";
import { RelationalExecutiveOrchestrationController } from "./relational-executive-orchestration.controller";
import { RelationalExecutiveOrchestrationBalanceService } from "./relational-executive-orchestration-balance.service";
import { RelationalExecutiveOrchestrationCorridorContextService } from "./relational-executive-orchestration-corridor-context.service";
import { RelationalExecutiveOrchestrationDependencyService } from "./relational-executive-orchestration-dependency.service";
import { RelationalExecutiveOrchestrationEngineService } from "./relational-executive-orchestration-engine.service";
import { RelationalExecutiveOrchestrationGuard } from "./relational-executive-orchestration.guard";
import { RelationalExecutiveOrchestrationIngestionService } from "./relational-executive-orchestration-ingestion.service";
import { RelationalExecutiveOrchestrationPolicyService } from "./relational-executive-orchestration-policy.service";
import { RelationalExecutiveOrchestrationPriorityService } from "./relational-executive-orchestration-priority.service";
import { RelationalExecutiveOrchestrationRealtimeService } from "./relational-executive-orchestration-realtime.service";
import { RelationalExecutiveOrchestrationRiskService } from "./relational-executive-orchestration-risk.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalEconomicMonitoringModule),
    forwardRef(() => RelationalInstitutionalReportingModule),
  ],
  controllers: [RelationalExecutiveOrchestrationController],
  providers: [
    RelationalExecutiveOrchestrationPolicyService,
    RelationalExecutiveOrchestrationCorridorContextService,
    RelationalExecutiveOrchestrationEngineService,
    RelationalExecutiveOrchestrationDependencyService,
    RelationalExecutiveOrchestrationPriorityService,
    RelationalExecutiveOrchestrationRiskService,
    RelationalExecutiveOrchestrationBalanceService,
    RelationalExecutiveOrchestrationRealtimeService,
    RelationalExecutiveOrchestrationIngestionService,
    RelationalExecutiveOrchestrationGuard,
  ],
  exports: [
    RelationalExecutiveOrchestrationIngestionService,
    RelationalExecutiveOrchestrationCorridorContextService,
  ],
})
export class RelationalExecutiveOrchestrationModule {}
