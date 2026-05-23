import { Injectable } from "@nestjs/common";
import { OrganizationCategory, RelationshipStatus } from "@prisma/client";
import type { CommercialExpansionMapResponse, ExpansionMapMode } from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { RelationalFlagsService } from "../relational-commerce/relational-flags.service";
import { SponsoredInjectionEngineService } from "../relational-commerce/sponsored-injection-engine.service";
import { CommercialNetworkContext } from "./commercial-network-context.service";

@Injectable()
export class CommercialExpansionMapService {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly relationalFlags: RelationalFlagsService,
    private readonly sponsored: SponsoredInjectionEngineService,
  ) {}

  async fromContext(ctx: CommercialNetworkContext, mode: ExpansionMapMode): Promise<CommercialExpansionMapResponse> {
    if (mode === "sponsorship") {
      return this.buildSponsorshipMap(ctx);
    }
    return Promise.resolve(this.buildStandardCells(ctx, mode));
  }

  private async buildSponsorshipMap(ctx: CommercialNetworkContext): Promise<CommercialExpansionMapResponse> {
    const orgId = ctx.organizationId;
    const [obsOn, sponsoredProductsOn] = await Promise.all([
      this.flags.isEnabled("sponsorship_observatory_enabled", { organizationId: orgId }),
      this.relationalFlags.isEnabled("sponsored_products_enabled", orgId),
    ]);

    if (!obsOn || !sponsoredProductsOn) {
      return {
        generatedAt: ctx.generatedAt,
        organizationId: orgId,
        mode: "sponsorship",
        policy: "DISABLED",
        legend:
          "Sponsorship lattice disabled — requires sponsorship_observatory_enabled and sponsored_products_enabled (Instruction 12A).",
        cells: [],
        controls: [
          "growth",
          "weak_network",
          "sponsorship",
          "retailer_pressure",
          "distributor_density",
          "inactive_territory",
        ],
        mapEngine: "MapControlEngine_layers",
      };
    }

    const list = await this.sponsored.listActiveInjections({
      viewerOrganizationId: orgId,
      limit: 200,
      projection: "standard",
    });

    const cellMap = new Map<
      string,
      { label: string; heat: number; sponsorIds: Set<string>; injectionCount: number; relationshipDensity: number }
    >();

    for (const it of list.items) {
      const sponsor = it.sponsor;
      const key = `${sponsor.country ?? "?"}/${sponsor.city ?? "?"}`;
      const label = `${sponsor.displayName ?? sponsor.id} · ${sponsor.commercialId ?? "sponsor"}`;
      const cur = cellMap.get(key) ?? {
        label,
        heat: 0,
        sponsorIds: new Set<string>(),
        injectionCount: 0,
        relationshipDensity: 0,
      };
      cur.sponsorIds.add(sponsor.id);
      cur.injectionCount += 1;
      cur.heat = Math.min(1, cur.injectionCount / 10);
      cur.label = label;
      cellMap.set(key, cur);
    }

    const relDensityBase = ctx.partnersPack.counterparties.length;
    const cells = [...cellMap.entries()].map(([territoryKey, v]) => ({
      territoryKey,
      label: v.label,
      heat: Number(v.heat.toFixed(3)),
      corridor: v.injectionCount > 6 ? "sponsor_pressure_corridor" : undefined,
      relationshipDensity: Number(Math.min(1, v.sponsorIds.size / Math.max(3, relDensityBase)).toFixed(3)),
    }));
    cells.sort((a, b) => b.heat - a.heat);

    return {
      generatedAt: ctx.generatedAt,
      organizationId: orgId,
      mode: "sponsorship",
      policy: "ACTIVE",
      legend: "Sponsorship heat from SponsoredInjectionEngineService.listActiveInjections — sponsor identity preserved per cell label.",
      cells: cells.slice(0, 24),
      controls: [
        "growth",
        "weak_network",
        "sponsorship",
        "retailer_pressure",
        "distributor_density",
        "inactive_territory",
      ],
      mapEngine: "MapControlEngine_layers",
    };
  }

  private buildStandardCells(ctx: CommercialNetworkContext, mode: ExpansionMapMode): CommercialExpansionMapResponse {
    const cellsMap = new Map<
      string,
      { label: string; orders: number; rels: number; retailers: number; wholesalers: number; trustSum: number; trustN: number }
    >();

    for (const c of ctx.partnersPack.counterparties) {
      const key = [c.country ?? "??", c.city ?? "?"].join("|");
      const cur = cellsMap.get(key) ?? {
        label: `${c.city ?? "Zone"}, ${c.country ?? ""}`.trim(),
        orders: 0,
        rels: 0,
        retailers: 0,
        wholesalers: 0,
        trustSum: 0,
        trustN: 0,
      };
      if (c.category === OrganizationCategory.RETAILER) cur.retailers += 1;
      if (c.category === OrganizationCategory.WHOLESALER_A || c.category === OrganizationCategory.WHOLESALER_B) {
        cur.wholesalers += 1;
      }
      cellsMap.set(key, cur);
    }

    for (const o of ctx.orders30d) {
      const other = o.buyerOrganizationId === ctx.organizationId ? o.sellerOrganizationId : o.buyerOrganizationId;
      const c = ctx.partnersPack.counterparties.find((x) => x.id === other);
      if (!c) continue;
      const key = [c.country ?? "??", c.city ?? "?"].join("|");
      const cur = cellsMap.get(key);
      if (cur) cur.orders += 1;
    }

    for (const e of ctx.partnersPack.edges) {
      if (e.status !== RelationshipStatus.ACCEPTED) continue;
      const other =
        e.upstreamOrganizationId === ctx.organizationId ? e.downstreamOrganizationId : e.upstreamOrganizationId;
      if (!other) continue;
      const c = ctx.partnersPack.counterparties.find((x) => x.id === other);
      if (!c) continue;
      const key = [c.country ?? "??", c.city ?? "?"].join("|");
      const cur = cellsMap.get(key);
      if (cur) {
        cur.rels += 1;
        cur.trustSum += e.trustLevel;
        cur.trustN += 1;
      }
    }

    const cells = [...cellsMap.entries()].map(([territoryKey, v]) => {
      const density = v.rels / Math.max(1, v.wholesalers + v.retailers);
      let heat = 0.35;
      let corridor: string | undefined;

      switch (mode) {
        case "growth":
          heat = Math.min(1, v.orders / 12);
          corridor = v.orders > 6 ? "expansion_corridor" : undefined;
          break;
        case "weak_network":
          heat = Math.min(1, 1 - density);
          break;
        case "retailer_pressure":
          heat = Math.min(1, v.retailers / 6);
          break;
        case "distributor_density":
          heat = Math.min(1, v.wholesalers / 4);
          break;
        case "inactive_territory":
          heat = Math.min(1, v.orders === 0 ? 0.9 : 0.15);
          break;
        default:
          heat = 0.4;
      }

      return {
        territoryKey,
        label: v.label,
        heat: Number(heat.toFixed(3)),
        corridor,
        relationshipDensity: Number(density.toFixed(3)),
      };
    });

    cells.sort((a, b) => b.heat - a.heat);

    return {
      generatedAt: ctx.generatedAt,
      organizationId: ctx.organizationId,
      mode,
      legend: "Tactical lattice — MapControlEngine consumes cells as operational overlays (Instruction 12A).",
      cells: cells.slice(0, 24),
      controls: [
        "growth",
        "weak_network",
        "sponsorship",
        "retailer_pressure",
        "distributor_density",
        "inactive_territory",
      ],
      mapEngine: "MapControlEngine_layers",
    };
  }
}
