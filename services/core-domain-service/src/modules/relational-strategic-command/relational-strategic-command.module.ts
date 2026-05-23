import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalExecutiveOperationsModule } from "../relational-executive-operations/relational-executive-operations.module";
import { RelationalStrategicIntelligenceModule } from "../relational-strategic-intelligence/relational-strategic-intelligence.module";
import { RelationalStrategicCommandController } from "./relational-strategic-command.controller";
import { RelationalStrategicCommandBalanceService } from "./relational-strategic-command-balance.service";
import { RelationalStrategicCommandCorridorContextService } from "./relational-strategic-command-corridor-context.service";
import { RelationalStrategicCommandEngineService } from "./relational-strategic-command-engine.service";
import { RelationalStrategicCommandGridService } from "./relational-strategic-command-grid.service";
import { RelationalStrategicCommandGuard } from "./relational-strategic-command.guard";
import { RelationalStrategicCommandIngestionService } from "./relational-strategic-command-ingestion.service";
import { RelationalStrategicCommandPolicyService } from "./relational-strategic-command-policy.service";
import { RelationalStrategicCommandPriorityService } from "./relational-strategic-command-priority.service";
import { RelationalStrategicCommandRealtimeService } from "./relational-strategic-command-realtime.service";
import { RelationalStrategicCommandRiskService } from "./relational-strategic-command-risk.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalStrategicIntelligenceModule),
    forwardRef(() => RelationalExecutiveOperationsModule),
  ],
  controllers: [RelationalStrategicCommandController],
  providers: [
    RelationalStrategicCommandPolicyService,
    RelationalStrategicCommandCorridorContextService,
    RelationalStrategicCommandEngineService,
    RelationalStrategicCommandGridService,
    RelationalStrategicCommandPriorityService,
    RelationalStrategicCommandRiskService,
    RelationalStrategicCommandBalanceService,
    RelationalStrategicCommandRealtimeService,
    RelationalStrategicCommandIngestionService,
    RelationalStrategicCommandGuard,
  ],
  exports: [RelationalStrategicCommandIngestionService],
})
export class RelationalStrategicCommandModule {}
