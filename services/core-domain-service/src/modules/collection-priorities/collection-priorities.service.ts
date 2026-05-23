import { Injectable } from "@nestjs/common";
import type { CollectionPriorityItem, CollectionPrioritiesResponse } from "@venext/shared-contracts";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import type { FinanceCollectionsSnapshot } from "../finance-collections-intelligence/finance-collections-data.service";
import { clamp01, daysBetween } from "../finance-collections-intelligence/finance-metrics.util";
import { territoryNormalizedCodeFromOrg } from "../supply-logistics-intelligence/territory-code-normalizer";

@Injectable()
export class CollectionPrioritiesService {
  build(snapshot: FinanceCollectionsSnapshot, poleOn: boolean): CollectionPrioritiesResponse {
    if (!poleOn) {
      return { version: "1", generatedAt: snapshot.generatedAt, organizationId: snapshot.organizationId, policy: "DISABLED", items: [] };
    }
    const now = new Date();
    const scored = snapshot.orders
      .filter(
        (o) =>
          o.status !== OrderStatus.COMPLETED &&
          o.status !== OrderStatus.CANCELLED &&
          o.paymentStatus !== PaymentStatus.PAID,
      )
      .map((o) => {
        const dd = daysBetween(o.createdAt, now);
        const territoryCode = territoryNormalizedCodeFromOrg(o.buyer.city, o.buyer.country);
        const urgency = clamp01(dd / 22 + (1 - o.relationship.trustLevel) * 0.35 + (o.paymentStatus === PaymentStatus.CREDIT ? 0.18 : 0));
        let riskLevel: CollectionPriorityItem["riskLevel"] = "LOW";
        if (urgency > 0.78) riskLevel = "CRITICAL";
        else if (urgency > 0.55) riskLevel = "HIGH";
        else if (urgency > 0.35) riskLevel = "MEDIUM";
        const expectedRecoveryImpact = clamp01(Math.log10(o.totalAmount + 10) / 7 - 0.15 + urgency * 0.25);
        const recommendedAction =
          riskLevel === "CRITICAL" || riskLevel === "HIGH"
            ? "Field collection + milestone settlement before next dispatch."
            : "Structured reminder + electronic proof-of-pay on thread-native lane.";
        const confidence = clamp01(0.52 + o.relationship.trustLevel * 0.22 + (dd > 10 ? 0.12 : 0));
        const rankingBasis = `delay=${dd}d trust=${o.relationship.trustLevel.toFixed(2)} status=${o.paymentStatus} amountBand`;
        const score = urgency * Math.log10(o.totalAmount + 10);
        const item: CollectionPriorityItem = {
          id: `prio-${o.id}`,
          buyerOrganizationId: o.buyerOrganizationId,
          buyerDisplayName: o.buyer.displayName,
          territoryCode,
          amount: o.totalAmount,
          currency: o.currency,
          urgency,
          riskLevel,
          expectedRecoveryImpact,
          recommendedAction,
          confidence,
          rankingBasis,
          rank: 0,
        };
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);
    const items: CollectionPriorityItem[] = scored.map((s, idx) => ({ ...s.item, rank: idx + 1 }));

    return {
      version: "1",
      generatedAt: snapshot.generatedAt,
      organizationId: snapshot.organizationId,
      policy: "ACTIVE",
      items,
    };
  }
}
