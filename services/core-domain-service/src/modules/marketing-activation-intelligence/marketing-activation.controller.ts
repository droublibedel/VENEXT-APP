import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { OrganizationActorType, OrganizationCategory } from "@prisma/client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { ActivationInterventionsService } from "../activation-interventions/activation-interventions.service";
import { CampaignIntelligenceService } from "../campaign-intelligence/campaign-intelligence.service";
import { CommercialNetworkContextService } from "../commercial-network-intelligence/commercial-network-context.service";
import { ProductMomentumService } from "../product-momentum/product-momentum.service";
import { RetailerEngagementService } from "../retailer-engagement/retailer-engagement.service";
import { RelationalFlagsService } from "../relational-commerce/relational-flags.service";
import { SponsoredInjectionEngineService } from "../relational-commerce/sponsored-injection-engine.service";
import { SponsorshipPressureService, type SponsoredInjectionListSnapshot } from "../sponsorship-pressure/sponsorship-pressure.service";
import { TerritoryActivationRadarService } from "../territory-activation-radar/territory-activation-radar.service";
import { ActivationOpportunityMapService } from "./activation-opportunity-map.service";
import { MarketingActivationBriefingService } from "./marketing-activation-briefing.service";
import { MarketingActivationBundleService } from "./marketing-activation-bundle.service";
import { MarketingActivationOverviewService } from "./marketing-activation-overview.service";
import { MarketingExternalSignalAdapter } from "./marketing-external-signal.adapter";

