import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { DataIntelligenceModule } from "../data-intelligence/data-intelligence.module";
import { EconomicMemoryModule } from "../economic-memory/economic-memory.module";
import { CrossPoleImpactService } from "./cross-pole-impact.service";
import { EconomicPropagationController } from "./economic-propagation.controller";
import { EconomicPropagationEngineService } from "./economic-propagation-engine.service";
import { EconomicPropagationRealtimePublishService } from "./economic-propagation-realtime-publish.service";
import { EconomicShockService } from "./economic-shock.service";
import { PropagationRuleEngineService } from "./propagation-rule-engine.service";
import { PropagationSimulationService } from "./propagation-simulation.service";
import { TerritoryFragilityService } from "./territory-fragility.service";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, PlatformAuthzModule, DataIntelligenceModule, EconomicMemoryModule],
  controllers: [EconomicPropagationController],
  providers: [
    EconomicPropagationEngineService,
    EconomicShockService,
    PropagationRuleEngineService,
    CrossPoleImpactService,
    TerritoryFragilityService,
    PropagationSimulationService,
    EconomicPropagationRealtimePublishService,
  ],
  exports: [EconomicPropagationEngineService],
})
export class EconomicPropagationModule {}
