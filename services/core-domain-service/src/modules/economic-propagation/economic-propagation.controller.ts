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
import { EconomicPropagationEngineService } from "./economic-propagation-engine.service";
import { parseEconomicPropagationSimulationQuery } from "./economic-propagation-simulation-query";
import { PropagationSimulationService } from "./propagation-simulation.service";

@Controller("economic-propagation")
@UseGuards(VenextAuthzGuard)
export class EconomicPropagationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly engine: EconomicPropagationEngineService,
    private readonly propagationSimulation: PropagationSimulationService,
  ) {}

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("economic_propagation_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "economic_propagation_disabled" });
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
    if (!ok) throw new ForbiddenException({ code: "economic_propagation_producer_scope_required" });
  }

  private async pack(organizationId: string, publishRealtime: boolean) {
    return this.engine.compose(organizationId, publishRealtime);
  }

  @Get("overview")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org, false)).overview;
  }

  @Get("shocks")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async shocks(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org, false)).shocks;
  }

  @Get("chains")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async chains(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org, false)).chains;
  }

  @Get("territory-fragility")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async territoryFragility(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return (await this.pack(org, false)).territoryFragility;
  }

  @Get("simulation")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async simulationQuery(
    @Query("organizationId") organizationId?: string,
    @Query("triggerType") triggerType?: string,
    @Query("territory") territory?: string,
    @Query("severity") severity?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    if (!(await this.flags.isEnabled("propagation_simulation_enabled", { organizationId: org }))) {
      throw new ForbiddenException({ code: "propagation_simulation_disabled" });
    }
    const q = parseEconomicPropagationSimulationQuery({ triggerType: triggerType ?? "shipment_delayed", territory, severity });
    const snap = await this.engine.loadSnapshot(org);
    return this.propagationSimulation.run(snap, {
      triggerType: q.triggerType,
      territory: q.territory,
      severity: q.severity,
    });
  }

  @Get("bundle")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bundle(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return this.pack(org, true);
  }
}
