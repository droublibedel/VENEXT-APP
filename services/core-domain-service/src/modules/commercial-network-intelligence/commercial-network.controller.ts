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
import { DistributorObservatoryService } from "../distributor-observatory/distributor-observatory.service";
import { NetworkInterventionsService } from "../network-interventions/network-interventions.service";
import { RelationshipStabilityService } from "../relationship-stability/relationship-stability.service";
import { RetailerRadarService } from "../retailer-radar/retailer-radar.service";
import { SponsorshipObservatoryService } from "../sponsorship-observatory/sponsorship-observatory.service";
import { CommercialNetworkBriefingService } from "./commercial-network-briefing.service";
import { CommercialNetworkBundleService } from "./commercial-network-bundle.service";
import { CommercialNetworkContextService } from "./commercial-network-context.service";
import { CommercialExpansionMapService } from "./commercial-expansion-map.service";
import { CommercialNetworkOverviewService } from "./commercial-network-overview.service";
import { CommercialNetworkRelationshipsService } from "./commercial-network-relationships.service";

@Controller("commercial-network")
@UseGuards(VenextAuthzGuard)
export class CommercialNetworkController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly ctxSvc: CommercialNetworkContextService,
    private readonly bundleSvc: CommercialNetworkBundleService,
    private readonly overviewSvc: CommercialNetworkOverviewService,
    private readonly relationshipsSvc: CommercialNetworkRelationshipsService,
    private readonly distributorsSvc: DistributorObservatoryService,
    private readonly retailersSvc: RetailerRadarService,
    private readonly expansionSvc: CommercialExpansionMapService,
    private readonly stabilitySvc: RelationshipStabilityService,
    private readonly sponsorshipSvc: SponsorshipObservatoryService,
    private readonly briefingSvc: CommercialNetworkBriefingService,
    private readonly interventionsSvc: NetworkInterventionsService,
  ) {}

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("commercial_network_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "commercial_network_disabled" });
    }
    await this.assertProducerCommercialPole(organizationId);
    return organizationId;
  }

  /**
   * Instruction 12A — commercial pole is producer/industrial command; demo bypass skips category check.
   */
  private async assertProducerCommercialPole(organizationId: string) {
    if (devAuthBypassEnabled()) return;
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { category: true, actorType: true },
    });
    if (!org) throw new ForbiddenException({ code: "organization_not_found" });
    const ok =
      org.category === OrganizationCategory.PRODUCER || org.actorType === OrganizationActorType.INDUSTRIAL_PRODUCER;
    if (!ok) {
      throw new ForbiddenException({ code: "commercial_network_producer_scope_required" });
    }
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
    return this.overviewSvc.fromContext(ctx);
  }

  @Get("relationships")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async relationships(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const ctx = await this.ctxSvc.build(org);
    return this.relationshipsSvc.fromContext(ctx);
  }

  @Get("distributors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async distributors(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const ctx = await this.ctxSvc.build(org);
    return this.distributorsSvc.fromContext(ctx);
  }

  @Get("retailers")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async retailers(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const retailerOn = await this.flags.isEnabled("retailer_radar_enabled", { organizationId: org });
    const ctx = await this.ctxSvc.build(org);
    return this.retailersSvc.fromContext(ctx, retailerOn);
  }

  @Get("expansion-map")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async expansionMap(@Query("organizationId") organizationId?: string, @Query("mode") mode?: string) {
    const org = await this.gateOrg(organizationId);
    const ctx = await this.ctxSvc.build(org);
    return this.expansionSvc.fromContext(ctx, this.bundleSvc.parseMapMode(mode));
  }

  @Get("stability-matrix")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async stability(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const stabilityOn = await this.flags.isEnabled("relationship_stability_enabled", { organizationId: org });
    const ctx = await this.ctxSvc.build(org);
    return this.stabilitySvc.fromContext(ctx, stabilityOn);
  }

  @Get("sponsorship")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async sponsorship(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const sponsorshipOn = await this.flags.isEnabled("sponsorship_observatory_enabled", { organizationId: org });
    const ctx = await this.ctxSvc.build(org);
    return this.sponsorshipSvc.fromContext(ctx, sponsorshipOn);
  }

  @Get("briefing")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async briefing(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const ctx = await this.ctxSvc.build(org);
    return this.briefingSvc.briefing(org, ctx);
  }

  @Get("interventions")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async interventions(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const [retailerOn, stabilityOn] = await Promise.all([
      this.flags.isEnabled("retailer_radar_enabled", { organizationId: org }),
      this.flags.isEnabled("relationship_stability_enabled", { organizationId: org }),
    ]);
    const ctx = await this.ctxSvc.build(org);
    const distributors = await this.distributorsSvc.fromContext(ctx);
    const retailers = await this.retailersSvc.fromContext(ctx, retailerOn);
    const stability = this.stabilitySvc.fromContext(ctx, stabilityOn);
    return this.interventionsSvc.synthesize({
      ctxGeneratedAt: ctx.generatedAt,
      organizationId: org,
      stability,
      distributors,
      retailers,
    });
  }
}
