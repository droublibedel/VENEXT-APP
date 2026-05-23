import { Injectable } from "@nestjs/common";
import { CanonicalFeatureFlagEvaluator } from "../../../feature-flags/canonical-feature-flag.evaluator";
import { MarketPressureService } from "../../market-pressure/market-pressure.service";
import { StrategicIntelligenceService } from "../../strategic-intelligence/strategic-intelligence.service";
import { StrategicSignalsRadarService } from "../../strategic-intelligence/strategic-signals-radar.service";
import type { PoleIntelligenceSummary } from "./pole-intelligence-summary.types";

/**
 * Reuses strategic pole services (overview + radar + market pressure) — no StrategicBundleService full compose.
 */
@Injectable()
export class StrategicIntelligenceSummaryAdapter {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly overviewSvc: StrategicIntelligenceService,
    private readonly radarSvc: StrategicSignalsRadarService,
    private readonly marketPressureSvc: MarketPressureService,
  ) {}

  async build(organizationId: string): Promise<PoleIntelligenceSummary> {
    const strategicOn = await this.flags.isEnabled("strategic_intelligence_enabled", { organizationId });
    if (!strategicOn) {
      return {
        available: false,
        source: "strategic_intelligence_disabled",
        keySignals: [],
        riskSignals: [],
        opportunitySignals: [],
        territorySignals: [],
        confidence: 0,
      };
    }

    const [overview, radar, pressure] = await Promise.all([
      this.overviewSvc.overview(organizationId),
      this.radarSvc.radar(organizationId),
      this.marketPressureSvc.snapshot(organizationId),
    ]);

    const keySignals = radar.internal.slice(0, 4).map((r) => `${r.signalType}:${r.impact}`);
    const riskSignals: string[] = [];
    if (pressure.policy === "ACTIVE") {
      riskSignals.push(`market_pressure:${pressure.band}`);
      if (pressure.impactedRegions.length) riskSignals.push(`regions:${pressure.impactedRegions.slice(0, 3).join(",")}`);
    } else {
      riskSignals.push("market_pressure:DISABLED_or_inactive");
    }
    const caps = overview.strategicCapsules;
    const opportunitySignals = [
      `region_opportunity:${caps.regionOpportunityLevel.score.toFixed(2)}`,
      `expansion_velocity:${caps.marketExpansionVelocity.ratio.toFixed(2)}`,
    ];
    const territorySignals = [
      `anchor:${caps.regionOpportunityLevel.anchorTerritory}`,
      ...radar.internal.flatMap((r) => r.affectedTerritories ?? []).slice(0, 6),
    ];

    const confidence = Number(
      Math.min(1, 0.45 + caps.strategicHealth.score * 0.35 + (radar.internal.length > 0 ? 0.12 : 0)).toFixed(3),
    );

    return {
      available: true,
      source: "StrategicIntelligenceService+StrategicSignalsRadarService+MarketPressureService",
      keySignals,
      riskSignals,
      opportunitySignals,
      territorySignals,
      confidence,
      metrics: {
        strategicHealth: caps.strategicHealth.score,
        signalDensityRatio: caps.abnormalSignalDensity.ratio,
        distributionTension: caps.distributionTension.index,
        radarInternalCount: radar.internal.length,
      },
    };
  }
}
