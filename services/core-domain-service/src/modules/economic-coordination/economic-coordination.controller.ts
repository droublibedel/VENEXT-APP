/**
 * Instruction 18.4 — economic coordination HTTP surface (orchestration readout only).
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
  EconomicCoordinationBundleSchema,
  buildEconomicCoordinationSliceDiagnostics,
  type EconomicCoordinationProjection,
} from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { EconomicCoordinationEngineService } from "./economic-coordination-engine.service";
import {
  buildDisabledEscalationSlice,
  buildDisabledMemorySlice,
  buildDisabledConflictsSlice,
  buildDisabledOrchestrationSlice,
} from "./economic-coordination-stub-builders";

@Controller("economic-coordination")
@UseGuards(VenextAuthzGuard)
export class EconomicCoordinationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly engine: EconomicCoordinationEngineService,
  ) {}

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("economic_coordination_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "economic_coordination_disabled" });
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
    if (!ok) throw new ForbiddenException({ code: "economic_coordination_producer_scope_required" });
  }

  private sliceEnvelope<T>(data: T, composeCacheHit: boolean) {
    return { data, sliceDiagnostics: buildEconomicCoordinationSliceDiagnostics(composeCacheHit) };
  }

  private parseProjection(raw: string | undefined): EconomicCoordinationProjection {
    return raw === "full" ? "full" : "summary";
  }

  @Get("overview")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    return this.sliceEnvelope(bundle.overview, composeCacheHit);
  }

  @Get("posture")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async posture(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    return this.sliceEnvelope(bundle.posture, composeCacheHit);
  }

  @Get("priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async priorities(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    return this.sliceEnvelope(bundle.priorities, composeCacheHit);
  }

  @Get("conflicts")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async conflicts(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    const on = await this.flags.isEnabled("coordination_conflict_enabled", { organizationId: org });
    return this.sliceEnvelope(on ? bundle.conflicts : buildDisabledConflictsSlice(), composeCacheHit);
  }

  @Get("orchestrations")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async orchestrations(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    const on = await this.flags.isEnabled("coordination_orchestration_enabled", { organizationId: org });
    return this.sliceEnvelope(on ? bundle.orchestrations : buildDisabledOrchestrationSlice(), composeCacheHit);
  }

  @Get("escalation")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async escalation(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    const on = await this.flags.isEnabled("economic_escalation_enabled", { organizationId: org });
    const payload = on ? bundle.escalation : buildDisabledEscalationSlice();
    return this.sliceEnvelope(payload, composeCacheHit);
  }

  @Get("memory")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async memory(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    const on = await this.flags.isEnabled("coordination_memory_enabled", { organizationId: org });
    return this.sliceEnvelope(on ? bundle.memory : buildDisabledMemorySlice(), composeCacheHit);
  }

  @Get("bundle")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bundle(
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org, projection);
    const parsed = EconomicCoordinationBundleSchema.safeParse(bundle);
    if (!parsed.success) {
      throw new BadRequestException({ code: "economic_coordination_bundle_contract_invalid", issues: parsed.error.flatten() });
    }
    const enriched = {
      ...parsed.data,
      sourceMode: "LIVE_COORDINATION_COMPOSE" as const,
      liveComposeDiagnostics: {
        composeCacheHit,
        cacheStrategy: "SHORT_TTL_COORDINATION_CACHE" as const,
        serverCost: "FULL_COMPOSE" as const,
      },
    };
    const reparsed = EconomicCoordinationBundleSchema.safeParse(enriched);
    if (!reparsed.success) {
      throw new BadRequestException({ code: "economic_coordination_bundle_contract_invalid", issues: reparsed.error.flatten() });
    }
    return reparsed.data;
  }
}
