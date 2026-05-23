import { Injectable } from "@nestjs/common";
import { OrderStatus, OrganizationCategory } from "@prisma/client";
import type { ProductMomentumObservatoryResponse, ProductMomentumRow } from "@venext/shared-contracts";
import { PrismaService } from "../../prisma/prisma.service";
import type { CommercialNetworkContext } from "../commercial-network-intelligence/commercial-network-context.service";
import type { SponsoredInjectionListSnapshot } from "../sponsorship-pressure/sponsorship-pressure.service";

@Injectable()
export class ProductMomentumService {
  constructor(private readonly prisma: PrismaService) {}

  async fromContext(
    ctx: CommercialNetworkContext,
    snapshot: SponsoredInjectionListSnapshot | null,
    enabled: boolean,
  ): Promise<ProductMomentumObservatoryResponse> {
    const orgId = ctx.organizationId;
    if (!enabled) {
      return { generatedAt: ctx.generatedAt, organizationId: orgId, policy: "DISABLED", rows: [] };
    }

    const now = Date.now();
    const t30 = new Date(now - 30 * 86400000);
    const t60 = new Date(now - 60 * 86400000);
    const sponsoredProductIds = new Set(snapshot?.items.map((i) => i.product.id) ?? []);

    const items = await this.prisma.orderItem.findMany({
      where: {
        product: { organizationId: orgId },
        order: {
          sellerOrganizationId: orgId,
          status: { notIn: [OrderStatus.CANCELLED] },
          createdAt: { gte: t60 },
        },
      },
      select: {
        productId: true,
        product: { select: { name: true, category: true } },
        order: { select: { createdAt: true, buyerOrganizationId: true } },
      },
      take: 5000,
    });

    const cur = new Map<string, { name: string; category: string; cur: number; prev: number; buyers: Set<string> }>();
    for (const it of items) {
      const pid = it.productId;
      const row = cur.get(pid) ?? {
        name: it.product.name,
        category: it.product.category,
        cur: 0,
        prev: 0,
        buyers: new Set<string>(),
      };
      const ts = it.order.createdAt.getTime();
      if (ts >= t30.getTime()) {
        row.cur += 1;
        row.buyers.add(it.order.buyerOrganizationId);
      } else {
        row.prev += 1;
      }
      cur.set(pid, row);
    }

    const negCounts = await this.prisma.negotiation.groupBy({
      by: ["productId"],
      where: {
        sellerOrganizationId: orgId,
        createdAt: { gte: t30 },
      },
      _count: { id: true },
    });
    const negMap = new Map(negCounts.map((g) => [g.productId, g._count.id]));

    const retailerN = ctx.partnersPack.counterparties.filter((c) => c.category === OrganizationCategory.RETAILER).length;

    const rows: ProductMomentumRow[] = [];
    for (const [productId, v] of cur) {
      const growth = v.cur - v.prev;
      const momentumScore = Number(Math.min(1, v.cur / 10 + Math.max(0, growth) / 8 + (negMap.get(productId) ?? 0) / 12).toFixed(3));
      let state: ProductMomentumRow["state"] = "stable";
      if (growth >= 3) state = "rising";
      else if (growth <= -2) state = "declining";
      else if (v.cur >= 8 && growth > 0) state = "spike";
      else if (v.cur === 0 && v.prev > 0) state = "stagnant";
      else if (v.cur > 0 && growth === 0 && (negMap.get(productId) ?? 0) > 2) state = "seasonal";

      rows.push({
        productId,
        name: v.name,
        category: v.category,
        momentumScore,
        orderGrowth30d: v.cur,
        priorOrderGrowth30d: v.prev,
        negotiationVelocity: negMap.get(productId) ?? 0,
        sponsorshipAssisted: sponsoredProductIds.has(productId),
        territoryPenetration: Number(Math.min(1, v.buyers.size / Math.max(1, retailerN)).toFixed(3)),
        state,
      });
    }
    rows.sort((a, b) => b.momentumScore - a.momentumScore);

    return {
      generatedAt: ctx.generatedAt,
      organizationId: orgId,
      policy: "ACTIVE",
      rows: rows.slice(0, 40),
    };
  }
}
