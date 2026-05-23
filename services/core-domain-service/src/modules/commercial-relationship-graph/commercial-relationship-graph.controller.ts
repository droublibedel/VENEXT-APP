/**
 * Instruction 19.1 — commercial relationship graph (closed validated graph, symbolic projection).
 */
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { OrganizationActorType, OrganizationCategory } from "@prisma/client";
import {
  COMMERCIAL_RELATIONSHIP_GRAPH_SLICE_COST_HEADER_NAME,
  CommercialRelationshipGraphBundleSchema,
  buildCommercialRelationshipGraphSliceCostHeaderValue,
  buildCommercialRelationshipGraphSliceDiagnostics,
} from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { CommercialRelationshipGraphEngineService } from "./commercial-relationship-graph-engine.service";

@Controller("commercial-relationship-graph")
@UseGuards(VenextAuthzGuard)
export class CommercialRelationshipGraphController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly engine: CommercialRelationshipGraphEngineService,
  ) {}

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("commercial_relationship_graph_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "commercial_relationship_graph_disabled" });
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
    if (!ok) throw new ForbiddenException({ code: "commercial_relationship_graph_producer_scope_required" });
  }

  private parseProjection(raw: string | undefined): "summary" | "full" {
    return raw === "full" ? "full" : "summary";
  }

  private parseIncludePending(raw: string | undefined): boolean {
    return raw === "true" || raw === "1";
  }

  private setSliceCostHeader(res: Response, composeCacheHit: boolean, degraded: boolean) {
    res.setHeader(
      COMMERCIAL_RELATIONSHIP_GRAPH_SLICE_COST_HEADER_NAME,
      buildCommercialRelationshipGraphSliceCostHeaderValue(composeCacheHit, degraded),
    );
  }

  private sliceEnvelope<T>(data: T, composeCacheHit: boolean, degraded: boolean) {
    return {
      data,
      sliceDiagnostics: buildCommercialRelationshipGraphSliceDiagnostics(composeCacheHit, degraded),
    };
  }

  private async loadParsedBundle(organizationId: string, projection: "summary" | "full", includePending: boolean) {
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(organizationId, projection, {
      includePending,
    });
    const parsed = CommercialRelationshipGraphBundleSchema.safeParse(bundle);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "commercial_relationship_graph_bundle_contract_invalid",
        issues: parsed.error.flatten(),
      });
    }
    const degraded = parsed.data.policy === "DISABLED";
    return { bundle: parsed.data, composeCacheHit, degraded };
  }

  @Get("bundle")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bundle(
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
    @Query("includePending") includePendingRaw?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const includePending = this.parseIncludePending(includePendingRaw);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org, projection, { includePending });
    const parsed = CommercialRelationshipGraphBundleSchema.safeParse(bundle);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "commercial_relationship_graph_bundle_contract_invalid",
        issues: parsed.error.flatten(),
      });
    }
    return {
      ...parsed.data,
      snapshot: {
        ...parsed.data.snapshot,
        diagnostics: {
          ...parsed.data.snapshot.diagnostics,
          composeCacheHit,
        },
      },
    };
  }

  @Get("overview")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(
    @Res({ passthrough: true }) res: Response,
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
    @Query("includePending") includePendingRaw?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const includePending = this.parseIncludePending(includePendingRaw);
    const { bundle, composeCacheHit, degraded } = await this.loadParsedBundle(org, projection, includePending);
    this.setSliceCostHeader(res, composeCacheHit, degraded);
    return this.sliceEnvelope(bundle.snapshot.overview, composeCacheHit, degraded);
  }

  @Get("nodes")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async nodes(
    @Res({ passthrough: true }) res: Response,
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
    @Query("includePending") includePendingRaw?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const includePending = this.parseIncludePending(includePendingRaw);
    const { bundle, composeCacheHit, degraded } = await this.loadParsedBundle(org, projection, includePending);
    this.setSliceCostHeader(res, composeCacheHit, degraded);
    return this.sliceEnvelope(bundle.snapshot.nodes, composeCacheHit, degraded);
  }

  @Get("edges")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async edges(
    @Res({ passthrough: true }) res: Response,
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
    @Query("includePending") includePendingRaw?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const includePending = this.parseIncludePending(includePendingRaw);
    const { bundle, composeCacheHit, degraded } = await this.loadParsedBundle(org, projection, includePending);
    this.setSliceCostHeader(res, composeCacheHit, degraded);
    return this.sliceEnvelope(bundle.snapshot.edges, composeCacheHit, degraded);
  }

  @Get("signals")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async signals(
    @Res({ passthrough: true }) res: Response,
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
    @Query("includePending") includePendingRaw?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const includePending = this.parseIncludePending(includePendingRaw);
    const { bundle, composeCacheHit, degraded } = await this.loadParsedBundle(org, projection, includePending);
    this.setSliceCostHeader(res, composeCacheHit, degraded);
    return this.sliceEnvelope(bundle.snapshot.signals, composeCacheHit, degraded);
  }

  @Get("clusters")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async clusters(
    @Res({ passthrough: true }) res: Response,
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
    @Query("includePending") includePendingRaw?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const includePending = this.parseIncludePending(includePendingRaw);
    const { bundle, composeCacheHit, degraded } = await this.loadParsedBundle(org, projection, includePending);
    this.setSliceCostHeader(res, composeCacheHit, degraded);
    return this.sliceEnvelope(bundle.snapshot.clusters, composeCacheHit, degraded);
  }

  @Get("coverage")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async coverage(
    @Res({ passthrough: true }) res: Response,
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
    @Query("includePending") includePendingRaw?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const includePending = this.parseIncludePending(includePendingRaw);
    const { bundle, composeCacheHit, degraded } = await this.loadParsedBundle(org, projection, includePending);
    this.setSliceCostHeader(res, composeCacheHit, degraded);
    return this.sliceEnvelope(bundle.snapshot.coverage, composeCacheHit, degraded);
  }

  @Get("bridges")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bridges(
    @Res({ passthrough: true }) res: Response,
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
    @Query("includePending") includePendingRaw?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const includePending = this.parseIncludePending(includePendingRaw);
    const { bundle, composeCacheHit, degraded } = await this.loadParsedBundle(org, projection, includePending);
    this.setSliceCostHeader(res, composeCacheHit, degraded);
    return this.sliceEnvelope(bundle.snapshot.bridges, composeCacheHit, degraded);
  }

  @Get("chains")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async chains(
    @Res({ passthrough: true }) res: Response,
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
    @Query("includePending") includePendingRaw?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const includePending = this.parseIncludePending(includePendingRaw);
    const { bundle, composeCacheHit, degraded } = await this.loadParsedBundle(org, projection, includePending);
    this.setSliceCostHeader(res, composeCacheHit, degraded);
    return this.sliceEnvelope(bundle.snapshot.chains, composeCacheHit, degraded);
  }
}
