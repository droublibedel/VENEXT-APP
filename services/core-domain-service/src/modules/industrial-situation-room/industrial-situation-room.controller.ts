/**
 * Instruction 18.6 — industrial situation room (symbolic executive cockpit above economic command).
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
  IndustrialSituationRoomBundleSchema,
  buildIndustrialSituationRoomSliceDiagnostics,
  type IndustrialSituationRoomProjectionMode,
} from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { IndustrialSituationRoomEngineService } from "./industrial-situation-room-engine.service";

@Controller("industrial-situation-room")
@UseGuards(VenextAuthzGuard)
export class IndustrialSituationRoomController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly engine: IndustrialSituationRoomEngineService,
  ) {}

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("industrial_situation_room_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "industrial_situation_room_disabled" });
    }
    if (!(await this.flags.isEnabled("economic_command_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "industrial_situation_room_requires_economic_command" });
    }
    if (!(await this.flags.isEnabled("economic_coordination_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "industrial_situation_room_requires_economic_coordination" });
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
    if (!ok) throw new ForbiddenException({ code: "industrial_situation_room_producer_scope_required" });
  }

  private sliceEnvelope<T>(data: T, composeCacheHit: boolean) {
    return { data, sliceDiagnostics: buildIndustrialSituationRoomSliceDiagnostics(composeCacheHit) };
  }

  private parseProjection(raw: string | undefined): IndustrialSituationRoomProjectionMode {
    return raw === "full" ? "full" : "summary";
  }

  private async loadBundle(org: string, projection: IndustrialSituationRoomProjectionMode) {
    return this.engine.getBundleWithCacheMeta(org, projection);
  }

  /**
   * Slice routes are convenience views over the same `loadBundle` path as the situation-room bundle.
   * Each call may still execute the upstream economic-command compose graph unless caches hit.
   */
  @Get("cells")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async cells(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    return this.sliceEnvelope(bundle.situationCells, composeCacheHit);
  }

  @Get("missions")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async missions(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    return this.sliceEnvelope(bundle.operationalMissions, composeCacheHit);
  }

  @Get("dependencies")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async dependencies(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    return this.sliceEnvelope(bundle.criticalDependencies, composeCacheHit);
  }

  @Get("attention")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async attention(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.loadBundle(org, projection);
    return this.sliceEnvelope(bundle.executiveAttention, composeCacheHit);
  }

  @Get("briefings")
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
    const parsed = IndustrialSituationRoomBundleSchema.safeParse(bundle);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "industrial_situation_room_bundle_contract_invalid",
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
