/**
 * Instruction 18.5 — economic command executive readout (advisory only).
 */
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { OrganizationActorType, OrganizationCategory } from "@prisma/client";
import {
  EconomicCommandBundleSchema,
  buildEconomicCommandSliceDiagnostics,
  type EconomicCommandProjectionMode,
} from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { EconomicCommandEngineService } from "./economic-command-engine.service";

@Controller("economic-command")
@UseGuards(VenextAuthzGuard)
export class EconomicCommandController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly engine: EconomicCommandEngineService,
  ) {}

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("economic_command_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "economic_command_disabled" });
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
    if (!ok) throw new ForbiddenException({ code: "economic_command_producer_scope_required" });
  }

  private sliceEnvelope<T>(data: T, composeCacheHit: boolean) {
    return { data, sliceDiagnostics: buildEconomicCommandSliceDiagnostics(composeCacheHit) };
  }

  private parseProjection(raw: string | undefined): EconomicCommandProjectionMode {
    return raw === "full" ? "full" : "summary";
  }

  private async loadBundle(org: string, projection: EconomicCommandProjectionMode) {
    return this.engine.getBundleWithCacheMeta(org, projection);
  }

  /**
   * HTTP slice routes below are convenience views, not cheaper server queries.
   * Each handler calls `loadBundle` → full economic-command compose (propagation + coordination subgraph, etc.);
   * TTL cache may hit, but there is no independent “slice-only” compute path.
   */
  @Get("overview")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    return this.sliceEnvelope(bundle.overview, composeCacheHit);
  }

  @Get("pressure-zones")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async pressureZones(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    return this.sliceEnvelope(bundle.pressureZones, composeCacheHit);
  }

  @Get("risks")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async risks(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    const on = await this.flags.isEnabled("economic_command_risk_enabled", { organizationId: org });
    return this.sliceEnvelope(on ? bundle.decisionRisks : [], composeCacheHit);
  }

  @Get("arbitrations")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async arbitrations(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    const on = await this.flags.isEnabled("economic_command_arbitration_enabled", { organizationId: org });
    return this.sliceEnvelope(on ? bundle.arbitrations : [], composeCacheHit);
  }

  @Get("tensions")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async tensions(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    const on = await this.flags.isEnabled("economic_command_tension_enabled", { organizationId: org });
    return this.sliceEnvelope(on ? bundle.silentTensions : [], composeCacheHit);
  }

  @Get("narrative")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async narrative(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    return this.sliceEnvelope(bundle.narrative, composeCacheHit);
  }

  @Get("stress")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async stress(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    return this.sliceEnvelope(bundle.systemStress, composeCacheHit);
  }

  @Get("bundle")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bundle(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org, projection);
    const parsed = EconomicCommandBundleSchema.safeParse(bundle);
    if (!parsed.success) {
      throw new BadRequestException({ code: "economic_command_bundle_contract_invalid", issues: parsed.error.flatten() });
    }
    return {
      ...parsed.data,
      diagnostics: {
        ...parsed.data.diagnostics,
        composeCacheHit,
      },
    };
  }
}
