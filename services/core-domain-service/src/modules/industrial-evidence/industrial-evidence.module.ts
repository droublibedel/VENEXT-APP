import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { EconomicCommandModule } from "../economic-command/economic-command.module";
import { EconomicCoordinationModule } from "../economic-coordination/economic-coordination.module";
import { EconomicMemoryModule } from "../economic-memory/economic-memory.module";
import { EconomicPropagationModule } from "../economic-propagation/economic-propagation.module";
import { EconomicScenariosModule } from "../economic-scenarios/economic-scenarios.module";
import { IndustrialOperationalContinuityModule } from "../industrial-operational-continuity/industrial-operational-continuity.module";
import { IndustrialSituationRoomModule } from "../industrial-situation-room/industrial-situation-room.module";
import { IndustrialEvidenceController } from "./industrial-evidence.controller";
import { IndustrialEvidenceEngineService } from "./industrial-evidence-engine.service";
import { IndustrialEvidenceRealtimePublishService } from "./industrial-evidence-realtime-publish.service";
import { IndustrialEvidenceTraceService } from "./industrial-evidence-trace.service";
import { IndustrialLimitationService } from "./industrial-limitation.service";
import { IndustrialTrustMatrixService } from "./industrial-trust-matrix.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    EconomicCommandModule,
    EconomicCoordinationModule,
    EconomicScenariosModule,
    EconomicPropagationModule,
    EconomicMemoryModule,
    IndustrialSituationRoomModule,
    IndustrialOperationalContinuityModule,
  ],
  controllers: [IndustrialEvidenceController],
  providers: [
    IndustrialTrustMatrixService,
    IndustrialEvidenceTraceService,
    IndustrialLimitationService,
    IndustrialEvidenceRealtimePublishService,
    IndustrialEvidenceEngineService,
  ],
  exports: [IndustrialEvidenceEngineService],
})
export class IndustrialEvidenceModule {}
