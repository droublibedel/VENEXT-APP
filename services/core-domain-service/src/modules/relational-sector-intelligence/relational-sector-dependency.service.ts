import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalSectorPolicyService } from "./relational-sector-policy.service";

/**
 * Instruction 20.23 — sector dependency graph materialization (corridor-local, deterministic).
 */
@Injectable()
export class RelationalSectorDependencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalSectorPolicyService,
  ) {}

  async rebuildDependenciesForRelationship(
    relationshipId: string,
    nodes: { id: string; sectorSlug: string }[],
    sharedPressure: number,
  ): Promise<void> {
    const ids = nodes.map((n) => n.id);
    if (ids.length === 0) return;
    await this.prisma.relationalSectorDependency.deleteMany({
      where: {
        OR: [{ sourceSectorId: { in: ids } }, { targetSectorId: { in: ids } }],
      },
    });
    if (nodes.length < 2) return;
    const [a, b] = nodes;
    if (!a || !b) return;
    const strength = this.policy.clampInt(sharedPressure + 12);
    const prob = Math.min(1, strength / 100);
    await this.prisma.relationalSectorDependency.create({
      data: {
        sourceSectorId: a.id,
        targetSectorId: b.id,
        dependencyType: "CROSS_SECTOR_EXPOSURE",
        dependencyStrength: strength,
        propagationProbability: prob,
        riskTransferScore: this.policy.clampInt(strength * 0.85),
        sharedPressureScore: this.policy.clampInt(sharedPressure),
        diagnostics: { relationshipId, pair: [a.sectorSlug, b.sectorSlug] } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }

  async listDependenciesForRelationship(relationshipId: string) {
    const nodes = await this.prisma.relationalSectorNode.findMany({
      where: { relationshipId },
      select: { id: true },
    });
    const ids = nodes.map((n) => n.id);
    if (ids.length === 0) return [];
    return this.prisma.relationalSectorDependency.findMany({
      where: {
        OR: [{ sourceSectorId: { in: ids } }, { targetSectorId: { in: ids } }],
      },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
  }
}
