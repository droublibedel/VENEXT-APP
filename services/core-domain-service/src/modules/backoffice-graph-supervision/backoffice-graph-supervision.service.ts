import { Injectable, NotFoundException } from "@nestjs/common";
import { RelationshipStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { BackofficeAuditLogService } from "../backoffice-audit-log/backoffice-audit-log.service";

@Injectable()
export class BackofficeGraphSupervisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: BackofficeAuditLogService,
  ) {}

  async listRelationships(opts: { status?: RelationshipStatus; take?: number; cursor?: string }) {
    const take = Math.min(Math.max(opts.take ?? 50, 1), 150);
    const base = {
      where: opts.status ? { status: opts.status } : {},
      orderBy: { createdAt: "desc" as const },
      take: take + 1,
      include: {
        requester: { select: { id: true, displayName: true, commercialId: true, category: true } },
        receiver: { select: { id: true, displayName: true, commercialId: true, category: true } },
        upstreamOrg: { select: { id: true, displayName: true, commercialId: true } },
        downstreamOrg: { select: { id: true, displayName: true, commercialId: true } },
        _count: { select: { productVisibility: true } },
      },
    };
    const rows = opts.cursor
      ? await this.prisma.relationship.findMany({
          ...base,
          skip: 1,
          cursor: { id: opts.cursor },
        })
      : await this.prisma.relationship.findMany(base);
    const hasMore = rows.length > take;
    const pageRows = hasMore ? rows.slice(0, take) : rows;
    const suggestionDensity = await this.prisma.contactSuggestion.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const highTrustPending = await this.prisma.relationship.count({
      where: { status: RelationshipStatus.PENDING, trustLevel: { gte: 0.92 } },
    });
    const suspiciousPatterns = [
      ...(highTrustPending > 0
        ? [{ code: "HIGH_TRUST_PENDING", count: highTrustPending, detail: "Pending edges with unusually high trust." }]
        : []),
    ];
    return {
      relationships: pageRows.map((r) => ({
        ...r,
        catalogVisibilityRows: r._count.productVisibility,
      })),
      contactSuggestionHistogram: suggestionDensity,
      suspiciousPatterns,
      page: { take, hasMore, nextCursor: hasMore ? pageRows[pageRows.length - 1]?.id ?? null : null },
    };
  }

  async patchRelationship(actor: string, id: string, body: { status: RelationshipStatus }) {
    const before = await this.prisma.relationship.findUnique({ where: { id } });
    if (!before) throw new NotFoundException(id);
    const updated = await this.prisma.relationship.update({
      where: { id },
      data: { status: body.status },
    });
    await this.audit.append({
      actor,
      action: "relationship_status_change",
      target: id,
      before,
      after: updated,
    });
    return updated;
  }
}
