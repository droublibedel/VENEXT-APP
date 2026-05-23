import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalInstitutionalReportingModule } from "../relational-institutional-reporting/relational-institutional-reporting.module";
import { RelationalStrategicCommandModule } from "../relational-strategic-command/relational-strategic-command.module";
import { RelationalStrategicIntelligenceController } from "./relational-strategic-intelligence.controller";
import { RelationalStrategicIntelligenceBalanceService } from "./relational-strategic-intelligence-balance.service";
import { RelationalStrategicIntelligenceCorridorContextService } from "./relational-strategic-intelligence-corridor-context.service";
import { RelationalStrategicIntelligenceEngineService } from "./relational-strategic-intelligence-engine.service";
import { RelationalStrategicIntelligenceGuard } from "./relational-strategic-intelligence.guard";
import { RelationalStrategicIntelligenceIngestionService } from "./relational-strategic-intelligence-ingestion.service";
import { RelationalStrategicIntelligencePolicyService } from "./relational-strategic-intelligence-policy.service";
import { RelationalStrategicIntelligencePriorityService } from "./relational-strategic-intelligence-priority.service";
import { RelationalStrategicIntelligenceRealtimeService } from "./relational-strategic-intelligence-realtime.service";
import { RelationalStrategicIntelligenceRiskService } from "./relational-strategic-intelligence-risk.service";
import { RelationalStrategicIntelligenceSynthesisService } from "./relational-strategic-intelligence-synthesis.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalInstitutionalReportingModule),
    forwardRef(() => RelationalStrategicCommandModule),
  ],
  controllers: [RelationalStrategicIntelligenceController],
  providers: [
    RelationalStrategicIntelligencePolicyService,
    RelationalStrategicIntelligenceCorridorContextService,
    RelationalStrategicIntelligenceEngineService,
    RelationalStrategicIntelligenceSynthesisService,
    RelationalStrategicIntelligencePriorityService,
    RelationalStrategicIntelligenceRiskService,
    RelationalStrategicIntelligenceBalanceService,
    RelationalStrategicIntelligenceRealtimeService,
    RelationalStrategicIntelligenceIngestionService,
    RelationalStrategicIntelligenceGuard,
  ],
  exports: [RelationalStrategicIntelligenceIngestionService],
})
export class RelationalStrategicIntelligenceModule {}
