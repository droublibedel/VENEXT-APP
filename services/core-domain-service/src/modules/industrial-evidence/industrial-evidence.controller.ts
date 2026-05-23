/**
 * Instruction 18.8 — industrial evidence (provenance / trust / transparency registry).
 * Instruction 18.8A — slice cost semantics + bundle-first contract alignment.
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
  INDUSTRIAL_EVIDENCE_SLICE_COST_HEADER_NAME,
  IndustrialEvidenceBundleSchema,
  buildIndustrialEvidenceSliceCostHeaderValue,
  buildIndustrialEvidenceSliceDiagnostics,
} from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { IndustrialEvidenceEngineService } from "./industrial-evidence-engine.service";

@Controller("industrial-evidence")
@UseGuards(VenextAuthzGuard)
export class IndustrialEvidenceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly engine: IndustrialEvidenceEngineService,
  ) {}

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("industrial_evidence_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "industrial_evidence_disabled" });
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
    if (!ok) throw new ForbiddenException({ code: "industrial_evidence_producer_scope_required" });
  }

  private sliceEnvelope<T>(data: T, composeCacheHit: boolean, degraded: boolean) {
    return {
      data,
      sliceDiagnostics: buildIndustrialEvidenceSliceDiagnostics(composeCacheHit, degraded),
    };
  }

  private setSliceCostHeader(res: Response, composeCacheHit: boolean, degraded: boolean) {
    res.setHeader(INDUSTRIAL_EVIDENCE_SLICE_COST_HEADER_NAME, buildIndustrialEvidenceSliceCostHeaderValue(composeCacheHit, degraded));
  }

  private parseProjection(raw: string | undefined): "summary" | "full" {
    return raw === "full" ? "full" : "summary";
  }

  @Get("bundle")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bundle(@Query("organizationId") organizationId?: string, @Query("projection") projectionRaw?: string) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org, projection);
    const parsed = IndustrialEvidenceBundleSchema.safeParse(bundle);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "industrial_evidence_bundle_contract_invalid",
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

  @Get("trust-matrix")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async trustMatrix(
    @Res({ passthrough: true }) res: Response,
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org, projection);
    const degraded = bundle.snapshot.diagnostics.degradedMode;
    this.setSliceCostHeader(res, composeCacheHit, degraded);
    return this.sliceEnvelope(bundle.snapshot.trustMatrix, composeCacheHit, degraded);
  }

  @Get("traces")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async traces(
    @Res({ passthrough: true }) res: Response,
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org, projection);
    const degraded = bundle.snapshot.diagnostics.degradedMode;
    this.setSliceCostHeader(res, composeCacheHit, degraded);
    return this.sliceEnvelope(bundle.snapshot.traces, composeCacheHit, degraded);
  }

  @Get("limitations")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async limitations(
    @Res({ passthrough: true }) res: Response,
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org, projection);
    const degraded = bundle.snapshot.diagnostics.degradedMode;
    this.setSliceCostHeader(res, composeCacheHit, degraded);
    return this.sliceEnvelope(bundle.snapshot.limitations, composeCacheHit, degraded);
  }

  @Get("source-map")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async sourceMap(
    @Res({ passthrough: true }) res: Response,
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const projection = this.parseProjection(projectionRaw);
    const { bundle, composeCacheHit } = await this.engine.getBundleWithCacheMeta(org, projection);
    const degraded = bundle.snapshot.diagnostics.degradedMode;
    this.setSliceCostHeader(res, composeCacheHit, degraded);
    return this.sliceEnvelope(bundle.snapshot.sourceMap, composeCacheHit, degraded);
  }
}
