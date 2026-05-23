import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { BackofficeModule } from "../backoffice/backoffice.module";
import { EconomicPropagationModule } from "../economic-propagation/economic-propagation.module";
import { EconomicScenariosController } from "./economic-scenarios.controller";
import { EconomicScenariosEngineService } from "./economic-scenarios-engine.service";
import { EconomicScenariosRealtimePublishService } from "./economic-scenarios-realtime-publish.service";
import { ScenarioComparisonService } from "./scenario-comparison.service";
import { ScenarioGenerationService } from "./scenario-generation.service";
import { ScenarioImpactService } from "./scenario-impact.service";
import { ScenarioMemoryLinkService } from "./scenario-memory-link.service";
import { ScenarioRiskService } from "./scenario-risk.service";
import { ScenarioStabilizationService } from "./scenario-stabilization.service";
import { ScenarioTrajectoryService } from "./scenario-trajectory.service";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, PlatformAuthzModule, BackofficeModule, EconomicPropagationModule],
  controllers: [EconomicScenariosController],
  exports: [EconomicScenariosEngineService],
  providers: [
    ScenarioGenerationService,
    ScenarioTrajectoryService,
    ScenarioImpactService,
    ScenarioComparisonService,
    ScenarioRiskService,
    ScenarioStabilizationService,
    ScenarioMemoryLinkService,
    EconomicScenariosRealtimePublishService,
    EconomicScenariosEngineService,
  ],
})
export class EconomicScenariosModule {}
