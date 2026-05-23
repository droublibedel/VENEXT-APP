import { Module } from "@nestjs/common";
import { BackofficeModule } from "../backoffice/backoffice.module";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { ExecutiveActionsService } from "../executive-actions/executive-actions.service";
import { ExecutiveBriefingService } from "../executive-briefing/executive-briefing.service";
import { MarketPressureService } from "../market-pressure/market-pressure.service";
import { StrategicRiskService } from "../strategic-risk/strategic-risk.service";
import { TerritoryOpportunityService } from "../territory-opportunity/territory-opportunity.service";
import { StrategicBundleService } from "./strategic-bundle.service";
import { StrategicDistributionService } from "./strategic-distribution.service";
import { StrategicIntelligenceController } from "./strategic-intelligence.controller";
import { StrategicIntelligenceService } from "./strategic-intelligence.service";
import { StrategicSignalsRadarService } from "./strategic-signals-radar.service";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, PlatformAuthzModule, BackofficeModule],
  controllers: [StrategicIntelligenceController],
  providers: [
    StrategicIntelligenceService,
    StrategicSignalsRadarService,
    StrategicDistributionService,
    MarketPressureService,
    TerritoryOpportunityService,
    StrategicRiskService,
    ExecutiveBriefingService,
    ExecutiveActionsService,
    StrategicBundleService,
  ],
  exports: [
    StrategicIntelligenceService,
    StrategicSignalsRadarService,
    MarketPressureService,
    StrategicBundleService,
  ],
})
export class StrategicIntelligenceModule {}