@Controller("marketing-activation")
@UseGuards(VenextAuthzGuard)
export class MarketingActivationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly relationalFlags: RelationalFlagsService,
    private readonly sponsored: SponsoredInjectionEngineService,
    private readonly ctxSvc: CommercialNetworkContextService,
    private readonly bundleSvc: MarketingActivationBundleService,
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

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("marketing_activation_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "marketing_activation_disabled" });
    }
    await this.assertProducerMarketingPole(organizationId);
    return organizationId;
  }

  private async assertProducerMarketingPole(organizationId: string) {
    if (devAuthBypassEnabled()) return;
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { category: true, actorType: true },
    });
    if (!org) throw new ForbiddenException({ code: "organization_not_found" });
    const ok =
      org.category === OrganizationCategory.PRODUCER || org.actorType === OrganizationActorType.INDUSTRIAL_PRODUCER;
    if (!ok) {
      throw new ForbiddenException({ code: "marketing_activation_producer_scope_required" });
    }
  }

  /** Instruction 13A — sponsored injection list for map/momentum/retailer/campaign context (not gated by sponsorship_pressure_enabled). */
  private async loadSponsoredInjectionSnapshot(organizationId: string): Promise<SponsoredInjectionListSnapshot | null> {
    const [sponsoredOn, obsOn] = await Promise.all([
      this.relationalFlags.isEnabled("sponsored_products_enabled", organizationId),
      this.flags.isEnabled("sponsorship_observatory_enabled", { organizationId }),
    ]);
    if (!sponsoredOn || !obsOn) return null;
    return this.sponsored.listActiveInjections({
      viewerOrganizationId: organizationId,
      limit: 160,
      projection: "summary",
    });
  }

  @Get("bundle")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bundle(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return this.bundleSvc.bundle(org);
  }

  @Get("overview")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const ctx = await this.ctxSvc.build(org);
    const seasonalPressure = this.externalAdapter.buildSeasonalPressure(ctx);
    const snapshot = await this.loadSponsoredInjectionSnapshot(org);
    const sponsorship = await this.sponsorshipSvc.fromContext(ctx, snapshot);
    const pressure =
      sponsorship.policy === "ACTIVE"
        ? (sponsorship.overexposureIndex ?? sponsorship.territorySaturation ?? 0.35)
        : 0.35;
    return this.overviewSvc.fromContext(ctx, snapshot, pressure, seasonalPressure);
  }

  @Get("sponsorship-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async sponsorshipPressure(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const ctx = await this.ctxSvc.build(org);
    const snapshot = await this.loadSponsoredInjectionSnapshot(org);
    return this.sponsorshipSvc.fromContext(ctx, snapshot);
  }

  @Get("territory-radar")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async territoryRadar(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const ctx = await this.ctxSvc.build(org);
    const seasonalPressure = this.externalAdapter.buildSeasonalPressure(ctx);
    const snapshot = await this.loadSponsoredInjectionSnapshot(org);
    return this.territorySvc.fromContext(ctx, snapshot, true, seasonalPressure);
  }

  @Get("product-momentum")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async productMomentum(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const ctx = await this.ctxSvc.build(org);
    const snapshot = await this.loadSponsoredInjectionSnapshot(org);
    const pmOn = await this.flags.isEnabled("product_momentum_enabled", { organizationId: org });
    return this.productSvc.fromContext(ctx, snapshot, pmOn);
  }

  @Get("retailer-engagement")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async retailerEngagement(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const ctx = await this.ctxSvc.build(org);
    const snapshot = await this.loadSponsoredInjectionSnapshot(org);
    const reOn = await this.flags.isEnabled("retailer_engagement_enabled", { organizationId: org });
    return this.retailerSvc.fromContext(ctx, snapshot, reOn);
  }

  @Get("campaigns")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async campaigns(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const ctx = await this.ctxSvc.build(org);
    const snapshot = await this.loadSponsoredInjectionSnapshot(org);
    return this.campaignSvc.fromContext(ctx, snapshot);
  }

  @Get("opportunity-map")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async opportunityMap(@Query("organizationId") organizationId?: string, @Query("mode") mode?: string) {
    const org = await this.gateOrg(organizationId);
    const ctx = await this.ctxSvc.build(org);
    const seasonalPressure = this.externalAdapter.buildSeasonalPressure(ctx);
    const snapshot = await this.loadSponsoredInjectionSnapshot(org);
    return this.mapSvc.fromContext(ctx, this.mapSvc.parseMode(mode), snapshot, seasonalPressure);
  }

  @Get("briefing")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async briefing(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const ctx = await this.ctxSvc.build(org);
    const seasonalPressure = this.externalAdapter.buildSeasonalPressure(ctx);
    const snapshot = await this.loadSponsoredInjectionSnapshot(org);
    const [sponsorship, territory, productMomentum, campaigns] = await Promise.all([
      this.sponsorshipSvc.fromContext(ctx, snapshot),
      this.territorySvc.fromContext(ctx, snapshot, true, seasonalPressure),
      this.productSvc.fromContext(
        ctx,
        snapshot,
        await this.flags.isEnabled("product_momentum_enabled", { organizationId: org }),
      ),
      this.campaignSvc.fromContext(ctx, snapshot),
    ]);
    const pressure =
      sponsorship.policy === "ACTIVE"
        ? (sponsorship.overexposureIndex ?? sponsorship.territorySaturation ?? 0.35)
        : 0.35;
    const overview = this.overviewSvc.fromContext(ctx, snapshot, pressure, seasonalPressure);
    return this.briefingSvc.briefing(org, ctx, { overview, sponsorship, territory, productMomentum, campaigns });
  }

  @Get("interventions")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async interventions(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const ctx = await this.ctxSvc.build(org);
    const seasonalPressure = this.externalAdapter.buildSeasonalPressure(ctx);
    const snapshot = await this.loadSponsoredInjectionSnapshot(org);
    const [sponsorship, territory, productMomentum] = await Promise.all([
      this.sponsorshipSvc.fromContext(ctx, snapshot),
      this.territorySvc.fromContext(ctx, snapshot, true, seasonalPressure),
      this.productSvc.fromContext(
        ctx,
        snapshot,
        await this.flags.isEnabled("product_momentum_enabled", { organizationId: org }),
      ),
    ]);
    const pressure =
      sponsorship.policy === "ACTIVE"
        ? (sponsorship.overexposureIndex ?? sponsorship.territorySaturation ?? 0.35)
        : 0.35;
    const overview = this.overviewSvc.fromContext(ctx, snapshot, pressure, seasonalPressure);
    return this.interventionsSvc.synthesize({
      organizationId: org,
      generatedAt: ctx.generatedAt,
      overview,
      sponsorship,
      territory,
      productMomentum,
      seasonalPressure,
    });
  }
}
