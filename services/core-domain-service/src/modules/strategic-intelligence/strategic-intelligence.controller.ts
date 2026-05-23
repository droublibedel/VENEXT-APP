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
import { ExecutiveActionsService } from "../executive-actions/executive-actions.service";
import { ExecutiveBriefingService } from "../executive-briefing/executive-briefing.service";
import { MarketPressureService } from "../market-pressure/market-pressure.service";
import { StrategicRiskService } from "../strategic-risk/strategic-risk.service";
import { TerritoryOpportunityService } from "../territory-opportunity/territory-opportunity.service";
import { StrategicBundleService } from "./strategic-bundle.service";
import { StrategicDistributionService } from "./strategic-distribution.service";
import { StrategicIntelligenceService } from "./strategic-intelligence.service";
import { StrategicSignalsRadarService } from "./strategic-signals-radar.service";
import type { TerritoryMapMode } from "../territory-opportunity/territory-opportunity.service";

@Controller("strategic-intelligence")
@UseGuards(VenextAuthzGuard)
export class StrategicIntelligenceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly overviewSvc: StrategicIntelligenceService,
    private readonly radarSvc: StrategicSignalsRadarService,
    private readonly distributionSvc: StrategicDistributionService,
    private readonly pressureSvc: MarketPressureService,
    private readonly territorySvc: TerritoryOpportunityService,
    private readonly riskSvc: StrategicRiskService,
    private readonly briefingSvc: ExecutiveBriefingService,
    private readonly actionsSvc: ExecutiveActionsService,
    private readonly bundleSvc: StrategicBundleService,
  ) {}

  private async gate(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("strategic_intelligence_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "strategic_intelligence_disabled" });
    }
    await this.assertProducerScope(organizationId);
    return organizationId;
  }

  private async assertProducerScope(organizationId: string) {
    if (devAuthBypassEnabled()) return;
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { category: true, actorType: true },
    });
    if (!org) throw new ForbiddenException({ code: "organization_not_found" });
    const ok =
      org.category === OrganizationCategory.PRODUCER || org.actorType === OrganizationActorType.INDUSTRIAL_PRODUCER;
    if (!ok) throw new ForbiddenException({ code: "strategic_intelligence_producer_scope_required" });
  }

  @Get("bundle")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bundle(@Query("organizationId") organizationId?: string) {
    const org = await this.gate(organizationId);
    return this.bundleSvc.bundle(org);
  }

  @Get("overview")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(@Query("organizationId") organizationId?: string) {
    const org = await this.gate(organizationId);
    return this.overviewSvc.overview(org);
  }

  @Get("signals")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async signals(@Query("organizationId") organizationId?: string) {
    const org = await this.gate(organizationId);
    return this.radarSvc.radar(org);
  }

  @Get("distribution-network")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async distribution(@Query("organizationId") organizationId?: string) {
    const org = await this.gate(organizationId);
    return this.distributionSvc.network(org);
  }

  @Get("market-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async marketPressure(@Query("organizationId") organizationId?: string) {
    const org = await this.gate(organizationId);
    return this.pressureSvc.snapshot(org);
  }

  @Get("territory-opportunities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async territory(
    @Query("organizationId") organizationId?: string,
    @Query("mode") mode?: string,
  ) {
    const org = await this.gate(organizationId);
    const allowed: TerritoryMapMode[] = ["opportunity", "risk", "sponsorship", "network", "signal"];
    const m = (allowed.includes(mode as TerritoryMapMode) ? mode : "opportunity") as TerritoryMapMode;
    return this.territorySvc.territoryMap(org, m);
  }

  @Get("risk-matrix")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async risk(@Query("organizationId") organizationId?: string) {
    const org = await this.gate(organizationId);
    return this.riskSvc.matrix(org);
  }

  @Get("briefing")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async briefing(@Query("organizationId") organizationId?: string) {
    const org = await this.gate(organizationId);
    return this.briefingSvc.briefing(org);
  }

  @Get("executive-queue")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveQueue(@Query("organizationId") organizationId?: string) {
    const org = await this.gate(organizationId);
    return this.actionsSvc.queue(org);
  }
}
