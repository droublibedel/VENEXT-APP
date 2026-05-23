import { Injectable } from "@nestjs/common";
import type { SeasonalPressure, TerritoryActivationRadarResponse, TerritoryActivationRow } from "@venext/shared-contracts";
import { PrismaService } from "../../prisma/prisma.service";
import type { CommercialNetworkContext } from "../commercial-network-intelligence/commercial-network-context.service";
import type { SponsoredInjectionListSnapshot } from "../sponsorship-pressure/sponsorship-pressure.service";

@Injectable()
export class TerritoryActivationRadarService {
  constructor(private readonly prisma: PrismaService) {}

  async fromContext(
    ctx: CommercialNetworkContext,
    snapshot: SponsoredInjectionListSnapshot | null,
    enabled: boolean,
    seasonalPressure: SeasonalPressure,
  ): Promise<TerritoryActivationRadarResponse> {
    const orgId = ctx.organizationId;
    if (!enabled) {
      return {
        generatedAt: ctx.generatedAt,
        organizationId: orgId,
        policy: "DISABLED",
        rows: [],
        risingCorridors: [],
        dormantRegions: [],
        seasonalPressure,
      };
    }

    const t30 = new Date(Date.now() - 30 * 86400000);
    const territoryOrderPulse = new Map<string, number>();
    const territoryNegHeat = new Map<string, number>();
    const cpGeo = new Map(ctx.partnersPack.counterparties.map((c) => [c.id, `${c.country ?? "?"}/${c.city ?? "?"}`]));

    for (const o of ctx.orders30d) {
      const other = o.buyerOrganizationId === orgId ? o.sellerOrganizationId : o.buyerOrganizationId;
      const k = cpGeo.get(other) ?? "unknown";
      territoryOrderPulse.set(k, (territoryOrderPulse.get(k) ?? 0) + 1);
    }

    const negRows = await this.prisma.negotiation.findMany({
      where: {
        OR: [{ buyerOrganizationId: orgId }, { sellerOrganizationId: orgId }],
        createdAt: { gte: t30 },
      },
      select: { buyerOrganizationId: true, sellerOrganizationId: true },
      take: 2000,
    });
    for (const n of negRows) {
      const other = n.buyerOrganizationId === orgId ? n.sellerOrganizationId : n.buyerOrganizationId;
      const k = cpGeo.get(other) ?? "unknown";
      territoryNegHeat.set(k, (territoryNegHeat.get(k) ?? 0) + 1);
    }

    const sponsorshipSpread = new Map<string, number>();
    if (snapshot) {
      for (const it of snapshot.items) {
        const k = `${it.sponsor.country ?? "?"}/${it.sponsor.city ?? "?"}`;
        sponsorshipSpread.set(k, (sponsorshipSpread.get(k) ?? 0) + 1);
      }
    }

    const keys = new Set([...territoryOrderPulse.keys(), ...territoryNegHeat.keys(), ...sponsorshipSpread.keys()]);
    const rows: TerritoryActivationRow[] = [];
    for (const territoryKey of keys) {
      if (territoryKey === "unknown") continue;
      const orderPulse = territoryOrderPulse.get(territoryKey) ?? 0;
      const negH = territoryNegHeat.get(territoryKey) ?? 0;
      const sp = sponsorshipSpread.get(territoryKey) ?? 0;
      const seasonalBoost = seasonalPressure.affectedTerritories.includes(territoryKey)
        ? seasonalPressure.intensity * 0.12
        : 0;
      const stimulationScore = Number(
        Math.min(1, orderPulse / 12 + negH / 20 + sp / 10 + seasonalBoost).toFixed(3),
      );
      let state: TerritoryActivationRow["state"] = "weak";
      if (stimulationScore > 0.55) state = "rising";
      else if (stimulationScore < 0.12) state = "dormant";
      else if (sp > orderPulse * 1.4) state = "saturated";
      else if (orderPulse > 4 && negH > 2) state = "corridor";
      const label = territoryKey.replace("/", " · ");
      rows.push({
        territoryKey,
        label,
        stimulationScore,
        orderPulse,
        sponsorshipSpread: sp,
        negotiationHeat: negH,
        state,
      });
    }
    rows.sort((a, b) => b.stimulationScore - a.stimulationScore);

    const risingCorridors = rows.filter((r) => r.state === "rising" || r.state === "corridor").map((r) => r.territoryKey);
    const dormantRegions = rows.filter((r) => r.state === "dormant").map((r) => r.territoryKey);

    return {
      generatedAt: ctx.generatedAt,
      organizationId: orgId,
      policy: "ACTIVE",
      rows: rows.slice(0, 24),
      risingCorridors: risingCorridors.slice(0, 8),
      dormantRegions: dormantRegions.slice(0, 8),
      seasonalPressure,
    };
  }
}
