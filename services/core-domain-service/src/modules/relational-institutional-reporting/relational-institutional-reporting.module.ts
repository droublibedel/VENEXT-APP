import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalExecutiveOrchestrationModule } from "../relational-executive-orchestration/relational-executive-orchestration.module";
import { RelationalStrategicIntelligenceModule } from "../relational-strategic-intelligence/relational-strategic-intelligence.module";
import { RelationalInstitutionalReportingController } from "./relational-institutional-reporting.controller";
import { RelationalInstitutionalReportingBalanceService } from "./relational-institutional-reporting-balance.service";
import { RelationalInstitutionalReportingBriefService } from "./relational-institutional-reporting-brief.service";
import { RelationalInstitutionalReportingCorridorContextService } from "./relational-institutional-reporting-corridor-context.service";
import { RelationalInstitutionalReportingEngineService } from "./relational-institutional-reporting-engine.service";
import { RelationalInstitutionalReportingGuard } from "./relational-institutional-reporting.guard";
import { RelationalInstitutionalReportingIngestionService } from "./relational-institutional-reporting-ingestion.service";
import { RelationalInstitutionalReportingPolicyService } from "./relational-institutional-reporting-policy.service";
import { RelationalInstitutionalReportingPriorityService } from "./relational-institutional-reporting-priority.service";
import { RelationalInstitutionalReportingRealtimeService } from "./relational-institutional-reporting-realtime.service";
import { RelationalInstitutionalReportingRiskService } from "./relational-institutional-reporting-risk.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalExecutiveOrchestrationModule),
    forwardRef(() => RelationalStrategicIntelligenceModule),
  ],
  controllers: [RelationalInstitutionalReportingController],
  providers: [
    RelationalInstitutionalReportingPolicyService,
    RelationalInstitutionalReportingCorridorContextService,
    RelationalInstitutionalReportingEngineService,
    RelationalInstitutionalReportingBriefService,
    RelationalInstitutionalReportingPriorityService,
    RelationalInstitutionalReportingRiskService,
    RelationalInstitutionalReportingBalanceService,
    RelationalInstitutionalReportingRealtimeService,
    RelationalInstitutionalReportingIngestionService,
    RelationalInstitutionalReportingGuard,
  ],
  exports: [
    RelationalInstitutionalReportingIngestionService,
    RelationalInstitutionalReportingCorridorContextService,
  ],
})
export class RelationalInstitutionalReportingModule {}
