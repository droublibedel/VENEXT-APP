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
import { DataIntelligenceBundleService } from "./data-intelligence-bundle.service";

@Controller("data-intelligence")
@UseGuards(VenextAuthzGuard)
export class DataIntelligenceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly bundleSvc: DataIntelligenceBundleService,
  ) {}

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("data_intelligence_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "data_intelligence_disabled" });
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
    if (!ok) throw new ForbiddenException({ code: "data_intelligence_producer_scope_required" });
  }

  private async pack(organizationId: string) {
    return this.bundleSvc.compose(organizationId);
  }

  @Get("overview")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org)).overview;
  }

  @Get("ontology")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async ontology(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org)).ontology;
  }

  @Get("correlations")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async correlations(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org)).correlations;
  }

  @Get("anomalies")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async anomalies(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org)).anomalies;
  }

  @Get("predictive-signals")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async predictive(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org)).predictiveSignals;
  }

  @Get("territory-intelligence")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async territory(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org)).territoryIntelligence;
  }

  @Get("graph-intelligence")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async graph(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org)).graphIntelligence;
  }

  @Get("decision-simulation")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async simulation(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org)).decisionSimulation;
  }

  @Get("economic-score")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async score(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org)).economicScore;
  }

  @Get("data-quality")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async quality(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org)).dataQuality;
  }

  @Get("briefing")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async briefing(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org)).briefing;
  }

  @Get("interventions")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async interventions(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org)).interventions;
  }

  @Get("bundle")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bundle(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return this.bundleSvc.bundle(org);
  }
}
