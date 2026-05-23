/**
 * Instruction 18.7 — industrial operational continuity (symbolic stability layer above situation room).
 */
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Query,
  UseGuards,
} from "@nestjs/common";
import { OrganizationActorType, OrganizationCategory } from "@prisma/client";
import {
  INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER,
  IndustrialOperationalContinuityBundleSchema,
  buildIndustrialOperationalContinuitySliceDiagnostics,
  type IndustrialOperationalContinuityProjectionMode,
} from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { IndustrialOperationalContinuityEngineService } from "./industrial-operational-continuity-engine.service";

@Controller("industrial-operational-continuity")
@UseGuards(VenextAuthzGuard)
export class IndustrialOperationalContinuityController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly engine: IndustrialOperationalContinuityEngineService,
  ) {}

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("industrial_operational_continuity_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "industrial_operational_continuity_disabled" });
    }
    if (!(await this.flags.isEnabled("industrial_situation_room_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "industrial_operational_continuity_requires_situation_room" });
    }
    if (!(await this.flags.isEnabled("economic_command_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "industrial_operational_continuity_requires_economic_command" });
    }
    if (!(await this.flags.isEnabled("economic_coordination_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "industrial_operational_continuity_requires_economic_coordination" });
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
    if (!ok) throw new ForbiddenException({ code: "industrial_operational_continuity_producer_scope_required" });
  }

  private sliceEnvelope<T>(data: T, composeCacheHit: boolean) {
    return { data, sliceDiagnostics: buildIndustrialOperationalContinuitySliceDiagnostics(composeCacheHit) };
  }

  private parseProjection(raw: string | undefined): IndustrialOperationalContinuityProjectionMode {
    return raw === "full" ? "full" : "summary";
  }

  private async loadBundle(org: string, projection: IndustrialOperationalContinuityProjectionMode) {
    return this.engine.getBundleWithCacheMeta(org, projection);
  }

  @Get("stability-states")
  @Header(INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER.name, INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER.value)
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async stabilityStates(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    return this.sliceEnvelope(bundle.stabilityStates, composeCacheHit);
  }

  @Get("pressures")
  @Header(INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER.name, INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER.value)
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async pressures(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    return this.sliceEnvelope(bundle.continuityPressures, composeCacheHit);
  }

  @Get("corridors")
  @Header(INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER.name, INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER.value)
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async corridors(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    return this.sliceEnvelope(bundle.continuityCorridors, composeCacheHit);
  }

  @Get("cadence")
  @Header(INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER.name, INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER.value)
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async cadence(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    return this.sliceEnvelope(bundle.cadenceSignals, composeCacheHit);
  }

  @Get("briefings")
  @Header(INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER.name, INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER.value)
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async briefings(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    return this.sliceEnvelope(bundle.briefings, composeCacheHit);
  }

  @Get("bundle")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bundle(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org, projection);
    const parsed = IndustrialOperationalContinuityBundleSchema.safeParse(bundle);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "industrial_operational_continuity_bundle_contract_invalid",
        issues: parsed.error.flatten(),
      });
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
