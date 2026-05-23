import { Injectable } from "@nestjs/common";
import { OrganizationCategory } from "@prisma/client";
import type { MarketingActivationOverviewResponse, SeasonalPressure } from "@venext/shared-contracts";
import type { CommercialNetworkContext } from "../commercial-network-intelligence/commercial-network-context.service";
import type { SponsoredInjectionListSnapshot } from "../sponsorship-pressure/sponsorship-pressure.service";

@Injectable()
export class MarketingActivationOverviewService {
  fromContext(
    ctx: CommercialNetworkContext,
    snapshot: SponsoredInjectionListSnapshot | null,
    sponsorshipPressure: number,
    seasonalPressure: SeasonalPressure,
  ): MarketingActivationOverviewResponse {
    const orgId = ctx.organizationId;
    const cur = ctx.orders30d.length;
    const prev = ctx.ordersPrev30d.length;
    const activationVelocity = Number(Math.min(1, prev > 0 ? (cur - prev) / (prev + 3) + 0.35 : cur / 20).toFixed(3));
    const retailers = ctx.partnersPack.counterparties.filter((c) => c.category === OrganizationCategory.RETAILER);
    const retailerTouches = new Set<string>();
    for (const o of ctx.orders30d) {
      const other = o.buyerOrganizationId === orgId ? o.sellerOrganizationId : o.buyerOrganizationId;
      if (retailers.some((r) => r.id === other)) retailerTouches.add(other);
    }
    const retailerEngagementLevel = Number(Math.min(1, retailerTouches.size / Math.max(3, retailers.length || 1)).toFixed(3));
    const inj = snapshot?.items.length ?? 0;
    const productMomentum = Number(Math.min(1, cur / 25 + inj / 35).toFixed(3));
    const campaignEffectiveness = Number(Math.min(1, 0.42 + activationVelocity * 0.2 - (sponsorshipPressure > 0.75 ? 0.12 : 0)).toFixed(3));
    const territoryStimulation = Number(
      Math.min(1, ctx.orders30d.length / 30 + ctx.negotiations30d / 40 + seasonalPressure.intensity * 0.18).toFixed(3),
    );
    const inactiveActivationZones = Math.max(0, retailers.length - retailerTouches.size);
    const commercialExcitation = Number(Math.min(1, (ctx.negotiations30d + ctx.messageThreads30d) / 80 + activationVelocity * 0.25).toFixed(3));
    const activationConfidence = Number(
      Math.min(
        1,
        0.45 + retailerEngagementLevel * 0.22 + (1 - sponsorshipPressure) * 0.08 + territoryStimulation * 0.18 + seasonalPressure.confidence * 0.05,
      ).toFixed(3),
    );

    const signalStrips: MarketingActivationOverviewResponse["signalStrips"] = [
      {
        id: "strip-sponsor",
        band: "sponsorship_tension",
        tension: sponsorshipPressure,
        vector: sponsorshipPressure > 0.65 ? "compress" : "lateral",
        label: "Sponsor lane pressure",
      },
      {
        id: "strip-velocity",
        band: "order_excitation",
        tension: activationVelocity,
        vector: activationVelocity > 0.5 ? "inbound" : "outbound",
        label: "Order excitation vector",
      },
      {
        id: "strip-retailer",
        band: "downstream_gradient",
        tension: retailerEngagementLevel,
        vector: retailerEngagementLevel < 0.35 ? "compress" : "lateral",
        label: "Retailer engagement gradient",
      },
      {
        id: "strip-seasonal",
        band: "external_seasonal_mock",
        tension: seasonalPressure.intensity,
        vector: seasonalPressure.intensity > 0.55 ? "compress" : "lateral",
        label: "Seasonal / external (MOCK_CONTEXT)",
      },
    ];

    return {
      generatedAt: ctx.generatedAt,
      organizationId: orgId,
      sponsorshipPressure,
      activationVelocity,
      retailerEngagementLevel,
      productMomentum,
      campaignEffectiveness,
      territoryStimulation,
      inactiveActivationZones,
      commercialExcitation,
      activationConfidence,
      signalStrips,
      seasonalPressure,
    };
  }
}
