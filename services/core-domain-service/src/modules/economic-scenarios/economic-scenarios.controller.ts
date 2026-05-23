/**
 * Economic scenarios HTTP surface (Instruction 18.3 / 18.3A / 18.3B).
 *
 * Slice routes mirror the same composed bundle as `GET /bundle`. Each slice response wraps payload in
 * `{ data, sliceDiagnostics }` including `composeCacheHit` when the short-TTL scenario cache was used.
 * `GET /persisted` is a Prisma audit read — it never calls `getBundle` / compose.
 */
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { OrganizationActorType, OrganizationCategory } from "@prisma/client";
import {
  EconomicScenariosBundleSchema,
  buildEconomicScenariosSliceDiagnostics,
} from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { EconomicScenariosEngineService } from "./economic-scenarios-engine.service";
import { decodePersistedScenarioCursor, encodePersistedScenarioCursor } from "./economic-scenarios-persisted-cursor";

@Controller("economic-scenarios")
@UseGuards(VenextAuthzGuard)
export class EconomicScenariosController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly engine: EconomicScenariosEngineService,
  ) {}

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("economic_scenarios_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "economic_scenarios_disabled" });
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
    if (!ok) throw new ForbiddenException({ code: "economic_scenarios_producer_scope_required" });
  }

  private async subGate(organizationId: string, key: string, code: string) {
    if (!(await this.flags.isEnabled(key, { organizationId }))) {
      throw new ForbiddenException({ code });
    }
  }

  private sliceEnvelope<T>(data: T, composeCacheHit: boolean) {
    return { data, sliceDiagnostics: buildEconomicScenariosSliceDiagnostics(composeCacheHit) };
  }

  @Get("overview")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    return this.sliceEnvelope(bundle.overview, composeCacheHit);
  }

  @Get("scenarios")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async scenarios(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    return this.sliceEnvelope(bundle.scenarios, composeCacheHit);
  }

  @Get("trajectories")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async trajectories(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    return this.sliceEnvelope(
      bundle.scenarios.map((s) => ({
        scenarioCode: s.scenarioCode,
        scenarioType: s.scenarioType,
        trajectory: s.trajectory,
      })),
      composeCacheHit,
    );
  }

  @Get("comparisons")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async comparisons(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    return this.sliceEnvelope(bundle.comparisons, composeCacheHit);
  }

  @Get("risk")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async risk(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    await this.subGate(org, "scenario_risk_enabled", "scenario_risk_disabled");
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    return this.sliceEnvelope(
      {
        organizationId: org,
        rows: bundle.scenarios.map((s) => ({
          scenarioCode: s.scenarioCode,
          scenarioType: s.scenarioType,
          risk: s.risk ?? null,
        })),
      },
      composeCacheHit,
    );
  }

  @Get("stabilization")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async stabilization(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    await this.subGate(org, "scenario_stabilization_enabled", "scenario_stabilization_disabled");
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    return this.sliceEnvelope(
      {
        organizationId: org,
        rows: bundle.scenarios.map((s) => ({
          scenarioCode: s.scenarioCode,
          scenarioType: s.scenarioType,
          stabilization: s.stabilization ?? null,
        })),
      },
      composeCacheHit,
    );
  }

  @Get("memory-links")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async memoryLinks(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    await this.subGate(org, "scenario_memory_enabled", "scenario_memory_disabled");
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    return this.sliceEnvelope(
      {
        organizationId: org,
        rows: bundle.scenarios.map((s) => ({
          scenarioCode: s.scenarioCode,
          scenarioType: s.scenarioType,
          memoryLink: s.memoryLink ?? null,
        })),
      },
      composeCacheHit,
    );
  }

  /** Paginated Prisma audit read — never triggers live compose. */
  @Get("persisted")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async persisted(
    @Query("organizationId") organizationId?: string,
    @Query("limit") limitRaw?: string,
    @Query("cursor") cursor?: string,
    @Query("scenarioType") scenarioType?: string,
    @Query("severity") severity?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    let limit = Number.parseInt(limitRaw ?? "25", 10);
    if (!Number.isFinite(limit) || limit < 1) limit = 25;
    if (limit > 100) limit = 100;

    const whereBase: Prisma.EconomicScenarioWhereInput = {
      organizationId: org,
      ...(scenarioType ? { scenarioType } : {}),
      ...(severity ? { severity } : {}),
    };

    let cursorDecoded: { createdAt: Date; id: string } | undefined;
    if (cursor) {
      cursorDecoded = decodePersistedScenarioCursor(cursor);
    }

    const where: Prisma.EconomicScenarioWhereInput = cursorDecoded
      ? {
          AND: [
            whereBase,
            {
              OR: [
                { createdAt: { lt: cursorDecoded.createdAt } },
                { AND: [{ createdAt: cursorDecoded.createdAt }, { id: { lt: cursorDecoded.id } }] },
              ],
            },
          ],
        }
      : whereBase;

    const rowsRaw = await this.prisma.economicScenario.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      select: {
        id: true,
        scenarioCode: true,
        scenarioType: true,
        triggerType: true,
        severity: true,
        projectedRisk: true,
        stabilizationProbability: true,
        createdAt: true,
        _count: { select: { trajectories: true, impacts: true } },
      },
    });

    const hasMore = rowsRaw.length > limit;
    const pageRows = hasMore ? rowsRaw.slice(0, limit) : rowsRaw;
    const last = pageRows[pageRows.length - 1];
    const nextCursor = hasMore && last ? encodePersistedScenarioCursor({ createdAt: last.createdAt, id: last.id }) : null;

    return {
      sourceMode: "PERSISTED_SCENARIO_AUDIT" as const,
      organizationId: org,
      rows: pageRows.map((r) => ({
        id: r.id,
        scenarioCode: r.scenarioCode,
        scenarioType: r.scenarioType,
        triggerType: r.triggerType,
        severity: r.severity,
        projectedRisk: r.projectedRisk,
        stabilizationProbability: r.stabilizationProbability,
        createdAt: r.createdAt.toISOString(),
        trajectoryCount: r._count.trajectories,
        impactCount: r._count.impacts,
      })),
      page: {
        limit,
        nextCursor,
        hasMore,
      },
    };
  }

  @Get("bundle")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bundle(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org);
    const parsed = EconomicScenariosBundleSchema.safeParse(bundle);
    if (!parsed.success) {
      throw new BadRequestException({ code: "economic_scenarios_bundle_contract_invalid", issues: parsed.error.flatten() });
    }
    const enriched = {
      ...parsed.data,
      sourceMode: "LIVE_COMPOSED_SCENARIO" as const,
      liveComposeDiagnostics: {
        composeCacheHit,
        cacheStrategy: "SHORT_TTL_SCENARIO_CACHE" as const,
        serverCost: "FULL_COMPOSE" as const,
      },
    };
    const reparsed = EconomicScenariosBundleSchema.safeParse(enriched);
    if (!reparsed.success) {
      throw new BadRequestException({ code: "economic_scenarios_bundle_contract_invalid", issues: reparsed.error.flatten() });
    }
    return reparsed.data;
  }
}
