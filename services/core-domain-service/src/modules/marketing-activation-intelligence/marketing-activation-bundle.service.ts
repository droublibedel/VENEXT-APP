import { Injectable } from "@nestjs/common";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { MarketingActivationBundleResponse } from "@venext/shared-contracts";
import { ActivationInterventionsService } from "../activation-interventions/activation-interventions.service";
import { CampaignIntelligenceService } from "../campaign-intelligence/campaign-intelligence.service";
import { CommercialNetworkContextService } from "../commercial-network-intelligence/commercial-network-context.service";
import { ProductMomentumService } from "../product-momentum/product-momentum.service";
import { RetailerEngagementService } from "../retailer-engagement/retailer-engagement.service";
import { RelationalFlagsService } from "../relational-commerce/relational-flags.service";
import { SponsoredInjectionEngineService } from "../relational-commerce/sponsored-injection-engine.service";
import { SponsorshipPressureService } from "../sponsorship-pressure/sponsorship-pressure.service";
import { TerritoryActivationRadarService } from "../territory-activation-radar/territory-activation-radar.service";
import { ActivationOpportunityMapService } from "./activation-opportunity-map.service";
import { MarketingActivationBriefingService } from "./marketing-activation-briefing.service";
import { MarketingExternalSignalAdapter } from "./marketing-external-signal.adapter";
import { MarketingActivationOverviewService } from "./marketing-activation-overview.service";

@Injectable()
export class MarketingActivationBundleService {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly ctxSvc: CommercialNetworkContextService,
    private readonly sponsored: SponsoredInjectionEngineService,
    private readonly relationalFlags: RelationalFlagsService,
    private readonly externalAdapter: MarketingExternalSignalAdapter,
    private readonly overviewSvc: MarketingActivationOverviewService,
    private readonly sponsorshipSvc: SponsorshipPressureService,
    private readonly territorySvc: TerritoryActivationRadarService,
    private readonly productSvc: ProductMomentumService,
    private readonly retailerSvc: RetailerEngagementService,
    private readonly campaignSvc: CampaignIntelligenceService,
    private readonly mapSvc: ActivationOpportunityMapService,
    private readonly briefingSvc: MarketingActivationBriefingService,
    private readonly interventionsSvc: ActivationInterventionsService,
  ) {}

  async bundle(organizationId: string): Promise<MarketingActivationBundleResponse> {
    const ctx = await this.ctxSvc.build(organizationId);
    const orgId = organizationId;
    const seasonalPressure = this.externalAdapter.buildSeasonalPressure(ctx);

    const [poleOn, pmOn, reOn, sponsoredOn, obsOn] = await Promise.all([
      this.flags.isEnabled("marketing_activation_enabled", { organizationId: orgId }),
      this.flags.isEnabled("product_momentum_enabled", { organizationId: orgId }),
      this.flags.isEnabled("retailer_engagement_enabled", { organizationId: orgId }),
      this.relationalFlags.isEnabled("sponsored_products_enabled", orgId),
      this.flags.isEnabled("sponsorship_observatory_enabled", { organizationId: orgId }),
    ]);

    /** Instruction 13A — sponsored lane context independent of sponsorship_pressure_enabled. */
    const sponsoredSnapshot =
      poleOn && sponsoredOn && obsOn
        ? await this.sponsored.listActiveInjections({
            viewerOrganizationId: orgId,
            limit: 160,
            projection: "summary",
          })
        : null;

    const sponsorshipPressure = await this.sponsorshipSvc.fromContext(ctx, sponsoredSnapshot);
    const pressureScalar =
      sponsorshipPressure.policy === "ACTIVE"
        ? (sponsorshipPressure.overexposureIndex ?? sponsorshipPressure.territorySaturation ?? 0.35)
        : 0.35;

    const [territoryRadar, productMomentum, retailerEngagement, campaigns] = await Promise.all([
      this.territorySvc.fromContext(ctx, sponsoredSnapshot, poleOn, seasonalPressure),
      this.productSvc.fromContext(ctx, sponsoredSnapshot, poleOn && pmOn),
      this.retailerSvc.fromContext(ctx, sponsoredSnapshot, poleOn && reOn),
      this.campaignSvc.fromContext(ctx, sponsoredSnapshot),
    ]);

    const overview = this.overviewSvc.fromContext(ctx, sponsoredSnapshot, pressureScalar, seasonalPressure);
    const opportunityMap = this.mapSvc.fromContext(ctx, "momentum", sponsoredSnapshot, seasonalPressure);

    const briefing = await this.briefingSvc.briefing(orgId, ctx, {
      overview,
      sponsorship: sponsorshipPressure,
      territory: territoryRadar,
      productMomentum,
      campaigns,
    });

    const interventions = this.interventionsSvc.synthesize({
      organizationId: orgId,
      generatedAt: ctx.generatedAt,
      overview,
      sponsorship: sponsorshipPressure,
      territory: territoryRadar,
      productMomentum,
      seasonalPressure,
    });

    return {
      version: "1",
      generatedAt: new Date().toISOString(),
      organizationId: orgId,
      overview,
      sponsorshipPressure,
      territoryRadar,
      productMomentum,
      retailerEngagement,
      campaigns,
      opportunityMap,
      briefing,
      interventions,
    };
  }
}
