import { Injectable, NotFoundException } from "@nestjs/common";
import { OrganizationCategory, OrganizationVerificationStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { BackofficeAuditLogService } from "../backoffice-audit-log/backoffice-audit-log.service";

@Injectable()
export class BackofficeEcosystemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly canonical: CanonicalFeatureFlagEvaluator,
    private readonly audit: BackofficeAuditLogService,
  ) {}

  async listOrganizations(opts: {
    category?: OrganizationCategory;
    take?: number;
    cursor?: string;
  }) {
    const take = Math.min(Math.max(opts.take ?? 40, 1), 100);
    const base = {
      where: opts.category ? { category: opts.category } : {},
      orderBy: { createdAt: "desc" as const },
      take: take + 1,
      include: {
        _count: {
          select: {
            relationshipsUp: true,
            relationshipsDn: true,
            products: true,
            catalogs: true,
          },
        },
      },
    };
    const rows = opts.cursor
      ? await this.prisma.organization.findMany({
          ...base,
          skip: 1,
          cursor: { id: opts.cursor },
        })
      : await this.prisma.organization.findMany(base);
    const hasMore = rows.length > take;
    const pageRows = hasMore ? rows.slice(0, take) : rows;
    const withFlags = await Promise.all(
      pageRows.map(async (o) => {
        const [graph, wallet, sponsored] = await Promise.all([
          this.canonical.evaluate("relationship_graph_enabled", { organizationId: o.id }),
          this.canonical.evaluate("wallet_enabled", { organizationId: o.id }),
          this.canonical.evaluate("sponsored_products_enabled", { organizationId: o.id }),
        ]);
        return {
          ...o,
          relationshipEdgeCount: o._count.relationshipsUp + o._count.relationshipsDn,
          activeCatalogCount: o._count.catalogs,
          productCount: o._count.products,
          featureSurface: { graph, wallet, sponsored },
        };
      }),
    );
    return {
      organizations: withFlags,
      page: { take, nextCursor: hasMore ? pageRows[pageRows.length - 1]?.id ?? null : null, hasMore },
    };
  }

  async patchOrganization(
    actor: string,
    id: string,
    body: {
      verificationStatus?: OrganizationVerificationStatus;
      governanceSuspended?: boolean;
    },
  ) {
    const before = await this.prisma.organization.findUnique({ where: { id } });
    if (!before) throw new NotFoundException(id);
    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        ...(body.verificationStatus != null ? { verificationStatus: body.verificationStatus } : {}),
        ...(body.governanceSuspended != null ? { governanceSuspended: body.governanceSuspended } : {}),
      },
    });
    await this.audit.append({
      actor,
      action: "organization_governance_patch",
      target: id,
      before,
      after: updated,
    });
    return updated;
  }
}
