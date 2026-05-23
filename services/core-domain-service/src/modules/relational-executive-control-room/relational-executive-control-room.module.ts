import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalExecutiveOperationsModule } from "../relational-executive-operations/relational-executive-operations.module";
import { RelationalExecutiveStrategicSynthesisModule } from "../relational-executive-strategic-synthesis/relational-executive-strategic-synthesis.module";
import { RelationalExecutiveControlRoomController } from "./relational-executive-control-room.controller";
import { RelationalExecutiveControlRoomBalanceService } from "./relational-executive-control-room-balance.service";
import { RelationalExecutiveControlRoomCorridorContextService } from "./relational-executive-control-room-corridor-context.service";
import { RelationalExecutiveControlRoomEngineService } from "./relational-executive-control-room-engine.service";
import { RelationalExecutiveControlRoomBoardService } from "./relational-executive-control-room-board.service";
import { RelationalExecutiveControlRoomGuard } from "./relational-executive-control-room.guard";
import { RelationalExecutiveControlRoomIngestionService } from "./relational-executive-control-room-ingestion.service";
import { RelationalExecutiveControlRoomPolicyService } from "./relational-executive-control-room-policy.service";
import { RelationalExecutiveControlRoomPriorityService } from "./relational-executive-control-room-priority.service";
import { RelationalExecutiveControlRoomRealtimeService } from "./relational-executive-control-room-realtime.service";
import { RelationalExecutiveControlRoomRiskService } from "./relational-executive-control-room-risk.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalExecutiveOperationsModule),
    forwardRef(() => RelationalExecutiveStrategicSynthesisModule),
  ],
  controllers: [RelationalExecutiveControlRoomController],
  providers: [
    RelationalExecutiveControlRoomPolicyService,
    RelationalExecutiveControlRoomCorridorContextService,
    RelationalExecutiveControlRoomEngineService,
    RelationalExecutiveControlRoomBoardService,
    RelationalExecutiveControlRoomPriorityService,
    RelationalExecutiveControlRoomRiskService,
    RelationalExecutiveControlRoomBalanceService,
    RelationalExecutiveControlRoomRealtimeService,
    RelationalExecutiveControlRoomIngestionService,
    RelationalExecutiveControlRoomGuard,
  ],
  exports: [RelationalExecutiveControlRoomIngestionService],
})
export class RelationalExecutiveControlRoomModule {}
