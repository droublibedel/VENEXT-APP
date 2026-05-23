import { Injectable } from "@nestjs/common";
import type { SponsorshipObservatoryResponse } from "@venext/shared-contracts";
import { SponsoredInjectionEngineService } from "../relational-commerce/sponsored-injection-engine.service";
import { CommercialNetworkContext } from "../commercial-network-intelligence/commercial-network-context.service";

@Injectable()
export class SponsorshipObservatoryService {
  constructor(private readonly sponsored: SponsoredInjectionEngineService) {}

  async fromContext(ctx: CommercialNetworkContext, sponsorshipEnabled: boolean): Promise<SponsorshipObservatoryResponse> {
    if (!sponsorshipEnabled) {
      return {
        generatedAt: ctx.generatedAt,
        organizationId: ctx.organizationId,
        policy: "DISABLED",
        engineReuse: "SponsoredInjectionEngineService",
      };
    }

    const list = await this.sponsored.listActiveInjections({
      viewerOrganizationId: ctx.organizationId,
      limit: 80,
      projection: "summary",
    });

    const n = list.items.length;
    const pressureIndex = Math.min(1, n / 25);
    const penetration = Math.min(1, n / Math.max(8, ctx.partnersPack.counterparties.length));
    const territoryImpact = aggregateTerritory(ctx, list.items);

    return {
      generatedAt: ctx.generatedAt,
      organizationId: ctx.organizationId,
      policy: "ACTIVE",
      pressureIndex: Number(pressureIndex.toFixed(3)),
      sponsoredProductPenetration: Number(penetration.toFixed(3)),
      overexposureRisk: Number(Math.min(1, pressureIndex * 1.15).toFixed(3)),
      effectivenessScore: Number(Math.min(1, 0.45 + penetration * 0.4 - pressureIndex * 0.12).toFixed(3)),
      relationshipPenetration: Number(Math.min(1, (list.items.filter((i) => i.maxRelationshipDepth <= 2).length / Math.max(1, n)) * 0.9).toFixed(3)),
      territoryImpact,
      activeInjectionsSample: n,
      engineReuse: "SponsoredInjectionEngineService",
    };
  }
}

function aggregateTerritory(
  ctx: CommercialNetworkContext,
  items: { sponsor: { country?: string | null; city?: string | null } }[],
) {
  const map = new Map<string, number>();
  for (const it of items) {
    const k = `${it.sponsor.country ?? "?"}/${it.sponsor.city ?? "?"}`;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  for (const c of ctx.partnersPack.counterparties) {
    const k = `${c.country ?? "?"}/${c.city ?? "?"}`;
    if (!map.has(k)) map.set(k, 0);
  }
  return [...map.entries()]
    .map(([key, score]) => ({ key, score: Math.min(1, score / 8) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}
