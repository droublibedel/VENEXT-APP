import { Injectable } from "@nestjs/common";
import { RelationshipStatus } from "@prisma/client";
import type { CommercialNetworkOverviewResponse } from "@venext/shared-contracts";
import {
  CommercialNetworkContext,
  isRetailerCategory,
  isWholesalerCategory,
} from "./commercial-network-context.service";

@Injectable()
export class CommercialNetworkOverviewService {
  fromContext(ctx: CommercialNetworkContext): CommercialNetworkOverviewResponse {
    const orgMap = new Map(ctx.partnersPack.counterparties.map((c) => [c.id, c]));
    const acceptedEdges = ctx.partnersPack.edges.filter((e) => e.status === RelationshipStatus.ACCEPTED);

    let activeWholesalers = 0;
    let unstableWholesalers = 0;
    for (const c of ctx.partnersPack.counterparties) {
      if (isWholesalerCategory(c.category)) {
        activeWholesalers += 1;
        const edge = acceptedEdges.find(
          (e) =>
            (e.upstreamOrganizationId === ctx.organizationId && e.downstreamOrganizationId === c.id) ||
            (e.downstreamOrganizationId === ctx.organizationId && e.upstreamOrganizationId === c.id),
        );
        if (edge && edge.trustLevel < 0.45) unstableWholesalers += 1;
      }
    }

    const retailerIds = ctx.partnersPack.counterparties.filter((c) => isRetailerCategory(c.category)).map((c) => c.id);
    const flow30 = countFlows(ctx, retailerIds, ctx.orders30d);
    const flowPrev = countFlows(ctx, retailerIds, ctx.ordersPrev30d);
    const retailerGrowthVelocity =
      flowPrev === 0 ? (flow30 > 0 ? 1 : 0) : Math.min(3, (flow30 - flowPrev) / Math.max(1, flowPrev));

    const regionKeys = new Set<string>();
    for (const c of ctx.partnersPack.counterparties) {
      const k = regionKey(c.country, c.city);
      if (k) regionKeys.add(k);
    }
    const activeRegions = new Set<string>();
    for (const o of ctx.orders30d) {
      const other = o.buyerOrganizationId === ctx.organizationId ? o.sellerOrganizationId : o.buyerOrganizationId;
      const org = orgMap.get(other);
      const k = org ? regionKey(org.country, org.city) : "";
      if (k) activeRegions.add(k);
    }
    const inactiveRegions = [...regionKeys].filter((r) => !activeRegions.has(r)).slice(0, 12);

    const accepted30 = ctx.relationships.filter(
      (r) => r.status === RelationshipStatus.ACCEPTED && r.acceptedAt && r.acceptedAt >= new Date(Date.now() - 30 * 86400000),
    ).length;
    const networkExpansionVelocity = Math.min(2.5, accepted30 / 4);

    const denom = ctx.relationships.filter((r) => {
      const s = r.status;
      return s === RelationshipStatus.ACCEPTED || s === RelationshipStatus.PENDING || s === RelationshipStatus.REJECTED;
    }).length;
    const acceptedCount = ctx.relationships.filter((r) => r.status === RelationshipStatus.ACCEPTED).length;
    const relationshipAcceptanceRate = denom === 0 ? 0.72 : acceptedCount / denom;

    const trustAvg =
      acceptedEdges.length === 0
        ? 0.62
        : acceptedEdges.reduce((s, e) => s + e.trustLevel, 0) / acceptedEdges.length;
    const commercialConfidence = Math.min(0.98, Math.max(0.35, trustAvg * 0.92 + (ctx.orders30d.length > 8 ? 0.06 : 0)));

    const sponsorshipInfluenceDensity = Math.min(1, acceptedEdges.length > 0 ? ctx.negotiations30d / (15 * acceptedEdges.length) : 0);
    const negotiationActivityLevel = Math.min(1, ctx.negotiations30d / 25);

    const signalStrips = [
      {
        id: "wholesale-field",
        band: "WHOLESALE",
        intensity: Math.min(1, activeWholesalers / 8),
        label: `${activeWholesalers} active wholesale anchors`,
      },
      {
        id: "tension",
        band: "TENSION",
        intensity: Math.min(1, unstableWholesalers / 4 + (inactiveRegions.length > 4 ? 0.25 : 0)),
        label: `${unstableWholesalers} unstable wholesale edges · ${inactiveRegions.length} quiet regions`,
      },
      {
        id: "velocity",
        band: "RETAIL_VELOCITY",
        intensity: Math.min(1, retailerGrowthVelocity),
        label: "Retailer corridor velocity (30d vs prior)",
      },
      {
        id: "negotiation-pulse",
        band: "NEGOTIATION",
        intensity: negotiationActivityLevel,
        label: `${ctx.negotiations30d} negotiation pulses (30d window, org-scoped buyer/seller)`,
      },
    ];

    return {
      generatedAt: ctx.generatedAt,
      organizationId: ctx.organizationId,
      activeWholesalers,
      unstableWholesalers,
      retailerGrowthVelocity: Number(retailerGrowthVelocity.toFixed(3)),
      inactiveRegions,
      networkExpansionVelocity: Number(networkExpansionVelocity.toFixed(3)),
      relationshipAcceptanceRate: Number(relationshipAcceptanceRate.toFixed(3)),
      commercialConfidence: Number(commercialConfidence.toFixed(3)),
      sponsorshipInfluenceDensity: Number(sponsorshipInfluenceDensity.toFixed(3)),
      negotiationActivityLevel: Number(negotiationActivityLevel.toFixed(3)),
      signalStrips,
    };
  }
}

function regionKey(country: string | null, city: string | null) {
  const c = (country ?? "").trim();
  const t = (city ?? "").trim();
  if (!c && !t) return "";
  return `${c || "??"}/${t || "?"}`;
}

function countFlows(ctx: CommercialNetworkContext, retailerIds: string[], orders: { buyerOrganizationId: string; sellerOrganizationId: string }[]) {
  const set = new Set(retailerIds);
  let n = 0;
  for (const o of orders) {
    if (set.has(o.buyerOrganizationId) || set.has(o.sellerOrganizationId)) n += 1;
  }
  return n;
}
