import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { DataIntelligenceModule } from "../data-intelligence/data-intelligence.module";
import { EconomicMemoryModule } from "../economic-memory/economic-memory.module";
import { EconomicPropagationModule } from "../economic-propagation/economic-propagation.module";
import { EconomicScenariosModule } from "../economic-scenarios/economic-scenarios.module";
import { CoordinationConflictService } from "./coordination-conflict.service";
import { CoordinationMemoryService } from "./coordination-memory.service";
import { CrossPolePriorityService } from "./cross-pole-priority.service";
import { EconomicCoordinationController } from "./economic-coordination.controller";
import { EconomicCoordinationEngineService } from "./economic-coordination-engine.service";
import { EconomicCoordinationRealtimePublishService } from "./economic-coordination-realtime-publish.service";
import { EconomicEscalationService } from "./economic-escalation.service";
import { EconomicPostureService } from "./economic-posture.service";
import { ResponseOrchestrationService } from "./response-orchestration.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    EconomicPropagationModule,
    EconomicScenariosModule,
    EconomicMemoryModule,
    DataIntelligenceModule,
  ],
  controllers: [EconomicCoordinationController],
  providers: [
    EconomicPostureService,
    CoordinationConflictService,
    CrossPolePriorityService,
    ResponseOrchestrationService,
    EconomicEscalationService,
    CoordinationMemoryService,
    EconomicCoordinationRealtimePublishService,
    EconomicCoordinationEngineService,
  ],
  exports: [EconomicCoordinationEngineService],
})
export class EconomicCoordinationModule {}
