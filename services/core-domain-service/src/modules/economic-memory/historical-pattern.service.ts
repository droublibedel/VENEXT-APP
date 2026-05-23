import { Injectable } from "@nestjs/common";
import type { ShockPatternRow } from "@venext/shared-contracts";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HistoricalPatternService {
  constructor(private readonly prisma: PrismaService) {}

  async shockPatterns(organizationId: string, days = 30): Promise<ShockPatternRow[]> {
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await this.prisma.economicEventMemory.groupBy({
      by: ["eventType"],
      where: { organizationId, createdAt: { gte: since }, eventType: { startsWith: "propagation_shock." } },
      _count: { _all: true },
    });
    const max = Math.max(1, ...rows.map((r) => r._count._all));
    return rows
      .map((r) => ({
        shockType: r.eventType.replace(/^propagation_shock\./, ""),
        count30d: r._count._all,
        frequencyIndex: Number(Math.min(1, r._count._all / max).toFixed(3)),
      }))
      .sort((a, b) => b.count30d - a.count30d)
      .slice(0, 32);
  }
}
