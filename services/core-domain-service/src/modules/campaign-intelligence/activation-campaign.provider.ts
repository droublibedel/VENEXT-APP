import { Injectable } from "@nestjs/common";
import type { ActivationCampaignRow } from "@venext/shared-contracts";
import type { CommercialNetworkContext } from "../commercial-network-intelligence/commercial-network-context.service";
import type { SponsoredInjectionListSnapshot } from "../sponsorship-pressure/sponsorship-pressure.service";

/**
 * Instruction 13A — activation campaign rows are composed here (not inline literals in the intelligence service).
 */
@Injectable()
export class ActivationCampaignProvider {
  listCampaigns(ctx: CommercialNetworkContext, snapshot: SponsoredInjectionListSnapshot | null, waveA: number, waveB: number): ActivationCampaignRow[] {
    const inj = snapshot?.items.length ?? 0;
    const territoryTally = new Map<string, number>();
    for (const o of ctx.orders30d) {
      const other = o.buyerOrganizationId === ctx.organizationId ? o.sellerOrganizationId : o.buyerOrganizationId;
      const cp = ctx.partnersPack.counterparties.find((x) => x.id === other);
      const k = cp ? `${cp.country ?? "?"}/${cp.city ?? "?"}` : "field-derived";
      territoryTally.set(k, (territoryTally.get(k) ?? 0) + 1);
    }
    const topTerritories = [...territoryTally.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([k]) => k);

    return [
      {
        id: "act-wave-recent",
        label: "Recent order excitation wave",
        kind: "activation_wave",
        efficiency: Number(Math.min(1, waveA / Math.max(10, waveB + 1)).toFixed(3)),
        decayIndex: Number((waveA < waveB * 0.35 ? 0.62 : 0.22).toFixed(3)),
        territoryKeys: topTerritories.length ? topTerritories : ["field-derived"],
        status: waveA >= waveB ? "active" : "cooling",
      },
      {
        id: "sponsor-lattice",
        label: "Sponsored propagation lattice",
        kind: "sponsorship_wave",
        efficiency: Number(Math.min(1, inj / 18 + 0.25).toFixed(3)),
        decayIndex: Number((inj > 24 ? 0.48 : 0.2).toFixed(3)),
        territoryKeys: snapshot?.items.slice(0, 3).map((i) => `${i.sponsor.country ?? "?"}/${i.sponsor.city ?? "?"}`) ?? [],
        status: inj > 30 ? "weak" : "active",
      },
      {
        id: "territory-push-derived",
        label: "Territory stimulation sweep (provider-derived)",
        kind: "territory_push",
        efficiency: Number((0.35 + ctx.orders30d.length / 80).toFixed(3)),
        decayIndex: 0.31,
        territoryKeys: ctx.orders30d.length ? topTerritories.slice(0, 3) : [],
        status: ctx.orders30d.length < 3 ? "declining" : "active",
      },
    ];
  }
}
