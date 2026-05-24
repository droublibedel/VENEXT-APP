import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalExecutiveControlRoomModule } from "../relational-executive-control-room/relational-executive-control-room.module";
import { RelationalStrategicCommandModule } from "../relational-strategic-command/relational-strategic-command.module";
import { RelationalExecutiveOperationsController } from "./relational-executive-operations.controller";
import { RelationalExecutiveOperationsBalanceService } from "./relational-executive-operations-balance.service";
import { RelationalExecutiveOperationsCorridorContextService } from "./relational-executive-operations-corridor-context.service";
import { RelationalExecutiveOperationsEngineService } from "./relational-executive-operations-engine.service";
import { RelationalExecutiveOperationsMatrixService } from "./relational-executive-operations-matrix.service";
import { RelationalExecutiveOperationsGuard } from "./relational-executive-operations.guard";
import { RelationalExecutiveOperationsIngestionService } from "./relational-executive-operations-ingestion.service";
import { RelationalExecutiveOperationsPolicyService } from "./relational-executive-operations-policy.service";
import { RelationalExecutiveOperationsPriorityService } from "./relational-executive-operations-priority.service";
import { RelationalExecutiveOperationsRealtimeService } from "./relational-executive-operations-realtime.service";
import { RelationalExecutiveOperationsRiskService } from "./relational-executive-operations-risk.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalStrategicCommandModule),
    forwardRef(() => RelationalExecutiveControlRoomModule),
  ],
  controllers: [RelationalExecutiveOperationsController],
  providers: [
    RelationalExecutiveOperationsPolicyService,
    RelationalExecutiveOperationsCorridorContextService,
    RelationalExecutiveOperationsEngineService,
    RelationalExecutiveOperationsMatrixService,
    RelationalExecutiveOperationsPriorityService,
    RelationalExecutiveOperationsRiskService,
    RelationalExecutiveOperationsBalanceService,
    RelationalExecutiveOperationsRealtimeService,
    RelationalExecutiveOperationsIngestionService,
    RelationalExecutiveOperationsGuard,
  ],
  exports: [
    RelationalExecutiveOperationsIngestionService,
    RelationalExecutiveOperationsCorridorContextService,
  ],
})
export class RelationalExecutiveOperationsModule {}
