import { Injectable } from "@nestjs/common";
import type { EconomicMemoryHistoryRow } from "@venext/shared-contracts";
import type { EconomicPropagationBundle } from "@venext/shared-contracts";
import { PrismaService } from "../../prisma/prisma.service";

function mapEvent(r: {
  id: string;
  eventType: string;
  pole: string;
  territory: string | null;
  severity: string;
  confidence: number;
  createdAt: Date;
  propagationDepth: number | null;
}): EconomicMemoryHistoryRow {
  return {
    id: r.id,
    eventType: r.eventType,
    pole: r.pole,
    territory: r.territory,
    severity: r.severity,
    confidence: r.confidence,
    createdAt: r.createdAt.toISOString(),
    propagationDepth: r.propagationDepth ?? undefined,
  };
}

@Injectable()
export class PropagationHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async recentHistory(organizationId: string, take = 32): Promise<EconomicMemoryHistoryRow[]> {
    const rows = await this.prisma.economicEventMemory.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
    });
    return rows.map((r) =>
      mapEvent({
        id: r.id,
        eventType: r.eventType,
        pole: r.pole,
        territory: r.territory,
        severity: r.severity,
        confidence: r.confidence,
        createdAt: r.createdAt,
        propagationDepth: r.propagationDepth,
      }),
    );
  }

  async territoryHistory(organizationId: string, territory: string, take = 24): Promise<EconomicMemoryHistoryRow[]> {
    const rows = await this.prisma.economicEventMemory.findMany({
      where: { organizationId, territory },
      orderBy: { createdAt: "desc" },
      take,
    });
    return rows.map((r) =>
      mapEvent({
        id: r.id,
        eventType: r.eventType,
        pole: r.pole,
        territory: r.territory,
        severity: r.severity,
        confidence: r.confidence,
        createdAt: r.createdAt,
        propagationDepth: r.propagationDepth,
      }),
    );
  }

  /** Heuristic similarity vs stored shock families (0–1); not econometric. */
  async propagationSimilarity(organizationId: string, bundle: EconomicPropagationBundle): Promise<number> {
    const types = new Set(bundle.shocks.map((s) => s.type));
    if (types.size === 0) return 0;
    const since = new Date(Date.now() - 90 * 86_400_000);
    const past = await this.prisma.economicEventMemory.findMany({
      where: { organizationId, createdAt: { gte: since }, eventType: { startsWith: "propagation_shock." } },
      select: { eventType: true },
      take: 400,
    });
    const pastTypes = new Set(past.map((p) => p.eventType.replace(/^propagation_shock\./, "")));
    let hit = 0;
    for (const t of types) if (pastTypes.has(t)) hit += 1;
    return Number((hit / types.size).toFixed(3));
  }

  async similarCrisisCount(organizationId: string, bundle: EconomicPropagationBundle): Promise<number> {
    const rootTypes = [...new Set(bundle.shocks.map((s) => s.type))];
    if (rootTypes.length === 0) return 0;
    const since = new Date(Date.now() - 180 * 86_400_000);
    return this.prisma.economicPropagationMemory.count({
      where: { organizationId, createdAt: { gte: since }, rootShockType: { in: rootTypes } },
    });
  }
}
