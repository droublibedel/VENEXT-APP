import { Injectable } from "@nestjs/common";
import { ExecutiveActionsService } from "../executive-actions/executive-actions.service";
import { ExecutiveBriefingService } from "../executive-briefing/executive-briefing.service";
import { MarketPressureService } from "../market-pressure/market-pressure.service";
import { StrategicRiskService } from "../strategic-risk/strategic-risk.service";
import { TerritoryOpportunityService } from "../territory-opportunity/territory-opportunity.service";
import { StrategicDistributionService } from "./strategic-distribution.service";
import { StrategicIntelligenceService } from "./strategic-intelligence.service";
import { StrategicSignalsRadarService } from "./strategic-signals-radar.service";

/**
 * Single payload for slow / high-latency networks (Instruction 11A).
 */
@Injectable()
export class StrategicBundleService {
  constructor(
    private readonly overviewSvc: StrategicIntelligenceService,
    private readonly radarSvc: StrategicSignalsRadarService,
    private readonly distributionSvc: StrategicDistributionService,
    private readonly pressureSvc: MarketPressureService,
    private readonly territorySvc: TerritoryOpportunityService,
    private readonly riskSvc: StrategicRiskService,
    private readonly briefingSvc: ExecutiveBriefingService,
    private readonly actionsSvc: ExecutiveActionsService,
  ) {}

  async bundle(organizationId: string) {
    const [
      overview,
      signals,
      distributionNetwork,
      marketPressure,
      territoryOpportunities,
      riskMatrix,
      executiveBriefing,
      executiveQueue,
    ] = await Promise.all([
      this.overviewSvc.overview(organizationId),
      this.radarSvc.radar(organizationId),
      this.distributionSvc.network(organizationId),
      this.pressureSvc.snapshot(organizationId),
      this.territorySvc.territoryMap(organizationId, "opportunity"),
      this.riskSvc.matrix(organizationId),
      this.briefingSvc.briefing(organizationId),
      this.actionsSvc.queue(organizationId),
    ]);

    return {
      version: "1" as const,
      generatedAt: new Date().toISOString(),
      organizationId,
      overview,
      signals,
      distributionNetwork,
      marketPressure,
      territoryOpportunities,
      riskMatrix,
      executiveBriefing,
      executiveQueue,
    };
  }
}
