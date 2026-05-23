import { Injectable } from "@nestjs/common";
import { CanonicalFeatureFlagEvaluator } from "../../../feature-flags/canonical-feature-flag.evaluator";
import type { CommercialNetworkContext } from "../../commercial-network-intelligence/commercial-network-context.service";
import { MarketingActivationOverviewService } from "../../marketing-activation-intelligence/marketing-activation-overview.service";
import { MarketingExternalSignalAdapter } from "../../marketing-activation-intelligence/marketing-external-signal.adapter";
import { SponsorshipPressureService } from "../../sponsorship-pressure/sponsorship-pressure.service";
import type { PoleIntelligenceSummary } from "./pole-intelligence-summary.types";

/**
 * Reuses marketing overview projection from commercial context (same path as MarketingActivationBundleService slice).
 */
@Injectable()
export class MarketingActivationSummaryAdapter {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly overviewSvc: MarketingActivationOverviewService,
    private readonly externalAdapter: MarketingExternalSignalAdapter,
    private readonly sponsorshipSvc: SponsorshipPressureService,
  ) {}

  async buildFromCommercialContext(ctx: CommercialNetworkContext): Promise<PoleIntelligenceSummary> {
    const orgId = ctx.organizationId;
    const poleOn = await this.flags.isEnabled("marketing_activation_enabled", { organizationId: orgId });
    if (!poleOn) {
      return {
        available: false,
        source: "marketing_activation_disabled",
        keySignals: [],
        riskSignals: [],
        opportunitySignals: [],
        territorySignals: [],
        confidence: 0,
      };
    }

    const seasonalPressure = this.externalAdapter.buildSeasonalPressure(ctx);
    const sponsorship = await this.sponsorshipSvc.fromContext(ctx, null);
    const pressureScalar =
      sponsorship.policy === "ACTIVE"
        ? (sponsorship.overexposureIndex ?? sponsorship.territorySaturation ?? 0.35)
        : 0.35;

    const overview = this.overviewSvc.fromContext(ctx, null, pressureScalar, seasonalPressure);

    const keySignals = overview.signalStrips.map((s) => `${s.band}:${s.tension.toFixed(2)}`);
    const riskSignals: string[] = [];
    if (sponsorship.policy !== "ACTIVE") {
      riskSignals.push(`sponsorship_observatory:${sponsorship.policy}`);
    } else {
      riskSignals.push(`sponsorship_pressure:${pressureScalar.toFixed(2)}`);
    }
    if (overview.inactiveActivationZones > 0) {
      riskSignals.push(`inactive_activation_zones:${overview.inactiveActivationZones}`);
    }

    const opportunitySignals = [
      `campaign_effectiveness:${overview.campaignEffectiveness.toFixed(2)}`,
      `retailer_engagement:${overview.retailerEngagementLevel.toFixed(2)}`,
    ];
    const territorySignals = [`territory_stimulation:${overview.territoryStimulation.toFixed(2)}`];

    const confidence = overview.activationConfidence;

    const available =
      sponsorship.policy === "ACTIVE" ||
      overview.territoryStimulation > 0.18 ||
      overview.campaignEffectiveness > 0.25 ||
      overview.commercialExcitation > 0.15;

    return {
      available,
      source: "MarketingActivationOverviewService+SponsorshipPressureService+MarketingExternalSignalAdapter",
      keySignals,
      riskSignals,
      opportunitySignals,
      territorySignals,
      confidence: Number(confidence.toFixed(3)),
      metrics: {
        activationVelocity: overview.activationVelocity,
        territoryStimulation: overview.territoryStimulation,
        commercialExcitation: overview.commercialExcitation,
        sponsorshipPressure: pressureScalar,
        campaignEffectiveness: overview.campaignEffectiveness,
      },
    };
  }
}
