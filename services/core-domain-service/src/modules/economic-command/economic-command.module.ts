import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { EconomicCoordinationModule } from "../economic-coordination/economic-coordination.module";
import { EconomicPropagationModule } from "../economic-propagation/economic-propagation.module";
import { EconomicArbitrationService } from "./economic-arbitration.service";
import { EconomicCommandController } from "./economic-command.controller";
import { EconomicCommandEngineService } from "./economic-command-engine.service";
import { EconomicCommandNarrativeService } from "./economic-command-narrative.service";
import { EconomicCommandRealtimePublishService } from "./economic-command-realtime-publish.service";
import { EconomicDecisionRiskService } from "./economic-decision-risk.service";
import { EconomicPressureZoneService } from "./economic-pressure-zone.service";
import { EconomicSilentTensionService } from "./economic-silent-tension.service";
import { EconomicSystemStressService } from "./economic-system-stress.service";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, PlatformAuthzModule, EconomicPropagationModule, EconomicCoordinationModule],
  controllers: [EconomicCommandController],
  providers: [
    EconomicPressureZoneService,
    EconomicDecisionRiskService,
    EconomicArbitrationService,
    EconomicSystemStressService,
    EconomicSilentTensionService,
    EconomicCommandNarrativeService,
    EconomicCommandRealtimePublishService,
    EconomicCommandEngineService,
  ],
  exports: [EconomicCommandEngineService],
})
export class EconomicCommandModule {}
