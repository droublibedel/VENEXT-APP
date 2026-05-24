import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalExecutiveControlRoomModule } from "../relational-executive-control-room/relational-executive-control-room.module";
import { RelationalGlobalExecutiveSupervisionModule } from "../relational-global-executive-supervision/relational-global-executive-supervision.module";
import { RelationalExecutiveStrategicSynthesisController } from "./relational-executive-strategic-synthesis.controller";
import { RelationalExecutiveStrategicSynthesisBalanceService } from "./relational-executive-strategic-synthesis-balance.service";
import { RelationalExecutiveStrategicSynthesisCorridorContextService } from "./relational-executive-strategic-synthesis-corridor-context.service";
import { RelationalExecutiveStrategicSynthesisEngineService } from "./relational-executive-strategic-synthesis-engine.service";
import { RelationalExecutiveStrategicSynthesisDigestService } from "./relational-executive-strategic-synthesis-digest.service";
import { RelationalExecutiveStrategicSynthesisGuard } from "./relational-executive-strategic-synthesis.guard";
import { RelationalExecutiveStrategicSynthesisIngestionService } from "./relational-executive-strategic-synthesis-ingestion.service";
import { RelationalExecutiveStrategicSynthesisPolicyService } from "./relational-executive-strategic-synthesis-policy.service";
import { RelationalExecutiveStrategicSynthesisPriorityService } from "./relational-executive-strategic-synthesis-priority.service";
import { RelationalExecutiveStrategicSynthesisRealtimeService } from "./relational-executive-strategic-synthesis-realtime.service";
import { RelationalExecutiveStrategicSynthesisRiskService } from "./relational-executive-strategic-synthesis-risk.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalExecutiveControlRoomModule),
    forwardRef(() => RelationalGlobalExecutiveSupervisionModule),
  ],
  controllers: [RelationalExecutiveStrategicSynthesisController],
  providers: [
    RelationalExecutiveStrategicSynthesisPolicyService,
    RelationalExecutiveStrategicSynthesisCorridorContextService,
    RelationalExecutiveStrategicSynthesisEngineService,
    RelationalExecutiveStrategicSynthesisDigestService,
    RelationalExecutiveStrategicSynthesisPriorityService,
    RelationalExecutiveStrategicSynthesisRiskService,
    RelationalExecutiveStrategicSynthesisBalanceService,
    RelationalExecutiveStrategicSynthesisRealtimeService,
    RelationalExecutiveStrategicSynthesisIngestionService,
    RelationalExecutiveStrategicSynthesisGuard,
  ],
  exports: [
    RelationalExecutiveStrategicSynthesisIngestionService,
    RelationalExecutiveStrategicSynthesisCorridorContextService,
  ],
})
export class RelationalExecutiveStrategicSynthesisModule {}
