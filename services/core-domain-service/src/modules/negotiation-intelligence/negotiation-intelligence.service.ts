import { Injectable } from "@nestjs/common";
import { NegotiationStatus, OrderStatus } from "@prisma/client";
import type { NegotiationIntelligenceResponse, NegotiationIntelligenceRow } from "@venext/shared-contracts";
import type { OrderAdvRawSnapshot } from "../order-adv-intelligence/order-adv-data.service";

@Injectable()
export class NegotiationIntelligenceService {
  build(
    snapshot: OrderAdvRawSnapshot,
    enabled: boolean,
    sponsoredProductIds: ReadonlySet<string> = new Set(),
  ): NegotiationIntelligenceResponse {
    const { organizationId, generatedAt, negotiations, orders } = snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        unstableNegotiations: 0,
        negotiationBursts24h: 0,
        rows: [],
        moduleNote: "negotiation_intelligence_enabled",
      };
    }

    const outcomeByProduct = new Map<string, { accepted: number; total: number }>();
    for (const n of negotiations) {
      const cur = outcomeByProduct.get(n.productId) ?? { accepted: 0, total: 0 };
      cur.total += 1;
      if (n.status === NegotiationStatus.ACCEPTED) cur.accepted += 1;
      outcomeByProduct.set(n.productId, cur);
    }

    const ordersOnProductId = (productId: string) =>
      orders.filter(
        (o) =>
          o.status !== OrderStatus.CANCELLED && o.items.some((it) => it.product.id === productId),
      ).length;

    const since24 = Date.now() - 24 * 3600000;
    const negotiationBursts24h = negotiations.filter(
      (n) => n.createdAt.getTime() >= since24 && n.status !== NegotiationStatus.CONVERTED_TO_CART,
    ).length;

    const rows: NegotiationIntelligenceRow[] = negotiations.slice(0, 40).map((n) => {
      const durationHours = (n.updatedAt.getTime() - n.createdAt.getTime()) / 3600000;
      const counterOfferBursts = n.status === NegotiationStatus.PROPOSED ? 1 : n.updatedAt.getTime() - n.createdAt.getTime() > 3600000 ? 2 : 0;
      const priceTension = n.proposedPrice != null ? 0.45 : 0.2;
      const retailerSensitivity = n.buyerOrganizationId === organizationId ? 0.35 : 0.55;
      const ordersOnProduct = ordersOnProductId(n.productId);

      const pairDepth = orders.filter(
        (o) =>
          o.status !== OrderStatus.CANCELLED &&
          o.items.some((it) => it.product.id === n.productId) &&
          ((o.buyerOrganizationId === n.buyerOrganizationId && o.sellerOrganizationId === n.sellerOrganizationId) ||
            (o.buyerOrganizationId === n.sellerOrganizationId && o.sellerOrganizationId === n.buyerOrganizationId)),
      ).length;

      const outcome = outcomeByProduct.get(n.productId) ?? { accepted: 0, total: 0 };
      const priorAcceptRatio = outcome.total > 0 ? outcome.accepted / outcome.total : 0.32;
      const ageDecay = Math.max(0.12, 1 - Math.min(1, durationHours / 220));
      const sponsorBoost = sponsoredProductIds.has(n.productId) ? 0.09 : 0;
      let conversionProbability =
        0.16 +
        priorAcceptRatio * 0.3 +
        Math.min(0.32, ordersOnProduct * 0.038) +
        sponsorBoost +
        ageDecay * 0.11 +
        pairDepth * 0.04;
      if (n.status === NegotiationStatus.ACCEPTED) conversionProbability += 0.44;
      if (n.status === NegotiationStatus.REJECTED || n.status === NegotiationStatus.EXPIRED) conversionProbability *= 0.42;
      conversionProbability = Math.min(1, conversionProbability);

      const relationshipStrengthProxy = Number(Math.min(1, 0.24 + pairDepth * 0.09 + (n.status === NegotiationStatus.PROPOSED ? 0.08 : 0)).toFixed(3));
      const stalled = n.status === NegotiationStatus.OPEN && durationHours > 48;
      const sponsorshipAssisted = sponsoredProductIds.has(n.productId);

      return {
        negotiationId: n.id,
        productId: n.productId,
        status: String(n.status),
        durationHours: Number(durationHours.toFixed(2)),
        counterOfferBursts,
        priceTension: Number(priceTension.toFixed(3)),
        retailerSensitivity: Number(retailerSensitivity.toFixed(3)),
        sponsorshipAssisted,
        stalled,
        conversionProbability: Number(conversionProbability.toFixed(3)),
        relationshipStrengthProxy,
      };
    });

    const unstableNegotiations = rows.filter(
      (r) => r.stalled || r.priceTension > 0.42 || (r.status === "PROPOSED" && r.durationHours > 24),
    ).length;

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      unstableNegotiations,
      negotiationBursts24h,
      rows,
      moduleNote: "Negotiation supervision — product-scoped orders, sponsored lane, prior acceptance envelope.",
    };
  }
}
