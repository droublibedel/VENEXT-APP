import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { SponsoredInjectionEngineService } from "../relational-commerce/sponsored-injection-engine.service";
import { BackofficeAuditLogService } from "../backoffice-audit-log/backoffice-audit-log.service";

type GovAction = "approve" | "pause" | "reject";

@Injectable()
export class BackofficeSponsoredGovernanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly canonical: CanonicalFeatureFlagEvaluator,
    private readonly injectionEngine: SponsoredInjectionEngineService,
    private readonly audit: BackofficeAuditLogService,
  ) {}

  async listGovernance(opts: { sponsorOrganizationId?: string; take?: number }) {
    const take = Math.min(Math.max(opts.take ?? 80, 1), 200);
    const rows = await this.prisma.sponsoredProductInjection.findMany({
      where: opts.sponsorOrganizationId ? { sponsorOrganizationId: opts.sponsorOrganizationId } : {},
      orderBy: { createdAt: "desc" },
      take,
      include: {
        sponsor: { select: { id: true, displayName: true, commercialId: true, verificationStatus: true, country: true, city: true } },
        product: { select: { id: true, name: true, category: true, sponsorEligible: true } },
        relationship: { select: { id: true, status: true } },
      },
    });
    const globalFlag = await this.canonical.evaluate("sponsored_products_enabled", {});
    const canonicalActiveLane = await this.injectionEngine.listActiveInjections({
      projection: "standard",
      limit: 40,
    });
    return {
      injections: rows.map((r) => ({
        ...r,
        governanceState: (r.governanceState as Record<string, unknown>) ?? {},
        policyReasons: this.policyReasons(r),
      })),
      featureFlag: globalFlag,
      canonicalActiveLane,
    };
  }

  private policyReasons(row: { active: boolean; product: { sponsorEligible: boolean }; sponsor: { verificationStatus: string } }) {
    const reasons: string[] = [];
    if (!row.active) reasons.push("INACTIVE_OR_PAUSED");
    if (!row.product.sponsorEligible) reasons.push("PRODUCT_NOT_SPONSOR_ELIGIBLE");
    if (row.sponsor.verificationStatus !== "VERIFIED") reasons.push("SPONSOR_NOT_VERIFIED");
    return reasons;
  }

  async patchInjection(actor: string, id: string, body: { action: GovAction; note?: string }) {
    const before = await this.prisma.sponsoredProductInjection.findUnique({ where: { id } });
    if (!before) throw new NotFoundException(id);
    if (!["approve", "pause", "reject"].includes(body.action)) {
      throw new BadRequestException("invalid_action");
    }
    const active = body.action === "approve";
    const governanceState = {
      ...((before.governanceState as Record<string, unknown>) ?? {}),
      status: body.action,
      reason: body.note ?? null,
      actor,
      at: new Date().toISOString(),
    };
    const updated = await this.prisma.sponsoredProductInjection.update({
      where: { id },
      data: {
        active,
        governanceState: governanceState as Prisma.InputJsonValue,
      },
    });
    await this.audit.append({
      actor,
      action: "sponsored_injection_governance",
      target: id,
      before,
      after: updated,
      metadata: { action: body.action },
    });
    const evaluated = await this.canonical.evaluate("sponsored_products_enabled", {
      organizationId: updated.sponsorOrganizationId,
    });
    return { injection: updated, evaluated };
  }
}
